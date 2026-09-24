import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { checkClipForm, type FieldError } from "../lib/clipForm.ts";
import { STRINGS } from "../lib/strings.ts";
import { formatTime } from "../lib/time.ts";
import TimeField from "./TimeField.tsx";

interface ClipPanelProps {
  video: HTMLVideoElement;
  onClose: () => void;
}

const ERROR_TEXT: Record<FieldError, string> = {
  "unreadable-time": STRINGS.panel.errorUnreadableTime,
  "end-before-start": STRINGS.panel.errorEndBeforeStart,
  "outside-video": STRINGS.panel.errorOutsideVideo,
};

export default function ClipPanel({ video, onClose }: ClipPanelProps) {
  const [startText, setStartText] = useState("");
  const [endText, setEndText] = useState("");
  // Errors show only once a field has been left or filled from the video, not while typing.
  const [touched, setTouched] = useState({ start: false, end: false });
  const duration = useVideoDuration(video);
  const startRef = useRef<HTMLInputElement>(null);

  useEffect(() => startRef.current?.focus(), []);

  const { startError, endError, range } = checkClipForm(startText, endText, duration);

  function fillFromVideo(field: "start" | "end") {
    const time = formatTime(video.currentTime);
    if (field === "start") setStartText(time);
    else setEndText(time);
    setTouched((current) => ({ ...current, [field]: true }));
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
          <CloseIcon />
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
          onChange={setStartText}
          onBlur={() => setTouched((current) => ({ ...current, start: true }))}
          onUseCurrent={() => fillFromVideo("start")}
        />
        <TimeField
          label={STRINGS.panel.end}
          value={endText}
          error={touched.end && endError ? ERROR_TEXT[endError] : null}
          useCurrentLabel={STRINGS.panel.useCurrentTime}
          useCurrentName={STRINGS.panel.useCurrentTimeForEnd}
          onChange={setEndText}
          onBlur={() => setTouched((current) => ({ ...current, end: true }))}
          onUseCurrent={() => fillFromVideo("end")}
        />
      </div>
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

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
      <path d="M18.3 5.7a1 1 0 0 0-1.4 0L12 10.6 7.1 5.7a1 1 0 0 0-1.4 1.4l4.9 4.9-4.9 4.9a1 1 0 1 0 1.4 1.4l4.9-4.9 4.9 4.9a1 1 0 0 0 1.4-1.4L13.4 12l4.9-4.9a1 1 0 0 0 0-1.4z" />
    </svg>
  );
}
