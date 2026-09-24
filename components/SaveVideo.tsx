import { STRINGS } from "../lib/strings.ts";
import { formatTime } from "../lib/time.ts";
import Icon from "./Icon.tsx";
import type { SaveStatus } from "./useClipRecorder.ts";

interface SaveVideoProps {
  status: SaveStatus;
  /** False until the start and end form a valid range. */
  available: boolean;
  onSave: () => void;
  onStop: () => void;
}

export default function SaveVideo({ status, available, onSave, onStop }: SaveVideoProps) {
  // Converting to MP4 after recording counts as saving: the same Stop button and locked fields.
  const saving = status.state === "saving" || status.state === "converting";
  const inactive = !available && !saving;
  const noteId = saving ? "clip-save-saving-note" : "clip-save-quality-note";
  const describedBy = status.state === "failed" ? `clip-save-error ${noteId}` : noteId;

  const button = saving
    ? { icon: "stop" as const, label: STRINGS.save.stop }
    : status.state === "saved"
      ? { icon: "check" as const, label: STRINGS.save.saved }
      : { icon: "download" as const, label: STRINGS.save.button };

  const progress =
    status.state === "saving"
      ? {
          text: STRINGS.save.progress(formatTime(status.elapsed), formatTime(status.total)),
          fraction: status.elapsed / status.total,
        }
      : status.state === "converting"
        ? {
            text: STRINGS.save.converting(Math.floor(status.progress * 100)),
            fraction: status.progress,
          }
        : null;
  const note =
    status.state === "converting"
      ? STRINGS.save.convertingNote
      : saving
        ? STRINGS.save.savingNote
        : STRINGS.save.qualityNote;

  function handleClick() {
    if (saving) onStop();
    else if (!inactive) onSave();
  }

  return (
    <div className="save">
      {/* Status goes above the button: the panel grows upwards, and the button mustn't move. */}
      {status.state === "failed" && (
        <p id="clip-save-error" className="field-error">
          {STRINGS.save.errors[status.reason]}
        </p>
      )}
      {progress && (
        <>
          <p className="progress-text">{progress.text}</p>
          <div className="progress" aria-hidden="true">
            <div className="progress-fill" style={{ transform: `scaleX(${progress.fraction})` }} />
          </div>
        </>
      )}
      <button
        type="button"
        className={saving ? "tonal" : "primary"}
        aria-disabled={inactive}
        aria-describedby={describedBy}
        onClick={handleClick}
      >
        <Icon name={button.icon} />
        {button.label}
      </button>
      <p id={noteId} className="note">
        <Icon name="info" size={16} />
        {note}
      </p>
    </div>
  );
}
