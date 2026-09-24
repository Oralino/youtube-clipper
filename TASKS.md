# TASKS.md
Development tracker. Newest completed items go on top. Owner-only items are marked **(owner)**.

## Current
First milestone: on any YouTube video, click the clip button, set start/end and save the clip as an
MP4 that plays on a phone.

- [ ] Save video: record the clip start→end to an MP4 (WebM fallback) and download it, with progress,
      cancel and errors (protected video, ad, navigation); same quality as the selected one (bitrate
      scaled to resolution and frame rate); check audio and quality in Firefox
- [ ] MP4 in Firefox: convert Firefox's WebM recording to MP4 in the browser (WebCodecs), depending on
      which encoders the owner's Firefox has
- [ ] Toolbar popup: opens the panel on the active YouTube tab

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
- [ ] Verify an installed (non-temporary) build: Save video produces a working MP4

## Chrome (after the Firefox version works)
- [ ] Add Chrome scripts (`dev:chrome`, `build:chrome`, `zip:chrome`) using WXT's `-b chrome`
- [ ] Run the manual YouTube check in Chrome: clip button, panel, preview, Save video, popup
- [ ] Fix any Chrome differences found (manifest keys, shadow-root styles, event isolation)
- [ ] README: add Chrome install and build steps
- [ ] **(owner)** Decide how to ship on Chrome: the Chrome Web Store bans YouTube downloaders, and with
      links gone a store build without Save video could only preview. So the Chrome version most
      likely has to be distributed outside the store (for example as a .zip to load unpacked)
- [ ] **(owner)** Create a Chrome Web Store developer account (one-time registration fee) and decide
      listed vs unlisted
- [ ] Submit the `zip:chrome` build to the Chrome Web Store

## Done
- [x] **(owner)** Dropped clip links and embed links (YouTube's player can't stop at an end time;
      embeds fail with Error 153 outside an embedding page). Save video to MP4 is the way clips are
      shared (2026-09-24)
- [x] Clip panel: in-player overlay (owner's choice), start/end with use current time and
      validation, preview loop, copy link, copy embed link (plays in desktop Discord; Error 153 in a
      browser or Discord mobile is expected), hidden during ads; reviewed by all three agents; owner tested copy and preview
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
