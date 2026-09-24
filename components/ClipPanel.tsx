import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { checkClipForm, type FieldError } from "../lib/clipForm.ts";
import { buildClipLink, buildEmbedLink } from "../lib/clipLink.ts";
import { STRINGS } from "../lib/strings.ts";
import { formatTime } from "../lib/time.ts";
import CopyButton from "./CopyButton.tsx";
import Icon from "./Icon.tsx";
import TimeField from "./TimeField.tsx";
import usePreviewLoop from "./usePreviewLoop.ts";

interface ClipPanelProps {
  video: HTMLVideoElement;
  videoId: string;
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

export default function ClipPanel({ video, videoId, onClose }: ClipPanelProps) {
  const [startText, setStartText] = useState("");
  const [endText, setEndText] = useState("");
  // Errors show only once a field has been left or filled from the video, not while typing.
  const [touched, setTouched] = useState({ start: false, end: false });
  const [previewing, setPreviewing] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  // The link to copy by hand after the clipboard refused it.
  const [manualLink, setManualLink] = useState<string | null>(null);
  const duration = useVideoDuration(video);
  const startRef = useRef<HTMLInputElement>(null);
  const manualRef = useRef<HTMLInputElement>(null);
  const announceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { startError, endError, range } = checkClipForm(startText, endText, duration);
  // An invalid range ends the preview; it doesn't resume by itself when the range is fixed.
  if (previewing && !range) setPreviewing(false);
  usePreviewLoop(video, range?.start ?? null, range?.end ?? null, previewing, () =>
    setPreviewing(false),
  );

  const clipLink = range && buildClipLink({ videoId, ...range });
  const embedLink = range && buildEmbedLink({ videoId, ...range });
  // Only offer the manual field while it still matches what's in the fields.
  const shownManualLink = manualLink === clipLink || manualLink === embedLink ? manualLink : null;

  useEffect(() => startRef.current?.focus(), []);
  useEffect(() => () => clearTimeout(announceTimer.current), []);
  useEffect(() => {
    if (shownManualLink) {
      manualRef.current?.focus();
      manualRef.current?.select();
    }
  }, [shownManualLink]);

  function fillFromVideo(field: "start" | "end") {
    const time = formatTime(video.currentTime);
    if (field === "start") setStartText(time);
    else setEndText(time);
    setTouched((current) => ({ ...current, [field]: true }));
  }

  function togglePreview() {
    if (range) setPreviewing(!previewing);
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

  function handleCopyResult(copied: boolean, text: string) {
    setManualLink(copied ? null : text);
    announce(copied ? STRINGS.panel.copiedAnnouncement : STRINGS.panel.copyFailed);
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
      <div className="actions">
        <button
          type="button"
          className="tonal"
          aria-pressed={previewing}
          aria-disabled={!range}
          onClick={togglePreview}
        >
          <Icon name="loop" />
          {previewing ? STRINGS.panel.stopPreview : STRINGS.panel.preview}
        </button>
        <CopyButton
          label={STRINGS.panel.copyLink}
          icon="link"
          text={clipLink}
          variant="primary"
          onResult={handleCopyResult}
        />
        <CopyButton
          label={STRINGS.panel.copyEmbedLink}
          icon="code"
          text={embedLink}
          variant="tonal"
          describedBy="clip-embed-note"
          onResult={handleCopyResult}
        />
        <p id="clip-embed-note" className="note">
          <Icon name="info" size={16} />
          {STRINGS.panel.embedNote}
        </p>
      </div>
      {shownManualLink && (
        <div className="manual">
          <label className="field-label" htmlFor="clip-manual-link">
            {STRINGS.panel.copyManually}
          </label>
          <input
            ref={manualRef}
            id="clip-manual-link"
            className="manual-input"
            type="text"
            readOnly
            value={shownManualLink}
          />
        </div>
      )}
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
