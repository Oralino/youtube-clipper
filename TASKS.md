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
- [ ] `lib/` clip link build/parse and time parsing/formatting, with unit tests
- [ ] Clip button injected into the player; survives moving between videos
- [ ] Clip panel: start/end, use current time, preview, copy link, copy embed link, validation
- [ ] Clip playback: open a clip link, play start→end, pause at the end, replay, watch full video
- [ ] Toolbar popup: opens the panel on the active YouTube tab
- [ ] **(owner)** Review the draft UI copy in `CONTENT.md`
- [ ] **(owner)** Confirm the fullscreen panel overlay is always dark, even in YouTube light mode (`DESIGN.md`)
- [ ] **(owner)** Decide whether to mark the clip range on YouTube's progress bar (recommended: skip for v1)

## Next
- [ ] Accessibility pass: keyboard-only use, focus order, contrast in both themes, reduced motion
- [ ] Extension icon (sizes in `DESIGN.md`); **(owner)** final colour and tile, after the name is settled
- [ ] **(owner)** Choose a demo video you have the right to show (your own upload, Creative Commons or
      public domain)
- [ ] README screenshots of the panel, popup and clip playback in both themes **(owner approves)**
- [ ] Open decision: support YouTube Shorts and live streams, or watch pages only?
- [ ] Nice-to-have: Chrome build (WXT `-b chrome`)

## Launch
- [ ] **(owner)** Settle the final name (Mozilla naming policy; see `CONTENT.md`)
- [ ] **(owner)** Choose a license (see `README.md`)
- [ ] Full-history audit: secrets, personal data, commit identity
- [ ] **(owner)** Make the repo public
- [ ] **(owner)** Decide on addons.mozilla.org listed vs unlisted; create the Mozilla account; submit
      `npm run zip` output
- [ ] Verify an installed (non-temporary) build: a clip link opened in a fresh tab plays start→end

## Done
- [x] Scaffolded WXT (Firefox MV3, React 19, TypeScript strict), ESLint + Prettier, Vitest, npm scripts;
      all checks and Mozilla's add-on linter pass (2026-09-24)
- [x] Link-format test (2026-09-24): chose `watch?v=ID&t=START#clip_end=END`. YouTube strips the extra
      part from the address bar after load, but it reaches the page intact on direct opens, `youtu.be`
      redirects and `m.youtube.com` redirects, so a `document_start` content script can read it
      (details in `CLAUDE.md`, Architecture)
- [x] **(owner)** Approved `DESIGN.md` (2026-09-24)
- [x] Project kickoff: CLAUDE.md, DESIGN.md, CONTENT.md, README.md and TASKS.md created
