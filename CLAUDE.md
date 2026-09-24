# CLAUDE.md

This file guides Claude Code when working in this repository.

## Project overview
A Firefox extension that lets you make clips straight from a YouTube video and share them as a link.
YouTube has no one-click way to clip a moment and send it to a friend; this is for people who want to
clip and share YouTube moments. Personal project, solo.

**How a clip works:** the user picks a start and end on a YouTube watch page and copies a link. The
link is a normal YouTube watch URL with `t=START` plus an end-time parameter. When someone with the
extension opens it, the extension plays START→END as a clip. Without the extension, YouTube ignores the
extra parameter and plays from START. An optional embed link (`youtube.com/embed/ID?start=…&end=…`)
covers friends without the extension, but it fails on videos that block embedding.

**First version:** clip button in the player, set start/end, preview, copy link, copy embed link.

**Out of scope:** downloading video, MP4 files, and re-hosting on Streamable/Medal. YouTube's terms
forbid downloading, Mozilla would likely reject it, and neither service has an upload API (Streamable's
API is read-only; Medal's API only records local gameplay). Also out of scope: a backend, accounts and a
hosted player page. All clip data lives in the link.

**Status:** Planning. Current work is tracked in `TASKS.md`.

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
  A Chrome build is a later nice-to-have (see `TASKS.md`).
- **Language:** TypeScript, strict mode.
- **UI:** React 19. The in-page panel uses WXT's shadow-root UI (`createShadowRootUi`), so YouTube's
  CSS and ours can't leak into each other.
- **Styling:** plain CSS with custom properties; tokens are defined in `DESIGN.md`. No Tailwind, no UI
  library.
- **Lint / format:** ESLint + Prettier. Semicolons, double quotes. Markdown is excluded from Prettier.
- **Testing:** Vitest unit tests for the logic: timestamp parsing and formatting, building and reading
  clip links, start/end validation. UI on live YouTube is checked manually (see Workflow).
- **Runtime:** Node 24 + npm.
- **Backend / database:** none.

## Commands
qa-checker runs these.

```bash
npm install            # install dependencies (runs `wxt prepare` via postinstall; run
                       # `npx wxt prepare` yourself after `npm install <pkg>`, which skips it)
npm run dev            # start Firefox with the extension loaded and hot reload. If Firefox is already
                       # open, the git-ignored web-ext.config.ts needs firefoxArgs: ["-new-instance"]
npm run build          # production build for Firefox into .output/
npm run zip            # package the build (and source zip) for addons.mozilla.org
npm run typecheck      # tsc --noEmit
npm run lint           # eslint .
npm run format         # prettier --write .
npm run format:check   # prettier --check .
npm test               # vitest run
npm run lint:addon     # Mozilla's add-on linter on the build (run after `build`). 2 UNSAFE_VAR_ASSIGNMENT
                       # warnings for innerHTML are expected: they're in ReactDOM (<script> creation and
                       # dangerouslySetInnerHTML, neither of which we use). Anything else must be fixed.
```

Before every commit: `lint`, `typecheck`, `format:check`, `test` and `build` must pass, plus
`lint:addon` whenever the manifest or permissions change.

## Workflow
- **Agents:** the main session codes and decides. `design-advisor` (Opus) edits `DESIGN.md` only.
  `code-reviewer` (Sonnet) is read-only. `qa-checker` (Haiku) runs checks only. The general versions
  live in `~/.claude/agents/`.
- **Feature flow:** plan → design-advisor (new visual patterns or `DESIGN.md` deviations only) →
  implement → code-reviewer + qa-checker in parallel → fix → manual YouTube check → commit.
- **Manual YouTube check** after every feature that touches the page, in Firefox via `npm run dev`
  (refresh the YouTube tab after each content-script change: WXT's reload doesn't update pages that
  are already open):
  - the clip button appears on a watch page;
  - it still works after moving to another video without a page reload (YouTube is a single-page app);
  - light and dark YouTube themes;
  - default, theater and fullscreen player modes;
  - a clip link opened in a fresh tab plays start→end and pauses at the end.
- Don't spawn agents for small tasks. Reviewer and QA only report. Never two agents writing the same file.
- **Git:** commit straight to `main` at every verified milestone without being asked, with plain
  imperative commit messages. Push only when asked.

## Architecture conventions
WXT's file-based entrypoints. Create a folder only when its first real file exists. Expected shape:

```
entrypoints/
  youtube.content/     content script on youtube.com: clip button, panel, clip playback
  popup/               toolbar popup (shortcut to the panel on the active tab)
components/            shared React components
lib/                   pure logic: clip link build/parse, time parsing/formatting (unit tested)
public/icon/           extension icons
wxt.config.ts          manifest settings (MV3, Firefox gecko settings, host permissions)
```

- **Clip link format:** `https://www.youtube.com/watch?v=ID&t=START#clip_end=END`, with START and END in
  whole seconds. `t` is YouTube's own start parameter, so viewers without the extension still start in
  the right place. The end time goes in the hash because the hash is never sent to YouTube's servers and
  query-string cleaners are less likely to strip it.
- **Reading the link:** YouTube's page script removes unknown query parameters and the hash from the
  address bar right after load (tested 2026-09-24). The server does not remove them: they survive direct
  opens, `youtu.be` redirects and the `m.youtube.com` redirect. So the content script runs at
  `document_start` and reads `location.href` before YouTube rewrites it, falling back to
  `performance.getEntriesByType("navigation")[0].name`, which keeps the originally requested URL.
- **Clip link logic** lives in `lib/` as pure functions with tests next to them (`*.test.ts`).
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
- **Permissions:** request only what's needed (content script on `*://*.youtube.com/*`, `clipboardWrite`
  if required). No broad host permissions.
- Relative imports include the file extension (`./clipLink.ts`). One component per file,
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
- Themes: the in-page UI follows YouTube's light/dark theme; the popup follows the system setting. No
  flash on load. Details in `DESIGN.md`.
- No analytics, no tracking, no network calls beyond YouTube itself. Clips are never sent anywhere.
- Nothing personal in public files unless the owner asks.
- Copy comes from `CONTENT.md`; never invent features, metrics or results.
- Every UI surface gets screenshots for the README, captured by running the extension and approved by
  the owner.
- qa-checker should also search for leftover `console.log`, broad host permissions in the manifest, and
  personal info.
