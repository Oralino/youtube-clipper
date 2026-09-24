# TASKS.md
Development tracker. Owner-only items are marked **(owner)**. Detailed history is in git.

## Current
- [ ] **(owner)** Check a saved MP4 plays on your phone and in Discord (plays with sound on PC). From
      Firefox the audio is Opus (no AAC encoder), which older iPhones may not play
- [ ] **(owner)** Check Stop saving (while recording and while converting) saves nothing, and that
      YouTube keeps its sound after a save

## Next
- [ ] Accessibility pass: keyboard-only use, focus order, contrast, reduced motion
- [ ] **(owner)** Choose a demo video you have the right to show (your own upload, Creative Commons or
      public domain)
- [ ] README screenshot of the clip panel while saving **(owner approves)** (idle one added)
- [ ] Decide on YouTube Shorts and live streams (TBD in `REQUIREMENTS.md`)

## Launch (1.0.0 submitted to addons.mozilla.org, waiting for review)
- [ ] **(owner)** Add the addons.mozilla.org link to `README.md` once the listing is live
- [ ] **(owner)** Once Mozilla approves the add-on, download the signed `.xpi` from the developer hub
      and attach it to the GitHub release as `clipper-for-youtube-<version>.xpi` (I can upload it), then
      remove the unsigned test build from the release and README
- [ ] Verify an installed (non-temporary) build: Save video produces a working file

## Bugs
None open.

## Done (milestones)
- [x] 1.0.1: Chrome falls back to WebM + software MP4 conversion when its hardware H.264 encoder
      fails (reported by a friend on Chrome 154; confirmed fixed) (2026-09-24)
- [x] 1.0.0: public repo and GitHub release (Chrome zip, unsigned Firefox test build); submitted to
      addons.mozilla.org; MIT; history audited (2026-09-24)
- [x] Name, icon, File name field, Chrome support (2026-09-24)
- [x] Save video: records at the playing quality, MP4 in both browsers (Firefox converts in the
      background page) (2026-09-24)
- [x] Clip button and in-player clip panel with preview (2026-09-24)
