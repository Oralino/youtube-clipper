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

const MAX_TITLE_LENGTH = 80;

/** A file name like "Me at the zoo (0.05-0.12).mp4", safe on Windows, macOS and Linux. */
export function clipFileName(
  title: string,
  start: number,
  end: number,
  extension: RecordingType["extension"],
): string {
  const safeTitle =
    title
      // Characters Windows forbids in file names, plus control characters.
      .replace(/[<>:"/\\|?*]|\p{Cc}/gu, " ")
      .replace(/\s+/g, " ")
      .trim()
      // Windows also rejects names ending in a dot or space.
      .slice(0, MAX_TITLE_LENGTH)
      .replace(/[. ]+$/, "") || "clip";
  const range = `${formatTime(start)}-${formatTime(end)}`.replaceAll(":", ".");
  return `${safeTitle} (${range}).${extension}`;
}
