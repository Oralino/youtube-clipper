import { useEffect, useRef, useState } from "react";
import { AUDIO_BPS, clipFileName, pickRecordingType, videoBitrate } from "../lib/recording.ts";

export type SaveFailure = "unsupported" | "protected" | "ad" | "paused" | "skipped" | "failed";

export type SaveStatus =
  | { state: "idle" }
  | { state: "saving"; elapsed: number; total: number }
  | { state: "saved" }
  | { state: "failed"; reason: SaveFailure };

/** Moments worth announcing to screen readers; the caller words them. */
export type SaveEvent =
  | { type: "started"; total: number }
  | { type: "progress"; elapsed: number; total: number }
  | { type: "saved" }
  | { type: "stopped" }
  | { type: "failed"; reason: SaveFailure };

// Firefox names it mozCaptureStream; neither is in TypeScript's DOM types for media elements.
type CapturableVideo = HTMLVideoElement & {
  captureStream?: () => MediaStream;
  mozCaptureStream?: () => MediaStream;
};

const SAVED_MS = 2000;
// Long clips get a progress announcement this often; shorter ones only at the start and end.
const ANNOUNCE_EVERY_S = 30;
// Seeks that move the playhead less than this are YouTube's own (buffering, quality switches).
const SKIP_THRESHOLD_S = 1;
// Seeking to the start normally takes well under a second; give up after this.
const SEEK_TIMEOUT_MS = 5000;
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
  const emit = useRef(onEvent);
  useEffect(() => {
    emit.current = onEvent;
  });

  useEffect(
    () => () => {
      finish.current?.({ kind: "discard", pause: false });
      clearTimeout(savedTimer.current);
    },
    [],
  );

  function fail(reason: SaveFailure) {
    setStatus({ state: "failed", reason });
    emit.current({ type: "failed", reason });
  }

  async function save(start: number, end: number) {
    if (finish.current) return;
    clearTimeout(savedTimer.current);
    const type = pickRecordingType((mime) => MediaRecorder.isTypeSupported(mime));
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

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, {
        mimeType: type.mimeType,
        videoBitsPerSecond: videoBitrate(
          video.videoWidth,
          video.videoHeight,
          videoTrack.getSettings().frameRate,
        ),
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
    recorder.onerror = () => finish.current?.({ kind: "fail", reason: "failed" });

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
      cancelAnimationFrame(frame);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("seeking", onSeeking);
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        void audio?.close();
        if (outcome.kind !== "download") return;
        const blob = new Blob(chunks, { type: type.mimeType });
        if (blob.size === 0) return fail("failed");
        downloadFile(blob, clipFileName(videoTitle(), start, end, type.extension));
        setStatus({ state: "saved" });
        emit.current({ type: "saved" });
        savedTimer.current = setTimeout(() => setStatus({ state: "idle" }), SAVED_MS);
      };
      if (recorder.state !== "inactive") recorder.stop();
      else recorder.onstop?.(new Event("stop"));

      if (outcome.kind === "download" || (outcome.kind === "discard" && outcome.pause)) {
        video.pause();
      }
      if (outcome.kind === "fail") fail(outcome.reason);
      if (outcome.kind === "discard" && outcome.pause) {
        setStatus({ state: "idle" });
        emit.current({ type: "stopped" });
      }
    };

    setStatus({ state: "saving", elapsed: 0, total });
    emit.current({ type: "started", total });
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
      if (!(await seeked)) return finish.current?.({ kind: "fail", reason: "failed" });
    }
    if (!finish.current) return;

    recorder.start(1000);
    try {
      await video.play();
    } catch {
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
          if (total > ANNOUNCE_EVERY_S && second % ANNOUNCE_EVERY_S === 0) {
            emit.current({ type: "progress", elapsed: second, total });
          }
        }
      }
      frame = requestAnimationFrame(check);
    });
  }

  /** "Stop saving": discard the recording and pause where the video is. */
  function stop() {
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
  | { kind: "discard"; pause: boolean }
  | { kind: "fail"; reason: SaveFailure };

function videoTitle(): string {
  // Strips the tab's unread count, like "(3) ". A title that really starts with "(2024) " loses it too;
  // that's rare and only affects the file name.
  return document.title.replace(/^\(\d+\)\s*/, "").replace(/\s*-\s*YouTube$/, "");
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
