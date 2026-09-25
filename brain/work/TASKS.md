# TASKS.md
Development tracker. Owner-only items are marked **(owner)**. Detailed history is in git.

## Current
- [ ] **(owner)** Upload 1.1.0 to addons.mozilla.org (`.output/youtube-clipper-1.1.0-firefox.zip` and
      `…-sources.zip`)

## Next
None planned.

## Launch (1.0.0 submitted to addons.mozilla.org, waiting for review)
- [ ] **(owner)** Add the addons.mozilla.org link to `README.md` once the listing is live
- [ ] **(owner)** Once Mozilla approves the add-on, download the signed `.xpi` from the developer hub
      and attach it to the GitHub release as `clipper-for-youtube-<version>.xpi` (I can upload it), then
      remove the unsigned test build from the release and README
- [ ] Verify an installed (non-temporary) build: Save video produces a working file

## Bugs
None open.

## Done (milestones)
- [x] 1.1.0: YouTube Shorts and the accessibility pass; GitHub release with the Chrome zip and the
      unsigned Firefox test build (2026-09-25)
- [x] Owner checks: a saved MP4 plays on a phone and in Discord; Stop saving leaves no file and
      YouTube keeps its sound. The idle README screenshot is enough (2026-09-25)
- [x] YouTube Shorts: Clip button in the action bar between Share and Remix, panel over the Short;
      live streams keep the player button; design approved and checked by the owner in the dev
      Firefox (2026-09-25)
- [x] Accessibility pass: contrast, focus order, keyboard and reduced motion checked against
      `DESIGN.md`; Preview is a plain button (no `aria-pressed`), forced-colours styles, field errors
      announced, clip length named for screen readers; checked by the owner in the dev Firefox
      (2026-09-25)
- [x] 1.0.1: Chrome falls back to WebM + software MP4 conversion when its hardware H.264 encoder
      fails (reported by a friend on Chrome 154; confirmed fixed) (2026-09-24)
- [x] 1.0.0: public repo and GitHub release (Chrome zip, unsigned Firefox test build); submitted to
      addons.mozilla.org; MIT; history audited (2026-09-24)
- [x] Name, icon, File name field, Chrome support (2026-09-24)
- [x] Save video: records at the playing quality, MP4 in both browsers (Firefox converts in the
      background page) (2026-09-24)
- [x] Clip button and in-player clip panel with preview (2026-09-24)
