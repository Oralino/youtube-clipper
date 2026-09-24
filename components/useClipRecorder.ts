import { useEffect, useRef, useState } from "react";
import {
  AUDIO_BPS,
  clipFileName,
  defaultClipName,
  pickRecordingType,
  videoBitrate,
  videoTitleFrom,
} from "../lib/recording.ts";
import { convertInBackground } from "../media/convertInBackground.ts";
import { convertToMp4, type Mp4Conversion } from "../media/convertToMp4.ts";

/** `webm`: the MP4 conversion failed, so the recording was saved as WebM instead. */
export type SaveFailure =
  "unsupported" | "protected" | "ad" | "paused" | "skipped" | "failed" | "webm";

export type SaveStatus =
  | { state: "idle" }
  | { state: "saving"; elapsed: number; total: number }
  | { state: "converting"; progress: number }
  | { state: "saved" }
  | { state: "failed"; reason: SaveFailure };

/** Moments worth announcing to screen readers; the caller words them. */
export type SaveEvent =
  | { type: "started"; total: number }
  | { type: "progress"; elapsed: number; total: number }
  | { type: "converting" }
  | { type: "saved" }
  | { type: "stopped" }
  | { type: "failed"; reason: SaveFailure };

// Firefox names it mozCaptureStream; neither is in TypeScript's DOM types for media elements.
type CapturableVideo = HTMLVideoElement & {
  captureStream?: () => MediaStream;
  mozCaptureStream?: () => MediaStream;
};

// Firefox's content scripts can't encode video, so Firefox converts in the background page. Chrome's
// background is a service worker that can't receive the recording, so Chrome converts here, with the
// software encoder: Chrome only converts when its hardware H.264 encoder has already failed.
const convert: typeof convertInBackground = import.meta.env.FIREFOX
  ? convertInBackground
  : (webm, bitrate, onProgress) =>
      convertToMp4(webm, bitrate, onProgress, { preferSoftware: true });

const SAVED_MS = 2000;
// Long clips get a progress announcement this often; shorter ones only at the start and end.
const ANNOUNCE_EVERY_S = 30;
// Seeks that move the playhead less than this are YouTube's own (buffering, quality switches).
const SKIP_THRESHOLD_S = 1;
// Seeking to the start normally takes well under a second; give up after this.
const SEEK_TIMEOUT_MS = 5000;
// An MP4 recording that hasn't delivered any data by now (Chrome writes a header within about a
// second) has a broken H.264 encoder; the save restarts in WebM.
const MP4_DATA_TIMEOUT_MS = 2500;
// Keeps the file's temporary URL alive long enough for the browser to start the download.
const REVOKE_MS = 60_000;

/**
 * Saves start→end of the video to a file by playing it in real time and recording what plays,
 * so the file has the quality currently selected in the player. Unmounting (closing the panel,
 * changing video) discards a recording in progress without touching playback.
 */
export default function useClipRecorder(
  video: HTMLVideoElement,
  onEvent: (event: SaveEvent) => void,
) {
  const [status, setStatus] = useState<SaveStatus>({ state: "idle" });
  // Ends the recording in progress with the given outcome.
  const finish = useRef<((outcome: Outcome) => void) | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // The MP4 conversion after recording (Firefox), so Stop saving and closing can cancel it.
  const conversion = useRef<Mp4Conversion | null>(null);
  // Set while a failed MP4 recording is shutting down before its WebM retry. `finish` is already
  // cleared then, so Stop saving and closing cancel the retry through this instead.
  const pendingRetry = useRef<{ cancelled: boolean } | null>(null);
  const emit = useRef(onEvent);
  useEffect(() => {
    emit.current = onEvent;
  });

  useEffect(
    () => () => {
      finish.current?.({ kind: "discard", pause: false });
      cancelRetry();
      cancelConversion();
      clearTimeout(savedTimer.current);
    },
    [],
  );

  function fail(reason: SaveFailure) {
    setStatus({ state: "failed", reason });
    emit.current({ type: "failed", reason });
  }

  function saved(file: Blob, name: string) {
    downloadFile(file, name);
    setStatus({ state: "saved" });
    emit.current({ type: "saved" });
    savedTimer.current = setTimeout(() => setStatus({ state: "idle" }), SAVED_MS);
  }

  function cancelRetry(): boolean {
    const retry = pendingRetry.current;
    if (!retry) return false;
    pendingRetry.current = null;
    retry.cancelled = true;
    return true;
  }

  function cancelConversion(): boolean {
    const job = conversion.current;
    if (!job) return false;
    conversion.current = null;
    job.cancel();
    return true;
  }

  /** Turns a WebM recording into an MP4; if that fails, the WebM is saved so the clip isn't lost. */
  function convertAndSave(
    webm: Blob,
    bitrate: number,
    name: (extension: "mp4" | "webm") => string,
  ) {
    let shown = -1;
    setStatus({ state: "converting", progress: 0 });
    emit.current({ type: "converting" });
    const job = convert(webm, bitrate, (progress) => {
      // Re-render per whole percent, not on every progress callback.
      const percent = Math.floor(progress * 100);
      if (percent > shown) {
        shown = percent;
        setStatus({ state: "converting", progress });
      }
    });
    conversion.current = job;
    job.result
      .then((mp4) => {
        if (conversion.current !== job) return;
        conversion.current = null;
        saved(mp4, name("mp4"));
      })
      .catch((error: unknown) => {
        // Cancelled by Stop saving or closing the panel: nothing to report.
        if (conversion.current !== job) return;
        conversion.current = null;
        logError("converting to MP4", error);
        downloadFile(webm, name("webm"));
        fail("webm");
      });
  }

  /**
   * `avoidMp4` is set when an MP4 recording just failed (some PCs' hardware H.264 encoder rejects the
   * job, seen in Chrome 154): the save restarts in WebM and is converted to MP4 afterwards.
   */
  async function save(start: number, end: number, typedName = "", avoidMp4 = false) {
    if (finish.current) return;
    clearTimeout(savedTimer.current);
    const type = pickRecordingType(
      (mime) => !(avoidMp4 && mime.startsWith("video/mp4")) && MediaRecorder.isTypeSupported(mime),
    );
    const capturable = video as CapturableVideo;
    const capture = capturable.captureStream ?? capturable.mozCaptureStream;
    if (!type || !capture) return fail("unsupported");

    const player = video.closest("#movie_player");
    const inAd = () => player?.classList.contains("ad-showing") ?? false;
    if (inAd()) return fail("ad");

    let stream: MediaStream;
    try {
      stream = capture.call(video);
    } catch {
      // Protected (DRM) videos refuse to be captured.
      return fail("protected");
    }
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) {
      stream.getTracks().forEach((track) => track.stop());
      return fail("protected");
    }

    // Firefox's mozCaptureStream moves the sound into the stream; play it back so it's still heard.
    let audio: AudioContext | null = null;
    if (!capturable.captureStream && stream.getAudioTracks().length > 0) {
      audio = new AudioContext();
      audio.createMediaStreamSource(stream).connect(audio.destination);
    }

    const bitrate = videoBitrate(
      video.videoWidth,
      video.videoHeight,
      videoTrack.getSettings().frameRate,
    );
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, {
        mimeType: type.mimeType,
        videoBitsPerSecond: bitrate,
        audioBitsPerSecond: AUDIO_BPS,
      });
    } catch {
      stream.getTracks().forEach((track) => track.stop());
      void audio?.close();
      return fail("unsupported");
    }
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    // MP4 can fail at the encoder even when the browser says it's supported; WebM is the way out.
    const canRetry = type.extension === "mp4";
    const recordingFailed = (cause: unknown) => {
      if (canRetry) return finish.current?.({ kind: "retry", cause });
      logError("recording", cause);
      finish.current?.({ kind: "fail", reason: "failed" });
    };
    recorder.onerror = (event) => recordingFailed((event as ErrorEvent).error ?? event);
    let dataTimer: ReturnType<typeof setTimeout> | undefined;

    const total = end - start;
    let frame = 0;
    let lastQuarter = 0;
    let lastSecond = 0;
    let lastTime = start;

    const onPause = () => {
      if (video.ended) return;
      finish.current?.({ kind: "fail", reason: inAd() ? "ad" : "paused" });
    };
    const onSeeking = () => {
      if (inAd()) return finish.current?.({ kind: "fail", reason: "ad" });
      if (Math.abs(video.currentTime - lastTime) > SKIP_THRESHOLD_S) {
        finish.current?.({ kind: "fail", reason: "skipped" });
      }
    };

    finish.current = (outcome) => {
      finish.current = null;
      clearTimeout(dataTimer);
      cancelAnimationFrame(frame);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("seeking", onSeeking);
      const retry = outcome.kind === "retry" ? { cancelled: false } : null;
      if (retry) pendingRetry.current = retry;
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        void audio?.close();
        if (outcome.kind === "retry") {
          if (retry?.cancelled) return;
          pendingRetry.current = null;
          console.warn(
            "[Clipper for YouTube] MP4 recording failed; saving again in WebM:",
            outcome.cause,
          );
          return void save(start, end, typedName, true);
        }
        if (outcome.kind !== "download") return;
        const blob = new Blob(chunks, { type: type.mimeType });
        if (blob.size === 0) {
          // A clip shorter than the data timeout can end before the check runs.
          if (canRetry) return void save(start, end, typedName, true);
          logError("recording", new Error("the recording is empty"));
          return fail("failed");
        }
        const fallback = defaultClipName(videoTitleFrom(document.title), start, end);
        const name = (extension: "mp4" | "webm") => clipFileName(typedName, fallback, extension);
        if (type.extension === "mp4") saved(blob, name("mp4"));
        else convertAndSave(blob, bitrate, name);
      };
      if (recorder.state !== "inactive") recorder.stop();
      else recorder.onstop?.(new Event("stop"));

      if (
        outcome.kind === "download" ||
        outcome.kind === "retry" ||
        (outcome.kind === "discard" && outcome.pause)
      ) {
        video.pause();
      }
      if (outcome.kind === "fail") fail(outcome.reason);
      if (outcome.kind === "discard" && outcome.pause) {
        setStatus({ state: "idle" });
        emit.current({ type: "stopped" });
      }
    };

    setStatus({ state: "saving", elapsed: 0, total });
    // A WebM retry continues the same save, so it isn't announced again.
    if (!avoidMp4) emit.current({ type: "started", total });
    video.pause();
    if (Math.abs(video.currentTime - start) > 0.05) {
      const seeked = new Promise<boolean>((resolve) => {
        const timer = setTimeout(() => resolve(false), SEEK_TIMEOUT_MS);
        video.addEventListener(
          "seeked",
          () => {
            clearTimeout(timer);
            resolve(true);
          },
          { once: true },
        );
      });
      video.currentTime = start;
      if (!(await seeked)) {
        logError("seeking to the start", new Error("no seeked event within 5s"));
        return finish.current?.({ kind: "fail", reason: "failed" });
      }
    }
    if (!finish.current) return;

    recorder.start(1000);
    if (canRetry) {
      dataTimer = setTimeout(() => {
        if (chunks.length === 0) recordingFailed(new Error("no data from the MP4 encoder"));
      }, MP4_DATA_TIMEOUT_MS);
    }
    try {
      await video.play();
    } catch (error) {
      logError("starting playback", error);
      return finish.current?.({ kind: "fail", reason: "failed" });
    }
    if (!finish.current) return;
    // Only now: pauses from before playback (like a preview stopping) aren't the user's.
    video.addEventListener("pause", onPause);
    video.addEventListener("seeking", onSeeking);

    frame = requestAnimationFrame(function check() {
      if (!finish.current) return;
      if (inAd()) return finish.current({ kind: "fail", reason: "ad" });
      if (video.currentTime >= end || video.ended) return finish.current({ kind: "download" });
      lastTime = video.currentTime;
      // Re-render about 4 times a second (like timeupdate), not every frame.
      const elapsed = Math.min(Math.max(video.currentTime - start, 0), total);
      const quarter = Math.floor(elapsed * 4);
      if (quarter > lastQuarter) {
        lastQuarter = quarter;
        setStatus({ state: "saving", elapsed, total });
        const second = Math.floor(elapsed);
        if (second > lastSecond) {
          lastSecond = second;
          // Not in the last seconds, where it would talk over the end-of-save announcement.
          if (total > ANNOUNCE_EVERY_S && second % ANNOUNCE_EVERY_S === 0 && total - second > 5) {
            emit.current({ type: "progress", elapsed: second, total });
          }
        }
      }
      frame = requestAnimationFrame(check);
    });
  }

  /** "Stop saving": discard the recording (or its conversion) and pause where the video is. */
  function stop() {
    if (cancelRetry() || cancelConversion()) {
      setStatus({ state: "idle" });
      emit.current({ type: "stopped" });
      return;
    }
    finish.current?.({ kind: "discard", pause: true });
  }

  /** Clears a shown error (a new attempt, or the times changed). */
  function clearFailure() {
    setStatus((current) => (current.state === "failed" ? { state: "idle" } : current));
  }

  return { status, save, stop, clearFailure };
}

type Outcome =
  | { kind: "download" }
  /** The MP4 encoder failed: clean up and save again in WebM. */
  | { kind: "retry"; cause: unknown }
  | { kind: "discard"; pause: boolean }
  | { kind: "fail"; reason: SaveFailure };

// A save that fails for an unexpected reason shows "Couldn't save the video"; this keeps the cause
// findable in the page's console.
function logError(step: string, error: unknown) {
  console.error(`[Clipper for YouTube] Save video failed while ${step}:`, error);
}

function downloadFile(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  // Firefox only follows links that are in the document.
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_MS);
}
