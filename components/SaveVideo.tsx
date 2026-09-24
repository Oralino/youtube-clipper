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
  const saving = status.state === "saving";
  const inactive = !available && !saving;
  const noteId = saving ? "clip-save-saving-note" : "clip-save-quality-note";
  const describedBy = status.state === "failed" ? `clip-save-error ${noteId}` : noteId;

  const button =
    status.state === "saving"
      ? { icon: "stop" as const, label: STRINGS.save.stop }
      : status.state === "saved"
        ? { icon: "check" as const, label: STRINGS.save.saved }
        : { icon: "download" as const, label: STRINGS.save.button };

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
      {status.state === "saving" && (
        <>
          <p className="progress-text">
            {STRINGS.save.progress(formatTime(status.elapsed), formatTime(status.total))}
          </p>
          <div className="progress" aria-hidden="true">
            <div
              className="progress-fill"
              style={{ transform: `scaleX(${status.elapsed / status.total})` }}
            />
          </div>
        </>
      )}
      <button
        type="button"
        className="tonal"
        aria-disabled={inactive}
        aria-describedby={describedBy}
        onClick={handleClick}
      >
        <Icon name={button.icon} />
        {button.label}
      </button>
      <p id={noteId} className="note">
        <Icon name="info" size={16} />
        {saving ? STRINGS.save.savingNote : STRINGS.save.qualityNote}
      </p>
    </div>
  );
}
