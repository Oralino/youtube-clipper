/** Parses a time typed by the user: "83", "1:23" or "1:02:03". Returns whole seconds, or null. */
export function parseTime(input: string): number | null {
  const parts = input.trim().split(":");
  if (parts.length > 3 || parts.some((part) => !/^\d+$/.test(part))) return null;

  const values = parts.map(Number);
  // Minutes and seconds after the first part must be real clock values.
  if (values.slice(1).some((value) => value > 59)) return null;
  return safeSeconds(values.reduce((total, value) => total * 60 + value, 0));
}

/** Formats whole seconds as "1:23" or "1:02:03". NaN and Infinity (e.g. an unloaded video) show 0:00. */
export function formatTime(seconds: number): string {
  const total = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

/** Parses YouTube's `t` parameter: "83", "83s", "1m23s" or "1h2m3s". Returns whole seconds, or null. */
export function parseYouTubeTime(value: string): number | null {
  const match = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/.exec(value);
  if (!match || value === "") return null;
  const [, h = "0", m = "0", s = "0"] = match;
  return safeSeconds(Number(h) * 3600 + Number(m) * 60 + Number(s));
}

/** Rejects digit strings so long they lose precision or overflow to Infinity. */
export function safeSeconds(value: number): number | null {
  return Number.isSafeInteger(value) ? value : null;
}
