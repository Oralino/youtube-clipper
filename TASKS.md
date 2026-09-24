# TASKS.md
Development tracker. Newest completed items go on top. Owner-only items are marked **(owner)**.

## Current
First milestone: on any YouTube video, click the clip button, set start/end and copy a link. Opening
that link with the extension plays just start→end.

- [ ] **Link-format test (do first).** Check that an end-time parameter on a watch URL survives: a direct
      open, `youtu.be` redirects, pasting into Discord and other chat apps, and YouTube's own URL
      rewriting after load. Check the hash as well as the query string. Record the chosen format in
      `CLAUDE.md` (Architecture) before building UI.
- [ ] Scaffold WXT (Firefox, MV3, React, TypeScript strict), ESLint + Prettier, Vitest and the npm
      scripts listed in `CLAUDE.md`
- [ ] `lib/` clip link build/parse and time parsing/formatting, with unit tests
- [ ] Clip button injected into the player; survives moving between videos
- [ ] Clip panel: start/end, use current time, preview, copy link, copy embed link, validation
- [ ] Clip playback: open a clip link, play start→end, pause at the end, replay, watch full video
- [ ] Toolbar popup: opens the panel on the active YouTube tab
- [ ] **(owner)** Review and approve `DESIGN.md` (no UI is built before this)
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
- [x] Project kickoff: CLAUDE.md, DESIGN.md, CONTENT.md, README.md and TASKS.md created
