# TASKS.md
Development tracker. Newest completed items go on top. Owner-only items are marked **(owner)**.

## Current
First milestone: on any YouTube video, click the clip button, set start/end and copy a link. Opening
that link with the extension plays just start→end.

- [ ] **(owner)** Paste a test link into Discord (and any other chat app you use), click it, and check
      that the URL that opens still ends in `#clip_end=12`:
      `https://www.youtube.com/watch?v=jNQXAC9IVRw&t=5#clip_end=12`
- [ ] Check what happens when a clip link is clicked *inside* YouTube (a comment or description). YouTube
      handles those clicks without a page load and may drop the hash before the content script sees it
- [ ] Clip playback: open a clip link, play start→end, pause at the end, replay, watch full video
- [ ] Toolbar popup: opens the panel on the active YouTube tab
- [ ] **(owner)** Decide whether to mark the clip range on YouTube's progress bar (recommended: skip for v1)

## Next
- [ ] Accessibility pass: keyboard-only use, focus order, contrast in both themes, reduced motion
- [ ] Extension icon (sizes in `DESIGN.md`); **(owner)** final colour and tile, after the name is settled
- [ ] **(owner)** Choose a demo video you have the right to show (your own upload, Creative Commons or
      public domain)
- [ ] README screenshots of the panel, popup and clip playback in both themes **(owner approves)**
- [ ] Open decision: support YouTube Shorts and live streams, or watch pages only?

## Launch
- [ ] **(owner)** Settle the final name (Mozilla naming policy; see `CONTENT.md`)
- [ ] **(owner)** Choose a license (see `README.md`)
- [ ] Full-history audit: secrets, personal data, commit identity
- [ ] **(owner)** Make the repo public
- [ ] **(owner)** Decide on addons.mozilla.org listed vs unlisted; create the Mozilla account; submit
      `npm run zip` output
- [ ] Verify an installed (non-temporary) build: a clip link opened in a fresh tab plays start→end

## Chrome (after the Firefox version works)
- [ ] Add Chrome scripts (`dev:chrome`, `build:chrome`, `zip:chrome`) using WXT's `-b chrome`
- [ ] Run the manual YouTube check in Chrome: clip button, panel, clip links, playback, popup
- [ ] Fix any Chrome differences found (manifest keys, shadow-root styles, event isolation)
- [ ] README: add Chrome install and build steps
- [ ] **(owner)** Create a Chrome Web Store developer account (one-time registration fee) and decide
      listed vs unlisted
- [ ] Submit the `zip:chrome` build to the Chrome Web Store

## Done
- [x] Clip panel: in-player overlay (owner's choice), start/end with use current time and
      validation, preview loop, copy link, copy embed link (plays in Discord; Error 153 in a browser is
      expected), hidden during ads; reviewed by all three agents; owner tested copy and preview
      (2026-09-24)
- [x] **(owner)** Decided: the fullscreen panel is always dark; build with the drafted copy in
      `CONTENT.md` (2026-09-24)
- [x] Clip button in the player: outline icon, filled while the panel is open, Clip tooltip, Enter
      toggles it, survives moving between videos; code-reviewer + qa-checker clean; owner checked it
      in Firefox (2026-09-24)
- [x] `lib/`: clip link build/parse, embed link, range validation, time parsing/formatting; 91 unit
      tests; reviewed by code-reviewer and qa-checker, findings fixed (2026-09-24)
- [x] Scaffolded WXT (Firefox MV3, React 19, TypeScript strict), ESLint + Prettier, Vitest, npm scripts;
      all checks and Mozilla's add-on linter pass (2026-09-24)
- [x] Link-format test (2026-09-24): chose `watch?v=ID&t=START#clip_end=END`. YouTube strips the extra
      part from the address bar after load, but it reaches the page intact on direct opens, `youtu.be`
      redirects and `m.youtube.com` redirects, so a `document_start` content script can read it
      (details in `CLAUDE.md`, Architecture)
- [x] **(owner)** Approved `DESIGN.md` (2026-09-24)
- [x] Project kickoff: CLAUDE.md, DESIGN.md, CONTENT.md, README.md and TASKS.md created
