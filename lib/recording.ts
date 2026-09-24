import { formatTime } from "./time.ts";

export interface RecordingType {
  mimeType: string;
  extension: "mp4" | "webm";
}

// MP4 (H.264/AAC) first: it plays everywhere, including iPhones. WebM is the fallback.
const PREFERRED_TYPES: RecordingType[] = [
  { mimeType: "video/mp4;codecs=avc1,mp4a.40.2", extension: "mp4" },
  { mimeType: "video/mp4", extension: "mp4" },
  { mimeType: "video/webm;codecs=vp9,opus", extension: "webm" },
  { mimeType: "video/webm;codecs=vp8,opus", extension: "webm" },
  { mimeType: "video/webm", extension: "webm" },
];

/** The best format this browser can record, or null if it can't record video at all. */
export function pickRecordingType(
  isSupported: (mimeType: string) => boolean,
): RecordingType | null {
  return PREFERRED_TYPES.find((type) => isSupported(type.mimeType)) ?? null;
}

// About 0.1 bits per pixel per frame keeps H.264 close to the source (~6 Mbps at 1080p30).
const BITS_PER_PIXEL = 0.1;
const MIN_VIDEO_BPS = 2_500_000;
const MAX_VIDEO_BPS = 40_000_000;
const FALLBACK_FPS = 30;
export const AUDIO_BPS = 192_000;

/**
 * A video bitrate that keeps the quality being played, instead of MediaRecorder's low default.
 * `fps` is optional because not every browser reports the captured frame rate.
 */
export function videoBitrate(width: number, height: number, fps?: number): number {
  const frames = fps && Number.isFinite(fps) && fps > 0 ? fps : FALLBACK_FPS;
  const bits = width * height * frames * BITS_PER_PIXEL;
  if (!Number.isFinite(bits) || bits <= 0) return MIN_VIDEO_BPS;
  return Math.round(Math.min(Math.max(bits, MIN_VIDEO_BPS), MAX_VIDEO_BPS));
}

/** Longest name kept, typed or automatic (the extension comes on top). */
export const MAX_NAME_LENGTH = 80;
// Device names Windows won't accept as file names, with or without an extension.
const WINDOWS_RESERVED = /^(con|prn|aux|nul|com\d|lpt\d)$/i;

/** The video's title from the tab title, without YouTube's suffix or the unread count like "(3) ". */
export function videoTitleFrom(documentTitle: string): string {
  // A title that really starts with "(2024) " loses it too; that's rare and only affects the name.
  return documentTitle.replace(/^\(\d+\)\s*/, "").replace(/\s*-\s*YouTube$/, "");
}

/** The automatic clip name, like "Me at the zoo (0.05-0.12)". Also the name field's placeholder. */
export function defaultClipName(title: string, start: number, end: number): string {
  const range = `${formatTime(start)}-${formatTime(end)}`.replaceAll(":", ".");
  return `${safeName(title) || "clip"} (${range})`;
}

/**
 * The saved file's name: what the user typed if anything usable is left after cleaning it, otherwise
 * the automatic name. Safe on Windows, macOS and Linux; a typed ".mp4" or ".webm" isn't doubled.
 */
export function clipFileName(
  typedName: string,
  fallback: string,
  extension: RecordingType["extension"],
): string {
  const typed = safeName(typedName.replace(/\.(mp4|webm)\s*$/i, ""));
  return `${typed || safeName(fallback) || "clip"}.${extension}`;
}

function safeName(text: string): string {
  const name = text
    // Characters Windows forbids in file names, plus control characters.
    .replace(/[<>:"/\\|?*]|\p{Cc}/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_NAME_LENGTH)
    // Windows also rejects names ending in a dot or space.
    .replace(/[. ]+$/, "");
  return WINDOWS_RESERVED.test(name) ? `_${name}` : name;
}
