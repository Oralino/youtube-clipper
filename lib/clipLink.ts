import { parseYouTubeTime, safeSeconds } from "./time.ts";

/** A clip of a YouTube video, in whole seconds. */
export interface Clip {
  videoId: string;
  start: number;
  end: number;
}

export type ClipRangeError = "end-before-start" | "outside-video";

const END_KEY = "clip_end";
const VIDEO_ID = /^[\w-]{11}$/;
const WATCH_HOSTS = new Set(["www.youtube.com", "youtube.com", "m.youtube.com"]);

/**
 * The link to share: YouTube's own `t` sets the start, so it works without the extension,
 * and the end rides in the hash, which YouTube's servers never see.
 */
export function buildClipLink({ videoId, start, end }: Clip): string {
  return `https://www.youtube.com/watch?v=${videoId}&t=${start}#${END_KEY}=${end}`;
}

/** Plays start→end without the extension, but fails on videos that block embedding. */
export function buildEmbedLink({ videoId, start, end }: Clip): string {
  return `https://www.youtube.com/embed/${videoId}?start=${start}&end=${end}`;
}

/** Reads a clip from a clip link, or returns null if the URL isn't one. */
export function parseClipLink(href: string): Clip | null {
  const url = toUrl(href);
  if (!url) return null;

  const videoId = getVideoId(url);
  const endValue = new URLSearchParams(url.hash.slice(1)).get(END_KEY);
  if (!videoId || endValue === null || !/^\d+$/.test(endValue)) return null;

  const t = url.searchParams.get("t");
  const start = t === null ? 0 : parseYouTubeTime(t);
  const end = safeSeconds(Number(endValue));
  if (start === null || end === null || end <= start) return null;

  return { videoId, start, end };
}

/** The video ID of a YouTube watch or youtu.be URL, or null. */
export function getVideoId(href: string | URL): string | null {
  const url = toUrl(href);
  if (url?.protocol !== "https:") return null;

  let id: string | null = null;
  if (WATCH_HOSTS.has(url.hostname) && url.pathname === "/watch") id = url.searchParams.get("v");
  else if (url.hostname === "youtu.be") id = url.pathname.slice(1);

  return id !== null && VIDEO_ID.test(id) ? id : null;
}

/**
 * Checks a start/end pair against each other and, when known, the video's length in seconds.
 * A non-finite duration counts as unknown: `video.duration` is NaN while loading and Infinity
 * for live streams.
 */
export function validateRange(
  start: number,
  end: number,
  duration?: number,
): ClipRangeError | null {
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0) return "outside-video";
  if (duration !== undefined && Number.isFinite(duration) && end > duration) return "outside-video";
  if (end <= start) return "end-before-start";
  return null;
}

function toUrl(href: string | URL): URL | null {
  if (href instanceof URL) return href;
  try {
    return new URL(href);
  } catch {
    return null;
  }
}
