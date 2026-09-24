import { useId, type Ref } from "react";
import { formatTime } from "../lib/time.ts";

interface TimeFieldProps {
  label: string;
  value: string;
  error: string | null;
  useCurrentLabel: string;
  useCurrentName: string;
  inputRef?: Ref<HTMLInputElement>;
  /** Read-only while a clip is being saved. */
  locked?: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
  onUseCurrent: () => void;
}

export default function TimeField({
  label,
  value,
  error,
  useCurrentLabel,
  useCurrentName,
  inputRef,
  locked = false,
  onChange,
  onBlur,
  onUseCurrent,
}: TimeFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="time-field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className="time-row">
        <input
          ref={inputRef}
          id={id}
          className="time-input"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          placeholder={formatTime(0)}
          value={value}
          readOnly={locked}
          aria-invalid={error !== null}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
        />
        <button
          type="button"
          className="tonal"
          aria-label={useCurrentName}
          aria-disabled={locked}
          onClick={() => {
            if (!locked) onUseCurrent();
          }}
        >
          {useCurrentLabel}
        </button>
      </div>
      {error && (
        <p id={errorId} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
