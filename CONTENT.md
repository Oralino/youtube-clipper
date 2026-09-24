# CONTENT.md
Source of truth for what the extension says. Update this file first, then mirror it into the UI strings
module (see `CLAUDE.md`).

Rules: Claude drafts copy from the agreed features and the owner reviews it. Never invent features,
metrics or results. Only link public repos. **TODO (owner)** items need the owner's input.
**Status:** Draft, awaiting owner review.

## About
- **Display name:** YouTube Clips (working name).
  **TODO (owner)**: Settle the final name before any addons.mozilla.org listing. Mozilla's policy
  doesn't allow names that suggest an official connection with another brand; "Clipper for YouTube"
  follows the accepted pattern and matches the repo name `youtube-clipper`.
- **One-liner:** Make clips straight from a YouTube video and share them as a link.
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
| Preview button (off / on) | Preview / Stop preview |
| Copy link button | Copy link |
| Copy embed link button | Copy embed link |
| Embed note | For friends without the extension. Some videos don't allow embedding. |
| Copied (button label, 2s) | Copied |
| Copied (screen-reader announcement) | Link copied |
| Copy failed (button label, 2s) | Couldn't copy |
| Copy failed (manual field label) | Copy this link manually |
| Error: unreadable time | Enter a time like 1:23. |
| Error: end before start | End must be after start. |
| Error: time outside video | Time is outside the video. |
| Close button accessible name | Close |

### Toolbar popup
| State | Text |
|---|---|
| Watch page, panel closed | Clip a section of this video. · Button: Open clip panel |
| Watch page, panel open | Button: Close clip panel |
| Any other page | Open a YouTube video to clip it. |
| Content script missing | Reload this tab to use the extension. · Button: Reload tab |

### Clip playback (opening a clip link)
| Element | Text |
|---|---|
| Clip indicator | Clip · {start} – {end} |
| Clip ended | Clip ended |
| Replay button | Replay |
| Exit button | Watch full video |

## Screenshots and media
- None exist yet. After the first version works, capture the clip panel, the toolbar popup and clip
  playback, in light and dark themes, on a video with no personal details visible.
- The owner approves every screenshot before it goes into the README.
- The extension icon still needs designing (sizes and style are in `DESIGN.md`).

## Store listing
Written when the extension goes to addons.mozilla.org (summary, description, screenshots), after the
final name is settled.
