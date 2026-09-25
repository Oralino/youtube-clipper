# CONTENT.md
Source of truth for what the extension says. Update this file first, then mirror it into
`lib/strings.ts`.

Rules: Claude drafts copy from the agreed features and the owner reviews it. Never invent features,
metrics or results. Only link public repos. **TODO (owner)** items need the owner's input.
**Status:** Approved by the owner to build with (2026-09-24); the owner may still change any text.

## About
- **Display name:** Clipper for YouTube (owner decision, 2026-09-24; Mozilla's naming policy prefers
  the "… for YouTube" pattern over names starting with "YouTube").
- **One-liner:** Clip part of a YouTube video and save it as an MP4 to share.
- **Tone:** short, plain and native to YouTube. Labels are verbs, with no exclamation marks or emoji.
- **Personal info shown:** none.

## UI copy

### Clip button (player controls and Shorts action bar)
| Element | Text |
|---|---|
| Button tooltip / accessible name | Clip |
| Shorts action-bar button: visible label and accessible name | Clip |

### Clip panel
| Element | Text |
|---|---|
| Heading | Create clip |
| Clip-length readout, screen-reader prefix (hidden, read before the time) | Clip length |
| Start field label | Start |
| End field label | End |
| Use-current-time button | Use current time |
| File name field label | File name (optional) |
| File name placeholder | {video title} ({start}-{end}), e.g. Me at the zoo (0.05-0.12); just {video title} until the range is valid |
| Use-current-time accessible names (start with the visible label, WCAG 2.5.3) | Use current time for start / Use current time for end |
| Preview button (off / on) | Preview / Stop preview |
| Error: unreadable time | Enter a time like 1:23. |
| Error: end before start | End must be after start. |
| Error: time outside video | Time is outside the video. |
| Close button accessible name | Close |

### Save video
| Element | Text |
|---|---|
| Button | Save video |
| Button while saving | Stop saving |
| Progress line | Saving {elapsed} / {length} |
| Saving note | Let it play to the end. Pausing, skipping or closing this panel stops saving. |
| Save-time note (first line of the idle note, valid range) | Saving plays the clip, so it takes {length}. |
| Save-time note (no valid range yet) | Saving takes as long as the clip. |
| Quality note | Saves at the player's quality. For a steady result, pick one in Settings instead of Auto. |
| Converting line (Firefox, after recording) | Converting to MP4 {percent}% |
| Converting note | Converting to MP4. Closing this panel stops it. |
| Saved (button label, 2s) | Saved |
| Announcement: start | Saving video. This takes {length}. |
| Announcement: progress (every 30s on long clips) | Saving {elapsed} of {length} |
| Announcement: converting | Converting to MP4 |
| Announcement: saved | Video saved |
| Announcement: stopped | Saving stopped |
| Error: protected video | This video is protected and can't be saved. |
| Error: ad | An ad interrupted saving. Try again after it ends. |
| Error: paused | Saving stopped because the video was paused. |
| Error: skipped | Saving stopped because the video was skipped. |
| Error: can't record | Your browser can't record this video. |
| Error: other | Couldn't save the video. |
| Error: MP4 conversion failed (WebM saved instead) | Couldn't convert to MP4, so it was saved as WebM. |
| File name | {typed name}.mp4, or if the field is empty {video title} ({start}-{end}).mp4, times with dots, e.g. Me at the zoo (0.05-0.12).mp4 (.webm only if the MP4 conversion fails) |


## Screenshots and media
- `assets/screenshots/clip-panel.png`: the clip panel, idle, owner's screenshot (2026-09-24), used in
  the README.
- `assets/screenshots/addons-card.png`: the extension in Firefox's add-ons manager, owner's
  screenshot (2026-09-24), under Install in the README. No second panel screenshot (owner, 2026-09-25).
- The owner approves every screenshot before it goes into the README.
- Extension icon: `assets/icon/icon.svg` (48–128px) and `icon-small.svg` (16–32px), rendered to
  `public/icon/`; owner approved 2026-09-24. Spec in `DESIGN.md`.

## Store listing
Written when the extension goes to addons.mozilla.org (summary, description, screenshots), after the
final name is settled.
