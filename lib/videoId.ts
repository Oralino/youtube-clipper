const VIDEO_ID = /^[\w-]{11}$/;
const WATCH_HOSTS = new Set(["www.youtube.com", "youtube.com", "m.youtube.com"]);
const SHORTS_PATH = /^\/shorts\/([^/]+)\/?$/;

/** A video page: a watch page (or youtu.be link) or a Short. */
export interface VideoPage {
  id: string;
  kind: "watch" | "shorts";
}

/** The video an https YouTube watch, Shorts or youtu.be URL shows, or null. */
export function getVideoPage(href: string | URL): VideoPage | null {
  let url: URL;
  try {
    url = href instanceof URL ? href : new URL(href);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;

  let page: { id: string | null; kind: VideoPage["kind"] } | null = null;
  if (WATCH_HOSTS.has(url.hostname)) {
    const shorts = SHORTS_PATH.exec(url.pathname);
    if (url.pathname === "/watch") page = { id: url.searchParams.get("v"), kind: "watch" };
    else if (shorts) page = { id: shorts[1] ?? null, kind: "shorts" };
  } else if (url.hostname === "youtu.be") {
    page = { id: url.pathname.slice(1), kind: "watch" };
  }

  return page?.id != null && VIDEO_ID.test(page.id) ? { id: page.id, kind: page.kind } : null;
}
