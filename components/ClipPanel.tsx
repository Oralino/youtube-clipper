import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { checkClipForm, type FieldError } from "../lib/clipForm.ts";
import { STRINGS } from "../lib/strings.ts";
import { formatTime } from "../lib/time.ts";
import Icon from "./Icon.tsx";
import SaveVideo from "./SaveVideo.tsx";
import TimeField from "./TimeField.tsx";
import useClipRecorder, { type SaveEvent } from "./useClipRecorder.ts";
import usePreviewLoop from "./usePreviewLoop.ts";

interface ClipPanelProps {
  video: HTMLVideoElement;
  onClose: () => void;
}

const ERROR_TEXT: Record<FieldError, string> = {
  "unreadable-time": STRINGS.panel.errorUnreadableTime,
  "end-before-start": STRINGS.panel.errorEndBeforeStart,
  "outside-video": STRINGS.panel.errorOutsideVideo,
};
const ANNOUNCE_MS = 2000;
// Long enough for screen readers to notice the live region emptied before the new text arrives.
const ANNOUNCE_GAP_MS = 100;

export default function ClipPanel({ video, onClose }: ClipPanelProps) {
  const [startText, setStartText] = useState("");
  const [endText, setEndText] = useState("");
  // Errors show only once a field has been left or filled from the video, not while typing.
  const [touched, setTouched] = useState({ start: false, end: false });
  const [previewing, setPreviewing] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const duration = useVideoDuration(video);
  const startRef = useRef<HTMLInputElement>(null);
  const announceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const saver = useClipRecorder(video, handleSaveEvent);
  const saving = saver.status.state === "saving" || saver.status.state === "converting";

  const { startError, endError, range } = checkClipForm(startText, endText, duration);
  // An invalid range ends the preview; it doesn't resume by itself when the range is fixed.
  if (previewing && !range) setPreviewing(false);
  usePreviewLoop(video, range?.start ?? null, range?.end ?? null, previewing, () =>
    setPreviewing(false),
  );

  useEffect(() => startRef.current?.focus(), []);
  useEffect(() => () => clearTimeout(announceTimer.current), []);

  function setTime(field: "start" | "end", text: string) {
    if (field === "start") setStartText(text);
    else setEndText(text);
    // A save error is about the old times.
    saver.clearFailure();
  }

  function fillFromVideo(field: "start" | "end") {
    setTime(field, formatTime(video.currentTime));
    setTouched((current) => ({ ...current, [field]: true }));
  }

  function togglePreview() {
    if (range && !saving) setPreviewing(!previewing);
  }

  function startSaving() {
    if (!range) return;
    setPreviewing(false);
    void saver.save(range.start, range.end);
  }

  function handleSaveEvent(event: SaveEvent) {
    if (event.type === "started") announce(STRINGS.save.announceStart(formatTime(event.total)));
    else if (event.type === "progress") {
      announce(STRINGS.save.announceProgress(formatTime(event.elapsed), formatTime(event.total)));
    } else if (event.type === "converting") announce(STRINGS.save.announceConverting);
    else if (event.type === "saved") announce(STRINGS.save.announceSaved);
    else if (event.type === "stopped") announce(STRINGS.save.announceStopped);
    else announce(STRINGS.save.errors[event.reason]);
  }

  function announce(text: string) {
    // Empty first, so repeating the same message within a few seconds is still read out.
    setAnnouncement("");
    clearTimeout(announceTimer.current);
    announceTimer.current = setTimeout(() => {
      setAnnouncement(text);
      announceTimer.current = setTimeout(() => setAnnouncement(""), ANNOUNCE_MS);
    }, ANNOUNCE_GAP_MS);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") onClose();
  }

  return (
    <section className="panel" aria-labelledby="clip-panel-heading" onKeyDown={handleKeyDown}>
      <div className="header">
        <h2 id="clip-panel-heading" className="title">
          {STRINGS.panel.heading}
        </h2>
        {range && <span className="length">{formatTime(range.end - range.start)}</span>}
        <button
          type="button"
          className="icon-button"
          aria-label={STRINGS.panel.close}
          onClick={onClose}
        >
          <Icon name="close" size={24} />
        </button>
      </div>
      <div className="fields">
        <TimeField
          label={STRINGS.panel.start}
          value={startText}
          error={touched.start && startError ? ERROR_TEXT[startError] : null}
          useCurrentLabel={STRINGS.panel.useCurrentTime}
          useCurrentName={STRINGS.panel.useCurrentTimeForStart}
          inputRef={startRef}
          locked={saving}
          onChange={(text) => setTime("start", text)}
          onBlur={() => setTouched((current) => ({ ...current, start: true }))}
          onUseCurrent={() => fillFromVideo("start")}
        />
        <TimeField
          label={STRINGS.panel.end}
          value={endText}
          error={touched.end && endError ? ERROR_TEXT[endError] : null}
          useCurrentLabel={STRINGS.panel.useCurrentTime}
          useCurrentName={STRINGS.panel.useCurrentTimeForEnd}
          locked={saving}
          onChange={(text) => setTime("end", text)}
          onBlur={() => setTouched((current) => ({ ...current, end: true }))}
          onUseCurrent={() => fillFromVideo("end")}
        />
      </div>
      <div className="actions">
        <button
          type="button"
          className="tonal"
          aria-pressed={previewing}
          aria-disabled={!range || saving}
          onClick={togglePreview}
        >
          <Icon name="loop" />
          {previewing ? STRINGS.panel.stopPreview : STRINGS.panel.preview}
        </button>
      </div>
      <SaveVideo
        status={saver.status}
        available={range !== null}
        onSave={startSaving}
        onStop={saver.stop}
      />
      <p className="visually-hidden" role="status">
        {announcement}
      </p>
    </section>
  );
}

/** The video's length in seconds; NaN until its metadata loads. */
function useVideoDuration(video: HTMLVideoElement): number {
  const [duration, setDuration] = useState(video.duration);
  useEffect(() => {
    const update = () => setDuration(video.duration);
    video.addEventListener("durationchange", update);
    return () => video.removeEventListener("durationchange", update);
  }, [video]);
  return duration;
}
