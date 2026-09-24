const VIDEO_ID = /^[\w-]{11}$/;
const WATCH_HOSTS = new Set(["www.youtube.com", "youtube.com", "m.youtube.com"]);

/** The video ID of an https YouTube watch or youtu.be URL, or null. */
export function getVideoId(href: string | URL): string | null {
  let url: URL;
  try {
    url = href instanceof URL ? href : new URL(href);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;

  let id: string | null = null;
  if (WATCH_HOSTS.has(url.hostname) && url.pathname === "/watch") id = url.searchParams.get("v");
  else if (url.hostname === "youtu.be") id = url.pathname.slice(1);

  return id !== null && VIDEO_ID.test(id) ? id : null;
}
