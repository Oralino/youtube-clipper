# ARCHITECTURE.md
How the extension works. What it must do is in `REQUIREMENTS.md`; how it looks is in `DESIGN.md`.

## Stack
WXT 0.21 (Vite) building Manifest V3 for Firefox and Chrome · TypeScript (strict) · React 19 · plain
CSS with custom properties · Vitest · [Mediabunny](https://mediabunny.dev) (MPL-2.0, unmodified) for
Firefox's MP4 conversion · Node 24 + npm. No backend, no storage, no API keys.

## Layout
```
entrypoints/
  youtube.content/     content script on www/m.youtube.com: index.ts (navigation), clipButton.ts, clipPanel.tsx
  background.ts        background page (Firefox) / service worker (Chrome): converts WebM to MP4
components/            React panel: ClipPanel, TimeField, SaveVideo, Icon, useClipRecorder, usePreviewLoop
lib/                   pure, unit-tested logic: time, clipForm, recording (format, bitrate, file names), videoId, strings
media/                 browser-only media work: convertToMp4, convertInBackground, conversionMessages
assets/icon/           icon SVG sources (icon.svg for 48–128px, pixel-snapped icon-small.svg for 16–32px)
assets/screenshots/    README screenshots
public/icon/           icon PNGs rendered from the SVGs
wxt.config.ts          manifest (name, gecko ID and data-collection "none" for Firefox only), dev reload hook
```

## Data flow
1. **Navigation** (`index.ts`): on `wxt:locationchange` and YouTube's `yt-navigate-finish`, the button
   shows only on `/watch` pages of www.youtube.com. A video change closes the panel immediately, which
   discards any save in progress.
2. **Clip button** (`clipButton.ts`): plain DOM with YouTube's `.ytp-button`, mounted first in the right
   controls by WXT's integrated UI with `autoMount`; it survives YouTube rebuilding the player.
3. **Panel** (`clipPanel.tsx`): a WXT shadow-root UI appended to `#movie_player`, so styles can't leak
   either way. Key and mouse events are isolated at the shadow host, because YouTube's shortcuts would
   otherwise act on them (typing "5" seeks to 50%). Hidden with `data-ad` while `#movie_player` has
   `ad-showing`.
4. **Preview** (`usePreviewLoop`): a requestAnimationFrame loop on the page's `<video>` that seeks back
   to start at the end or when outside the range.
5. **Save video** (`useClipRecorder`): `captureStream()` (or `mozCaptureStream()` in Firefox, whose
   audio is routed back through an AudioContext so it's still heard), then MediaRecorder at a bitrate
   scaled to the playing resolution and frame rate (~0.1 bits per pixel per frame, 192 kbps audio). It
   seeks to start, plays in real time, and stops at end. Pausing, seeking more than 1s, or an ad fails
   the save with a reason.
6. **Format:** Chromium records MP4 (H.264/AAC) and downloads it directly. Firefox records WebM
   (VP8/Opus); the content script sends it over a runtime port to the background page, which runs
   `convertToMp4` (Mediabunny file conversion with WebCodecs: H.264 with `fit: "contain"` for mid-clip
   resolution changes; AAC if available, otherwise Opus copied). Disconnecting the port cancels it. It
   runs in the background page because it failed in the content script. On failure, the WebM is
   downloaded instead.
7. **Download:** a temporary `<a download>` blob link, named by `clipFileName` (typed name or
   `<title> (<start>-<end>)`, cleaned for Windows, capped at 80 characters, keeping the range).

## YouTube facts (verified 2026-09-24)
- **Trusted Types** are enforced: `innerHTML`, `outerHTML`, `insertAdjacentHTML` and `document.write`
  throw. Build DOM (and SVG icons) with `createElement(NS)`; React is fine.
- The current player splits `.ytp-right-controls` into `-left` and `-right` groups; older players are
  flat. Both are handled. Page-level CSS uses the `clip-ext-` prefix.
- YouTube's tooltip doesn't attach to injected buttons, so the button has its own.
- The page's `<video>` is used directly for seeking and playback; no YouTube internals.

## Permissions and manifest
Content scripts on `*://www.youtube.com/*` and `*://m.youtube.com/*` (the button shows on www only), a
background script, and no other permissions. The Firefox gecko ID is a random UUID; never change it
after the first AMO upload.

## Dev tooling quirks
- A `server:created` hook in `wxt.config.ts` makes content-script changes reload the whole extension
  (WXT's quick MV3 reload left Firefox running the old copy), but only after a file change: WXT also
  calls it at startup, and reloading then looped forever.
- On Windows, stopping `npm run dev` can leave WXT's node process running, and several servers then
  overwrite each other's builds (see `CLAUDE.md` Commands).
- `npm run lint:addon` reports 2 expected `UNSAFE_VAR_ASSIGNMENT` warnings, both inside ReactDOM
  (`dangerouslySetInnerHTML` and `<script>` creation, neither of which we use).

## Known limits
- Saving takes as long as the clip.
- During Firefox's conversion, the WebM and the MP4 are both in memory (~50 MB per minute at 1080p30
  each), so very long clips can run out of memory.
- On "Auto" quality, the resolution can change mid-clip; the conversion fits later frames into the
  first frame's size.
- Firefox MP4s carry Opus audio (Firefox has no AAC encoder), which older iPhones may not play.
