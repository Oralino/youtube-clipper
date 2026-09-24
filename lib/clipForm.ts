import type { Clip } from "./clipLink.ts";
import { parseTime } from "./time.ts";

export type FieldError = "unreadable-time" | "end-before-start" | "outside-video";

export interface ClipFormResult {
  startError: FieldError | null;
  endError: FieldError | null;
  /** Set only when both fields hold a valid range. */
  range: Pick<Clip, "start" | "end"> | null;
}

/**
 * Checks the panel's start and end fields. An empty field is not an error yet. A duration that
 * isn't finite (NaN while loading, Infinity for live) counts as unknown.
 */
export function checkClipForm(
  startText: string,
  endText: string,
  duration: number,
): ClipFormResult {
  const known = Number.isFinite(duration);
  const start = startText.trim() === "" ? null : parseTime(startText);
  const end = endText.trim() === "" ? null : parseTime(endText);

  let startError: FieldError | null = null;
  if (startText.trim() !== "" && start === null) startError = "unreadable-time";
  else if (start !== null && known && start >= duration) startError = "outside-video";

  let endError: FieldError | null = null;
  if (endText.trim() !== "" && end === null) endError = "unreadable-time";
  else if (end !== null && known && end > duration) endError = "outside-video";
  else if (end !== null && start !== null && startError === null && end <= start) {
    endError = "end-before-start";
  }

  const range =
    start !== null && end !== null && startError === null && endError === null
      ? { start, end }
      : null;
  return { startError, endError, range };
}
