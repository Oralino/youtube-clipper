# CONTENT.md
Source of truth for what the extension says. Update this file first, then mirror it into the UI strings
module (see `CLAUDE.md`).

Rules: Claude drafts copy from the agreed features and the owner reviews it. Never invent features,
metrics or results. Only link public repos. **TODO (owner)** items need the owner's input.
**Status:** Approved by the owner to build with (2026-09-24); the owner may still change any text.

## About
- **Display name:** YouTube Clips (working name).
  **TODO (owner)**: Settle the final name before any addons.mozilla.org listing. Mozilla's policy
  doesn't allow names that suggest an official connection with another brand; "Clipper for YouTube"
  follows the accepted pattern and matches the repo name `youtube-clipper`.
- **One-liner:** Clip part of a YouTube video and save it as an MP4 to share anywhere.
- **Tone:** short, plain and native to YouTube. Labels are verbs, with no exclamation marks or emoji.
- **Personal info shown:** none.

## UI copy

### Clip button (player controls)
| Element | Text |
|---|---|
| Button tooltip / accessible name | Clip |

### Clip panel
| Element | Text |
|---|---|
| Heading | Create clip |
| Start field label | Start |
| End field label | End |
| Use-current-time button | Use current time |
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
| Quality note | Saves at the player's quality. For a steady result, pick one in Settings instead of Auto. |
| Saved (button label, 2s) | Saved |
| Announcement: start | Saving video. This takes {length}. |
| Announcement: progress (every 30s on long clips) | Saving {elapsed} of {length} |
| Announcement: saved | Video saved |
| Announcement: stopped | Saving stopped |
| Error: protected video | This video is protected and can't be saved. |
| Error: ad | An ad interrupted saving. Try again after it ends. |
| Error: paused | Saving stopped because the video was paused. |
| Error: skipped | Saving stopped because the video was skipped. |
| Error: can't record | Your browser can't record this video. |
| Error: other | Couldn't save the video. |
| File name | {video title} ({start}-{end}).mp4, times with dots, e.g. Me at the zoo (0.05-0.12).mp4 (.webm when MP4 isn't available) |

### Toolbar popup
| State | Text |
|---|---|
| Watch page, panel closed | Clip a section of this video. · Button: Open clip panel |
| Watch page, panel open | Button: Close clip panel |
| Any other page | Open a YouTube video to clip it. |
| Content script missing | Reload this tab to use the extension. · Button: Reload tab |


## Screenshots and media
- None exist yet. After the first version works, capture the clip panel (idle and while saving) and
  the toolbar popup, on a video with no personal details visible.
- The owner approves every screenshot before it goes into the README.
- The extension icon still needs designing (sizes and style are in `DESIGN.md`).

## Store listing
Written when the extension goes to addons.mozilla.org (summary, description, screenshots), after the
final name is settled.
