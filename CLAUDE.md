# CLAUDE.md

This file guides Claude Code when working in this repository.

## Project overview
A Firefox extension that lets you clip part of a YouTube video and save it as an MP4, so it can be
watched and shared outside YouTube. YouTube has no one-click way to do this; this is
for people who want to clip and share YouTube moments. Personal project, solo.

**First version:** clip button in the player; set start/end; preview; **Save video**.

**No links (owner decision, 2026-09-24):** an earlier version copied a clip link (a watch URL with an
end time the extension would enforce) and an embed link. The owner dropped both: YouTube's own player
has no way to stop at an end time, so links only worked with the extension installed, and embed links
fail with YouTube's Error 153 when opened directly (in a browser or Discord mobile). The saved MP4 is
the one way a clip leaves the extension.

**Save video (owner decision, 2026-09-24):** the owner wants clips viewable on mobile and chose a saved
video file over a hosted clip page, accepting that it goes against YouTube's terms of service, that the
Chrome Web Store bans YouTube downloaders (see the Chrome phase in `TASKS.md`), and that protected (DRM)
videos can't be saved. It records the playing `<video>` in the browser with `MediaRecorder` while it
plays start→end (so saving takes as long as the clip). It never fetches YouTube's streams directly.
**Format (owner decisions, 2026-09-24):** the saved file is MP4 at the recording's own size (no
scaling). Chromium's MediaRecorder writes MP4 (H.264/AAC) directly. Firefox's can only write WebM
(VP8/Opus), so after recording, the background page (`entrypoints/background.ts`, since it failed in
the content script) runs `media/convertToMp4.ts` to convert the finished file with
[Mediabunny](https://mediabunny.dev) (MPL-2.0) and Firefox's own WebCodecs encoders: H.264 video, AAC
audio where available, otherwise the Opus copied into the MP4 (Firefox has no AAC encoder). If the
conversion fails, the WebM is saved instead and the panel says so. Encoding the live stream with
Mediabunny was tried first and failed in Firefox; converting the file avoids that code path. ffmpeg.wasm
was considered and rejected (GPL, ~31 MB, slow). Known limit: the WebM and the MP4 are both held in
memory during conversion (~50 MB per minute at 1080p30 each), so very long clips can run out of
memory. **Quality matches what's playing** (owner requirement): the recording uses the video's current resolution and frame rate, with the video bitrate
scaled to them (about 0.1 bits per pixel per frame, so ~6 Mbps at 1080p30) and 192 kbps audio, instead
of MediaRecorder's low default. On YouTube's "Auto" quality the resolution can change mid-clip.

**Out of scope:** clip links and embed links (see above), re-hosting on Streamable/Medal (neither has
an upload API: Streamable's API is read-only; Medal's only records local gameplay), a backend, accounts
and a hosted player page.

**Status:** In development (Firefox first, then Chrome). Current work is tracked in `TASKS.md`.

## Source-of-truth documents
| File | Owns | Maintained by |
|---|---|---|
| `CLAUDE.md` | How it's built: stack, architecture, workflow, rules | main session |
| `DESIGN.md` | How it looks | design-advisor (owner approves) |
| `CONTENT.md` | What it says | main session + owner input |
| `TASKS.md` | Current, next and completed work | main session |
| `README.md` | What it is; install, run, build | main session |

Don't duplicate information across these files; link to the owning file instead.

## Tech stack
- **Extension framework:** [WXT](https://wxt.dev) (Vite-based), targeting Firefox with Manifest V3.
  A Chrome version follows once the Firefox version works (owner decision, 2026-09-24; see the Chrome
  phase in `TASKS.md`), so code stays cross-browser from the start (see Guidelines).
- **Language:** TypeScript, strict mode.
- **UI:** React 19. The in-page panel uses WXT's shadow-root UI (`createShadowRootUi`), so YouTube's
  CSS and ours can't leak into each other.
- **Styling:** plain CSS with custom properties; tokens are defined in `DESIGN.md`. No Tailwind, no UI
  library.
- **Lint / format:** ESLint + Prettier. Semicolons, double quotes. Markdown is excluded from Prettier.
- **Testing:** Vitest unit tests for the logic: timestamp parsing and formatting, video IDs,
  start/end validation, recording format, bitrate and file names. UI on live YouTube is checked
  manually (see Workflow).
- **Runtime:** Node 24 + npm.
- **Media:** [Mediabunny](https://mediabunny.dev) (MPL-2.0) converts Firefox's WebM recording to MP4.
- **Backend / database:** none.

## Commands
`npm run check` runs all the checks below in one go.

```bash
npm install            # install dependencies (runs `wxt prepare` via postinstall; run
                       # `npx wxt prepare` yourself after `npm install <pkg>`, which skips it)
npm run dev            # start Firefox with the extension loaded and hot reload. If Firefox is already
                       # open, the git-ignored web-ext.config.ts needs firefoxArgs: ["-new-instance"]
                       # On Windows, stopping `npm run dev` can leave WXT's node process running;
                       # several servers then overwrite each other's builds. Before starting another,
                       # stop every `node …wxt\bin\wxt.mjs` process (check ports 3000+).
npm run build          # production build for Firefox into .output/
npm run zip            # package the build (and source zip) for addons.mozilla.org
npm run typecheck      # tsc --noEmit
npm run lint           # eslint .
npm run format         # prettier --write .
npm run format:check   # prettier --check .
npm test               # vitest run
npm run check          # typecheck, lint, format:check, test, build, lint:addon
npm run lint:addon     # Mozilla's add-on linter on the build (run after `build`). 2 UNSAFE_VAR_ASSIGNMENT
                       # warnings for innerHTML are expected: they're in ReactDOM (<script> creation and
                       # dangerouslySetInnerHTML, neither of which we use). Anything else must be fixed.
```

Before every commit: `npm run check` must pass (and `npm run build:chrome` when the manifest or
background changes).

## Workflow
- **Agents (lighter setup, owner decision 2026-09-24, to save tokens):** the main session codes,
  decides and runs `npm run check` itself. Agents start from zero each time, so use them only where
  they pay off:
  - `code-reviewer` (Sonnet, read-only): substantive code only, meaning new features and tricky logic
    (recording, lifecycle, races). Not for CSS tweaks, copy, docs or one-line fixes.
  - `design-advisor` (Opus, edits `DESIGN.md` only): new visual patterns or deviations from
    `DESIGN.md`. Small spec updates the main session can describe don't need a new run.
  - `qa-checker` (Haiku, runs checks only): one full pass before a release, not after each change.
  The general versions live in `~/.claude/agents/`.
- **Feature flow:** plan → design-advisor (new visual patterns only) → implement → `npm run check` →
  code-reviewer (substantive code only) → fix → manual YouTube check → commit.
- **Manual YouTube check** after every feature that touches the page, in Firefox via `npm run dev`
  (refresh the YouTube tab after each change. A hook in `wxt.config.ts` makes every content-script
  change reload the whole extension, because WXT's quick MV3 reload left Firefox running the old
  copy; if a tab still looks stale, press Alt+R in the dev Firefox window, then refresh):
  - the clip button appears on a watch page;
  - it still works after moving to another video without a page reload (YouTube is a single-page app);
  - light and dark YouTube themes;
  - default, theater and fullscreen player modes;
  - Save video produces an MP4 of start→end with sound, at the selected quality and original size.
- Reviewer and QA only report. Never two agents writing the same file.
- **Git:** commit straight to `main` at every verified milestone without being asked, with plain
  imperative commit messages. Push only when asked.

## Architecture conventions
WXT's file-based entrypoints. Create a folder only when its first real file exists. Expected shape:

```
entrypoints/
  youtube.content/     content script on youtube.com: clip button and clip panel
  background.ts        background page: converts Firefox's WebM recordings to MP4
components/            shared React components
lib/                   pure logic: video IDs, time parsing, form checks, recording (unit tested)
media/                 browser media work that can't be unit tested (WebM → MP4 conversion)
public/icon/           extension icon PNGs (16–128), rendered from assets/icon/*.svg
assets/icon/           icon SVG sources: icon.svg (48–128px), icon-small.svg (16–32px, pixel-snapped)
wxt.config.ts          manifest settings (MV3, Firefox gecko settings, host permissions)
```

- **Pure logic** lives in `lib/` as functions with tests next to them (`*.test.ts`).
- **YouTube navigation:** YouTube changes videos without reloading. Re-inject and reset state on WXT's
  `wxt:locationchange` (or YouTube's `yt-navigate-finish`), and clean up through the content script
  `ctx`.
- **Trusted Types:** YouTube enforces them, so `innerHTML`, `outerHTML`, `insertAdjacentHTML` and
  `document.write` throw on its pages. Build DOM (including SVG icons) with `createElement` /
  `createElementNS`; React is fine.
- **Player controls:** YouTube's current player splits `.ytp-right-controls` into
  `.ytp-right-controls-left` and `.ytp-right-controls-right`; older players have a flat
  `.ytp-right-controls`. Handle both. Buttons injected there use YouTube's `.ytp-button` class, and CSS
  that lands in YouTube's page uses the `clip-ext-` prefix.
- **Playback control** goes through the page's `<video>` element (seek, `timeupdate` to pause at the end).
  Don't depend on fragile YouTube internals when a DOM or media API will do.
- **Permissions:** request only what's needed (content scripts on `www.youtube.com` and
  `m.youtube.com`; no others so far). No broad host permissions.
- Relative imports include the file extension (`./time.ts`). One component per file,
  default-exported and named after the file. Comment only what isn't obvious.
- UI strings live in `lib/strings.ts`, mirrored from `CONTENT.md`, never hard-coded in JSX or DOM code.
- Add a dependency only with a clear reason.

## Secrets policy
- The project needs no API keys: the YouTube page's own player and oEmbed need none.
- Never commit `.env` or keys. `.gitignore` lists `.env`, `.env.*`, `!.env.example`. If a key is ever
  added, commit a `.env.example` with empty values. Extension code is shipped to users, so it can never
  hold a secret.
- Personal documents go in the git-ignored `private/` folder.
- Before any push, scan staged files: `git grep --cached -nE 'AIza|mongodb(\+srv)?://|sk-|gh[pousr]_'`.
- Before making the repo public, audit its full history for secrets and commit identity.

## Deployment
- **Now:** local only. Load the extension with `npm run dev`, or load the build as a temporary add-on
  from `about:debugging`.
- **Later:** addons.mozilla.org (listed or unlisted), using `npm run zip`. This needs a Mozilla account
  and a name that complies with Mozilla's policy (see `CONTENT.md`).
- **Manifest identity** (in `wxt.config.ts`): the gecko ID is a random UUID, so it has no name or email in
  it and stays the same if the name changes; never change it after the first AMO upload. The manifest
  declares `data_collection_permissions: none`; keep it true.
- **Repo:** private until the first version is done, then public (see the launch list in `TASKS.md`).
- **Commit identity:** the owner's GitHub no-reply address, set in this repo's local git config (never
  the personal email).

## Guidelines
- Accessibility: WCAG AA, keyboard navigable, visible focus, respects `prefers-reduced-motion`.
- Themes: the in-page panel is always dark (it sits on the video). Details in `DESIGN.md`.
- Cross-browser: a Chrome version follows the Firefox one. Use WXT's `browser` for extension APIs, keep
  Firefox-only manifest keys under `browser_specific_settings`, and don't rely on Firefox-only
  behaviour without a Chrome fallback. Note anything Firefox-specific in the code.
- No analytics, no tracking, no network calls beyond YouTube itself. Clips are never sent anywhere.
- Nothing personal in public files unless the owner asks.
- Copy comes from `CONTENT.md`; never invent features, metrics or results.
- Every UI surface gets screenshots for the README, captured by running the extension and approved by
  the owner.
- qa-checker should also search for leftover `console.log`, broad host permissions in the manifest, and
  personal info.
