# REQUIREMENTS.md
What the extension must do, and the owner's decisions behind it. How it works is in `ARCHITECTURE.md`.

## Goal
**Clipper for YouTube** is a Firefox and Chrome extension for clipping part of a YouTube video and
saving it as an MP4 that can be watched and shared outside YouTube, including on phones. YouTube has no
one-click way to do this. Users: people who want to clip and share YouTube moments. Personal project,
solo, MIT-licensed.

## Features (1.0.0, all built)
- A **Clip** button in the YouTube player on watch pages (live streams included), and in the action
  bar beside Shorts (between Share and Remix); its icon fills in while the panel is open.
- A **clip panel** over the video (bottom-right, always dark, in every player mode and on Shorts):
  - Start and End, typed (`83`, `1:23`, `1:02:03`) or from **Use current time**, with inline errors;
  - an optional **File name**; empty means the automatic `<title> (<start>-<end>)`;
  - **Preview**, which loops the range in the player;
  - **Save video**, which records start→end in real time and downloads an MP4.
- Hidden during ads; closing the panel or changing video cancels a save.

## Acceptance criteria
Checked by hand in Firefox (and Chrome for releases) on a live watch page:
- the clip button appears, and still works after moving to another video without a page reload;
- on Shorts: the button sits between Share and Remix, follows to the next Short on scroll, and the
  panel opens over the Short with its fields and buttons usable;
- default, theater and fullscreen player modes;
- Save video produces an MP4 of exactly start→end, with sound, at the selected quality and original
  size (no scaling);
- Stop saving and closing the panel leave no file; YouTube keeps its sound afterwards.

## Owner decisions (2026-09-24)
- **No links.** Copying a clip link or an embed link was built and then dropped: YouTube's player can't
  stop at an end time, so links only worked with the extension installed, and embed links fail with
  YouTube's Error 153 when opened directly (browser, Discord mobile). The saved file is the only way a
  clip leaves the extension.
- **Save video, knowing the trade-offs:** it goes against YouTube's terms of service, the Chrome Web
  Store bans YouTube downloaders, and protected (DRM) videos can't be saved. A hosted clip page was
  offered and declined.
- **Always MP4, at the recording's own size and the selected quality.** On Firefox (WebM only), the
  finished recording is converted in the browser; if that fails, the WebM is saved and the panel says
  so. ffmpeg.wasm was rejected (GPL, ~31 MB, slow).
- **No toolbar popup**: the clip button and panel are enough.
- **Name** "Clipper for YouTube", in the "… for YouTube" pattern Mozilla's naming policy prefers.
- **Release:** Firefox on addons.mozilla.org, plus the Mozilla-signed `.xpi` on GitHub releases;
  Chrome from GitHub releases, loaded unpacked (not the Chrome Web Store).
- **Privacy:** no analytics, no tracking, no network calls beyond YouTube; nothing is collected or
  sent anywhere.

## Out of scope
Clip links and embed links; re-hosting on Streamable or Medal (neither has an upload API: Streamable's
is read-only, Medal's only records local gameplay); a backend, accounts or a hosted player page; a
toolbar popup.

- **Releases while AMO review is pending (2026-09-25):** keep shipping new versions to GitHub and
  addons.mozilla.org without waiting for the earlier version's approval.
- **Shorts and live streams (2026-09-25):** live streams keep the watch-page button as it is; Shorts
  get the button in their action bar, between Share and Remix.

## Open decisions
None.
