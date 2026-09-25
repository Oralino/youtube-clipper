# ARCHITECTURE.md
How the extension works. What it must do is in `REQUIREMENTS.md`; how it looks is in `DESIGN.md`.

## Stack
WXT 0.21 (Vite) building Manifest V3 for Firefox and Chrome · TypeScript (strict) · React 19 · plain
CSS with custom properties · Vitest · [Mediabunny](https://mediabunny.dev) (MPL-2.0, unmodified) for
converting WebM recordings to MP4 (Firefox, and Chrome's fallback) · Node 24 + npm. No backend, no storage, no API keys.

## Layout
```
entrypoints/
  youtube.content/     content script on www/m.youtube.com: index.ts (navigation), clipButton.ts (player),
                       shortsButton.ts (Shorts action bar), clipPanel.tsx
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
1. **Navigation** (`index.ts`): on `wxt:locationchange` and YouTube's `yt-navigate-finish`,
   `getVideoPage` tells a watch page from a Short (`/shorts/<id>`) on www.youtube.com, and the matching
   button shows. A video change (including scrolling to the next Short) closes the panel immediately,
   which discards any save in progress.
2. **Clip button** (`clipButton.ts`): plain DOM with YouTube's `.ytp-button`, mounted first in the right
   controls by WXT's integrated UI with `autoMount`; it survives YouTube rebuilding the player.
   On Shorts, `shortsButton.ts` builds an action-bar item instead and keeps it in the current bar with
   a page MutationObserver (checked once per frame), because YouTube swaps the bar for a new one on
   every Short and autoMount can't see that.
3. **Panel** (`clipPanel.tsx`): a WXT shadow-root UI, so styles can't leak either way. Watch pages:
   appended to `#movie_player`. Shorts: appended to the `#player-container` around `#shorts-player`,
   positioned over it at `z-index: 2` with `pointer-events: none` except on the panel (see YouTube
   facts). Key and mouse events are isolated at the shadow host, because YouTube's shortcuts would
   otherwise act on them (typing "5" seeks to 50%; arrows change Shorts). Hidden with `data-ad` while
   the player (`.html5-video-player`) has `ad-showing`.
4. **Preview** (`usePreviewLoop`): a requestAnimationFrame loop on the page's `<video>` that seeks back
   to start at the end or when outside the range.
5. **Save video** (`useClipRecorder`): `captureStream()` (or `mozCaptureStream()` in Firefox, whose
   audio is routed back through an AudioContext so it's still heard), then MediaRecorder at a bitrate
   scaled to the playing resolution and frame rate (~0.1 bits per pixel per frame, 192 kbps audio). It
   seeks to start, plays in real time, and stops at end. Pausing, seeking more than 1s, or an ad fails
   the save with a reason. The video's `loop` (set on Shorts) is switched off while saving, so a clip
   ending at the end of the video ends there instead of jumping back to 0.
6. **Format:** Chromium records MP4 (H.264/AAC) and downloads it directly. If the MP4 recorder errors,
   delivers no data within 2.5s, or ends empty, the save restarts in WebM. Some PCs' hardware H.264
   encoder rejects the job even though `isTypeSupported` says yes: seen on Chrome 154 as `EncodingError`
   with 0 bytes, 2026-09-24. Firefox always records WebM (VP8/Opus). WebM recordings are converted with
   `convertToMp4` (Mediabunny file conversion with WebCodecs: H.264 with `fit: "contain"` for mid-clip
   resolution changes; AAC if available, otherwise Opus copied):
   - **Firefox:** in the background page, over a runtime port (disconnecting cancels). Conversion
     failed in Firefox's content script.
   - **Chrome:** in the content script with the software encoder, since the background is a service
     worker whose port can't carry the file. The choice is made at build time
     (`import.meta.env.FIREFOX`), so Mediabunny is only in Chrome's content script.

   If the conversion fails, the WebM is downloaded instead.
7. **Download:** a temporary `<a download>` blob link, named by `clipFileName` (typed name or
   `<title> (<start>-<end>)`, cleaned for Windows, capped at 80 characters, keeping the range).

## YouTube facts (verified 2026-09-24)
- **Trusted Types** are enforced: `innerHTML`, `outerHTML`, `insertAdjacentHTML` and `document.write`
  throw. Build DOM (and SVG icons) with `createElement(NS)`; React is fine.
- The current player splits `.ytp-right-controls` into `-left` and `-right` groups; older players are
  flat. Both are handled. Page-level CSS uses the `clip-ext-` prefix.
- YouTube's tooltip doesn't attach to injected buttons, so the button has its own.

## YouTube Shorts facts (verified 2026-09-25, desktop)
- One player, `#shorts-player` (a `.html5-video-player`), inside `ytd-reel-video-renderer
  #player-container`; its `<video>` has `loop`. Scrolling keeps the player, the video, the reel and
  YouTube's overlay, rebuilds the action bar, and fires `yt-navigate-finish`.
- The player is its own stacking context (`position: relative; z-index: 0`), and YouTube's Shorts
  overlay (`ytd-reel-player-overlay-renderer`, `z-index: 1`) covers it: controls at the top, title and
  channel at the bottom. Anything inside the player is underneath that overlay.
- The action bar (`reel-action-bar-view-model`) is a flex column: Like/Dislike, Comments, Share, Remix
  (`button-view-model` items, 8px bottom padding each) and the sound thumbnail. The buttons' names are
  translated, so ours is placed by position (before the last `button-view-model`).
- YouTube's colour variables there are hashed per build; the dark theme is `html[dark]`.
- The page's `<video>` is used directly for seeking and playback; no YouTube internals.

## Permissions and manifest
Content scripts on `*://www.youtube.com/*` and `*://m.youtube.com/*` (the buttons show on www only), a
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
- During a conversion (Firefox's, or Chrome's fallback, which runs in the YouTube tab itself), the
  WebM and the MP4 are both in memory (~50 MB per minute at 1080p30 each), so very long clips can run
  out of memory.
- On "Auto" quality, the resolution can change mid-clip; the conversion fits later frames into the
  first frame's size.
- Firefox MP4s carry Opus audio (Firefox has no AAC encoder), which older iPhones may not play.
- On Shorts, the Clip button also shows on ad Shorts (not detected yet). If the Shorts player marks
  an ad with `ad-showing`, the panel hides as on watch pages.
- On Chrome PCs with a failing H.264 encoder, a save loses about 2.5s before restarting in WebM,
  and then needs a software conversion step.
