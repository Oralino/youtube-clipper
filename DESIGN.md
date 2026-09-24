# DESIGN.md

Visual source of truth, maintained by design-advisor. **Status: Approved by the owner (2026-09-24).** Open TODO (owner) items below are tracked in `TASKS.md`.
*Revised 2026-09-24:* the clip button sections (Layout, Components, its contrast note) were updated to match YouTube's current player (`ytp-delhi-modern-icons`), the open state is now a filled icon instead of a red underline (owner decision; `--clip-active-bar` removed, no red anywhere), Popup states treats live streams as watch pages, and the fullscreen panel overlay is always dark (owner decision; TODO resolved).
*Revised 2026-09-24 (clip panel review):* panel wording (heading, region name, close button name) now defers to CONTENT.md; the container-query line explains the 528px CSS value; the overlay records `z-index: 70` (to verify); Motion notes the replay on placement change; the time-input error documents its layout push and 4px gap; "Use current time" accessible names follow WCAG 2.5.3; added the clip-length readout type role and pill padding.
*Revised 2026-09-24 (overlay panel):* after trying the build, the owner decided the clip panel is an overlay inside the player in every mode (default, theater, fullscreen), bottom-right and always dark. The docked placement table, the wide ≥560px container-query layout, the placement-change motion replay and the `fullscreenchange` re-mount note are removed; single column is the only layout. The Constraints and Color theme wording is updated. The clip playback bar keeps its docked slot on its own. Follow-up: Personality, radius, elevation and screenshots no longer describe a docked panel; focus order now matches the single-column visual order (WCAG 2.4.3); the panel hides during ads (`#movie_player.ad-showing`) and keeps what was typed.
*Revised 2026-09-24 (preview and copy review):* added Icons (stroke set, sizes, the filled range-glyph exception), default copy-button icons, the button-stack and note gaps, the manual link field's placement and styling, and the manual field at the end of the focus order. Removed the stale 24px Start/End gap left over from the wide layout; the stacked groups use the 12px row gap.
*Revised 2026-09-24 (Save video):* added the Save video control (owner decision, see `CLAUDE.md`): its own group at the end of the stack, tonal, with saving/saved/failed states, a 4px progress bar, a quality note (the recording follows the player's quality, and "Auto" can change it mid-save), locked fields while saving, and closing the panel stops saving. Added the download and stop icons, the save-progress type role, the progress-bar contrast pairs, and Save video at the end of the focus order.

## Constraints (decided)

- Plain CSS with custom properties, React 19 + TypeScript. No Tailwind, no UI library.
- Feel: quick, unobtrusive, native, as if YouTube had built it. Match YouTube's control sizing, spacing and type. No web fonts loaded into youtube.com.
- Themes (D11): the clip panel is always dark (it's an in-player overlay, like YouTube's player menus). The clip bar follows YouTube's `dark` attribute on `<html>`. The clip button has no theme; it inherits YouTube's player control styling. The popup follows `prefers-color-scheme`. No flash on load. Theme swaps are instant.
- Accessibility (D10): WCAG AA contrast for every text/background pair in both themes, full keyboard use, visible focus, `prefers-reduced-motion` respected, no opacity on text for hierarchy.
- Surfaces must work in the default, theater and fullscreen player modes and in narrow windows. The popup has a fixed small width.
- Nothing personal in the UI, docs or screenshots.

## Avoid

- Purple/blue gradients, glassmorphism or backdrop blur, emoji icons, glow, and animation on everything.
- Anything that fights YouTube: branded headers or logos inside the panel, custom fonts on youtube.com, heavy or coloured shadows, a new accent colour, a "card floating on the page" look.
- YouTube's red anywhere in our UI. Red means "played" and "live" on YouTube.
- Scissors as our icon. YouTube's native Clip feature uses scissors, and ours must not look like it.
- Opacity or `rgba()` text colours. Every text colour is a solid hex from the tokens.

## Personality / direction

A YouTube control, not an app. The panel looks like YouTube's own in-player menus: a flat, opaque dark rounded block over the video, with Roboto, pill buttons and the black/white "Subscribe" style for the one primary action. Numbers (times) are the content, so they get tabular figures and the clearest type. Silent when idle, with one small button in the player. It shows feedback only where the user is looking: the label on the button they just pressed.

## Layout

### Clip button (in the player)
- Visually the **first item of the right controls**, so it doesn't move the settings, theater and fullscreen buttons people are used to. Current player: first child of `.ytp-right-controls-left` (the pill with expand, autoplay, CC, settings), so it sits inside that group's dark translucent pill. Older players with a flat `.ytp-right-controls`: its first child.
- Takes its size from YouTube's `.ytp-button` class rather than hard-coded px (about 48×40 today, 32×32 at the smallest widths), so it scales with the native buttons. `.ytp-button` clips overflow, so nothing may draw outside the button box.
- No `data-priority`, so like settings it stays visible in narrow players when YouTube collapses prioritised buttons behind its expand button.
- Shown on every `/watch` page, including live streams for now (live detection is unverified). Hidden elsewhere. **TODO (owner)**: decide on Shorts and live streams; hiding it on live stays part of that TODO.

### Clip panel
An overlay inside the player in **every player mode** (default, theater and fullscreen), with one placement (owner decision, 2026-09-24).
- Placement: inside `#movie_player`, anchored `right: 12px; bottom: 72px` (clears the progress bar and controls), `z-index: 70` (to verify in the owner's fullscreen check: the settings menu and the progress-bar thumbnail open above it, and `bottom: 72px` clears the enlarged scrubber).
- Size: `width: min(360px, calc(100% - 24px))`, `max-height: calc(100% - 96px)`, scrolls inside. It shrinks to fit small players.
- Theme: dark tokens always, even when YouTube is in light mode.
- While open it covers the bottom-right of the video.
- During ads (`#movie_player.ad-showing`): hidden without losing what was typed, and shown again when the ad ends. This keeps it off "Skip ad" and stops "Use current time" reading the ad's time. Implemented as a `data-ad` attribute on the host with `:host([data-ad]) { display: none !important }`.

Why an overlay: opening and closing it never moves the video or the title, it behaves the same in all three modes, and it appears the way YouTube's own in-player menus do.

Internal layout: a single column (the panel never gets wide enough for more). Each time group stays on one row (field plus "Use current time"). The Preview and copy buttons are full width in the order Preview, Copy link, Copy embed link, `8px` apart (one group, 12px below the End group). The note sits `8px` below Copy embed link. If copying fails, the manual link field appears below the note with a `12px` top margin (a new row), so nothing above it moves. The Save video group comes last, `12px` below the note (or the manual field while shown). It is a separate group because it is a different kind of action (slow, makes a file), and the 12px gap keeps the embed note visibly attached to Copy embed link. If a build leaves Save video out (Chrome store, see `TASKS.md`), the group is simply absent.
- Padding `16px`. Row gap `12px`.

Focus order: Close → Start → Use current time (start) → End → Use current time (end) → Preview → Copy link → Copy embed link → manual link field (only while shown) → Save video (matches the visual order). When the panel opens, focus goes to Start. `Esc` closes the panel and returns focus to the clip button.
*Main session:* keydown events inside the panel must not reach YouTube's shortcuts. Otherwise typing "1:23" seeks the video, because number keys jump to 10%, 20% and so on.

### Toolbar popup
- Fixed `width: 320px`, height fits the content, padding `16px`, no internal scrolling.
- Header row: 16px extension icon + extension name. Below it: one line of body text and at most one action.

### Clip playback bar
- Docked in the page flow, directly below the player and above the video title, full width of the primary column.
- Fullscreen: a compact bar inside the player, anchored `left: 12px; top: 12px`, dark tokens, `max-width: calc(100% - 24px)`.
- Narrow (< 480px container): the text stays on the first line and the buttons wrap to a second line, each `flex: 1`.

## Typography

Font stacks (no loading):
- In-page: `"Roboto", "Arial", sans-serif` (YouTube's own stack).
- Popup: `"Roboto", "Segoe UI", system-ui, sans-serif`.

Use `font-variant-numeric: tabular-nums` on every time value.

| Role | Size / line height | Weight |
|---|---|---|
| Panel title | 16px / 22px | 500 |
| Popup extension name | 14px / 20px | 500 |
| Field label ("Start", "End") | 12px / 16px | 500 |
| Time input value | 14px / 20px | 400, tabular |
| Body text (popup, clip bar) | 14px / 20px | 400 |
| Clip bar range ("1:23 – 1:45") | 14px / 20px | 500, tabular |
| Clip-length readout (panel header) | 14px / 20px | 400, tabular, `--clip-text-secondary` |
| Button label | 14px / 20px (36px control height) | 500 |
| Note, helper, error text | 12px / 18px | 400 |
| Save progress ("Saving 0:03 / 0:07") | 12px / 18px | 500, tabular, `--clip-text` |

Minimum size is 12px. Hierarchy comes from size, weight and the secondary colour, never from opacity.

## Color

Tokens use YouTube's own neutrals so the UI blends in. They are prefixed `--clip-` so they stay neutral until the name is decided. The in-page UI defines them on `:host` inside the shadow root. The popup defines them on `:root`.

```css
/* Light (default) */
:host, :root {
  color-scheme: light;
  --clip-page: #ffffff;          /* popup background */
  --clip-surface: #f2f2f2;       /* panel and clip bar background (matches YouTube's description box) */
  --clip-field: #ffffff;         /* time input background */
  --clip-tonal: #e5e5e5;         /* secondary button */
  --clip-tonal-hover: #d9d9d9;
  --clip-text: #0f0f0f;
  --clip-text-secondary: #606060;
  --clip-border: #767676;        /* input border, meets 3:1 non-text contrast */
  --clip-primary-bg: #0f0f0f;    /* the "Subscribe"-style primary button */
  --clip-primary-bg-hover: #272727;
  --clip-primary-text: #ffffff;
  --clip-accent: #065fd4;        /* YouTube's link blue */
  --clip-accent-subtle: #def1ff;
  --clip-error: #cc0000;
}

/* Dark: in-page uses :host([data-theme="dark"]), popup uses @media (prefers-color-scheme: dark) { :root { … } } */
{
  color-scheme: dark;
  --clip-page: #0f0f0f;
  --clip-surface: #272727;
  --clip-field: #0f0f0f;
  --clip-tonal: #3f3f3f;
  --clip-tonal-hover: #4d4d4d;
  --clip-text: #f1f1f1;
  --clip-text-secondary: #aaaaaa;
  --clip-border: #717171;
  --clip-primary-bg: #f1f1f1;
  --clip-primary-bg-hover: #d9d9d9;
  --clip-primary-text: #0f0f0f;
  --clip-accent: #3ea6ff;
  --clip-accent-subtle: #263850;
  --clip-error: #ff4e45;
}
```

*Main session:* the clip panel's shadow host always sets `data-theme="dark"`. For the clip bar, Firefox does not support `:host-context()`, so mirror YouTube's `<html dark>` onto its shadow host as `data-theme` before the first render (to avoid a flash) and keep it in sync afterwards. The clip bar's fullscreen variant always forces `data-theme="dark"`.

**The accent (blue) is used only for:** focus rings, the pressed Preview state, and any text links. It is never used for fills on large areas and never for the primary button.

### Contrast (WCAG 2.x ratios, AA: text 4.5:1, non-text 3:1)

| Pair | Light | Dark |
|---|---|---|
| text on page | 19.2 | 17.0 |
| text on surface | 17.1 | 13.2 |
| text on field | 19.2 | 17.0 |
| text on tonal | 15.2 | 9.3 |
| text on tonal-hover | 13.6 | 7.5 |
| text-secondary on page / field | 6.3 | 8.3 |
| text-secondary on surface | 5.6 | 6.4 |
| text-secondary on tonal (disabled primary) | 5.0 | 4.5 |
| primary-text on primary-bg | 19.2 | 17.0 |
| primary-text on primary-bg-hover | 14.9 | 13.6 |
| accent on page | 5.8 | 7.4 |
| accent on surface | 5.2 | 5.8 |
| accent on accent-subtle (pressed Preview) | 5.0 | 4.6 |
| error on page / field | 5.9 | 5.9 |
| error on surface | 5.3 | 4.6 |
| border vs field (non-text) | 4.5 | 3.9 |
| border vs surface (non-text) | 4.1 | 3.1 |
| focus ring (accent) vs surface (non-text) | 5.2 | 5.8 |
| progress fill (text) vs track (tonal) / vs surface (non-text) | 15.2 / 17.1 | 9.3 / 13.2 |

The dark pairs at 4.5 to 4.6 pass with little margin. Don't lighten those backgrounds or darken those texts without re-checking. The clip button's `#eee` icon relies on YouTube's dark translucent control pill (older players: the bottom gradient), the same as the native buttons. Its tooltip has no box and relies on the native `text-shadow: 0 0 2px #000` over video. This is an accepted exception to the text/background rule, for parity with YouTube's own tooltip.

## Spacing, radius, elevation

- Spacing scale: `4, 8, 12, 16, 24px`. Inside a group: 8. Between rows (including the stacked Start and End groups): 12. Panel padding: 16. Between a field and its error message: 4.
- Pill buttons: horizontal padding `0 16px`.
- Control height: `36px` for buttons, inputs and icon buttons (touch target ≥ 24px, so it meets 2.5.8).
- Radius: panel and clip bar (docked and fullscreen) `12px`. Inputs `8px`. Buttons are pills, `18px`. Icon buttons are circles, `50%`.
- Elevation: **none**. The panel overlay and the clip bar's fullscreen variant are opaque `--clip-surface`, with no shadow and no blur. The docked clip bar is flat, like the description box.

## Components

Shared states for every button and input:
- **focus-visible:** `outline: 2px solid var(--clip-accent); outline-offset: 2px`.
- **Hover:** changes the background token instantly (see Motion).
- **Disabled:** loses its fill or changes to secondary text. It is never faded with opacity. `cursor: default`. Uses `aria-disabled` or `disabled`.

### Icons
- UI icons (panel, clip bar, popup) are simple line icons drawn for the project: 24×24 grid, `fill="none"`, `stroke="currentColor"`, stroke width 2, round caps and joins, `aria-hidden="true"`. They take the text colour of their control, including pressed and disabled.
- Sizes: `20px` in pill buttons (8px gap to the label, centred with the label), `16px` in notes (1px top offset so it centres on the 18px line), `24px` in the close icon button.
- Set: close (X), loop (Preview), link (Copy link), code `< >` (Copy embed link, as in YouTube's Share → Embed), check (Copied, Saved), info (embed note, saving note), download (Save video) `M12 4v11M7 10l5 5 5-5M5 20h14` (same 4–20 footprint as the range glyph), stop (Stop saving) `M8 6h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z` (a 12px rounded square, same 6–18 footprint as close, so it can't be read as the panel's close). The clip bar's Replay icon, still to draw, must be a single circular arrow so it can't be confused with loop.
- Exception: the range glyph `[ ▶ ]` stays filled everywhere it appears (clip button, clip bar's 20px range icon, extension icon). It is the product mark and a player control, drawn like YouTube's player icons.
- Why stroke fits: the player's current icons read as ~2px line icons (outline by default, filled when active), and the panel is an opaque block read with its own text, not next to the control bar.

### Clip button
- Markup: `<button class="ytp-button clip-ext-button" aria-label="Clip" aria-expanded="false">`. No `title` attribute (it would add a second, browser tooltip).
- Icon: a play triangle centred between two range brackets `[ ▶ ]`. 24×24 SVG, `fill="currentColor"`, path `M4 4h4v2H6v12h2v2H4zM20 4h-4v2h2v12h-2v2h4zM10 8l6 4-6 4z`. No drop-shadow `<use>`; current native icons have none.
- Default: colour inherited from `.ytp-button` (`#eee`). Hover: YouTube's native control hover. Focus-visible: inherits YouTube's `.ytp-button` focus ring. Don't restyle any of it.
- Tooltip: YouTube's `.ytp-tooltip` doesn't attach to injected buttons, so we render our own that matches it: plain text, no background box, `#eee`, `13px / 15px`, weight 500, `text-shadow: 0 0 2px #000`, font `"YouTube Noto", Roboto, Arial, sans-serif`. Centred on the button, about 20px above its top edge, clamped inside the player, `z-index: 1003`. Shows on hover and on keyboard focus.
- Active (panel open): `aria-expanded="true"`, and the icon swaps to a filled variant (YouTube's outline → filled convention, as on Like). Still `currentColor`, no underline, no red. Same 24×24 grid and 4–20 footprint: a rounded box with the triangle cut out, `fill-rule="evenodd"`, path `M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM10 8l6 4-6 4z`.
- Disabled: not shown. Remove the button rather than showing a dead control (for example on a video that isn't ready yet).

### Clip panel
- Region named by its heading (`aria-labelledby`). Background `--clip-surface`, radius 12, padding 16. All wording (heading, labels, accessible names) comes from CONTENT.md.
- Header: the heading (panel title style), then the duration readout "0:22" in secondary text, then a close icon button (36px circle, transparent, hover `--clip-tonal`, 24px close icon in `--clip-text`, accessible name from CONTENT.md).

### Time input + "Use current time"
- Label above the field ("Start" or "End", field label style). The field is `104px` wide and 36px high, with `--clip-field` background, 1px `--clip-border`, radius 8 and padding `0 12px`. It accepts `m:ss` or `h:mm:ss`. Placeholder "0:00" in `--clip-text-secondary`.
- To its right, 8px gap: a tonal pill "Use current time". Its accessible name starts with the visible label and adds the field (WCAG 2.5.3); wording in CONTENT.md.
- Hover: field border changes to `--clip-text`. Focus-visible: the accent outline.
- Locked (while saving): `readonly`, still focusable and readable. `--clip-surface` background, 1px `--clip-tonal-hover` border, text stays `--clip-text`, no hover change. "Use current time" uses the tonal disabled style with `aria-disabled`.
- Error (unparseable, end ≤ start, or past the video length): 2px `--clip-error` border (use `box-shadow: inset 0 0 0 1px` on top of the 1px border so the layout doesn't shift), `aria-invalid="true"`, and a 12px error message below in `--clip-error` linked by `aria-describedby`. Example: "End must be after start." Wording goes in CONTENT.md. The message takes 4px + 18px and pushes content below it down. No space is reserved; errors show only after the field is left.
- Disabled: not used (see Locked).

### Preview toggle
- Tonal pill with a loop icon plus "Preview", `aria-pressed`.
- Pressed (looping): `--clip-accent-subtle` background, `--clip-accent` text and icon, label "Stop preview".
- Hover (unpressed): `--clip-tonal-hover`.
- Disabled (range invalid, or while saving): `--clip-surface` background, 1px `--clip-tonal-hover` border, `--clip-text-secondary` text. Starting a save ends a running preview.

### Copy buttons
- **Copy link** is primary: `--clip-primary-bg` and `--clip-primary-text`, with hover `--clip-primary-bg-hover`. **Copy embed link** is tonal. Default icons: link (Copy link), code (Copy embed link).
- Copied: the label and icon change in place to a check icon plus "Copied" for 2s, then revert. Full-width buttons keep their width, so nothing jumps. A polite live region announces "Link copied".
- Error (clipboard refused): the label changes to "Couldn't copy" for 2s in the same button colours, keeping the button's default icon. A read-only manual link field appears (placement in Layout) and is announced politely. It gets focus with its text selected, and stays until a copy succeeds or the times change.
- Manual link field: label above in the field label style, 8px gap (as Start/End). The field is full width, and height, background, border, radius, padding, hover and focus match the time input.
- Disabled (range invalid): primary uses `--clip-tonal` background with `--clip-text-secondary` text. Tonal uses the Preview disabled style.
- While saving: both stay enabled. The range is locked, so the links stay valid, and copying doesn't touch playback.

### Save video
One button that changes in place (like Preview and the copy buttons), so focus never has to move. Everything below it is part of the group.

| State | Button | Below the button |
|---|---|---|
| Idle | Tonal, download icon + "Save video" | 8px: quality note |
| Unavailable (range invalid) | Preview disabled style, `aria-disabled`, still focusable | 8px: quality note |
| Saving | Tonal, stop icon + "Stop saving" | 8px: progress bar. 8px: progress line "Saving 0:03 / 0:07". 4px: saving note. The quality note is replaced |
| Saved (2s) | Check icon + "Saved", same colours, then back to Idle | 8px: quality note (the browser shows its own download) |
| Failed | Back to Idle immediately, so retry is one press | 4px: error line (field error style, `--clip-error`), linked by `aria-describedby`. 8px: quality note |

- Quality note: the recording follows the quality selected in YouTube's player, and on "Auto" the resolution can change mid-save. One static note in the embed-note style (16px info icon, 12px secondary text), linked to the button with `aria-describedby`, so it's read before pressing. It's a hint, not a warning: no colour, never an error. If the main session can tell that the player is on Auto without YouTube internals, show the note only then. Otherwise always show it. The saving note uses the same style.
- Progress bar: full width, `4px` high, radius `2px`, track `--clip-tonal`, fill `--clip-text`. Fill uses `transform: scaleX(elapsed / length)` from the left, updated on `timeupdate`, no transition. `aria-hidden="true"`: the text line carries the value. Times are clip-relative (0:00 to the clip length), `m:ss` as elsewhere.
- Saving locks the Start/End fields and "Use current time" (see Locked), and disables Preview. Copy buttons, Close and the header stay as they are. The Stop saving button gets `aria-describedby` on the saving note.
- Stop saving: discards the recording (no partial file), pauses the video where it is, removes the progress block, and restores Idle and the fields. Focus stays on the button.
- Finished: the video pauses at the clip's end (as in clip playback), the file downloads, the button shows Saved. Focus stays on the button.
- Failed reasons (wording in CONTENT.md): protected (DRM) video, an ad started, the video was paused, the video was skipped (seeked), the browser can't record, and a generic fallback. Check the protected and can't-record cases before playback starts, so those fail instantly without seeking. The error stays until the next Save press, a change to the times, or the panel closing. The ad case appears when the panel returns after the ad (it's hidden during ads).
- Closing stops saving: Close, `Esc`, the clip button, the popup's "Close clip panel" and moving to another video all stop and discard, with no confirmation, and focus returns to the clip button as usual. Saving never traps `Esc`. The saving note tells the user this before it can happen.
- Announcements go through the panel's existing polite status region, never per second: once at start (with the clip length), every 30s of recorded time for longer clips, then once on Saved, stop or failure (the error text itself). Clips under 30s get only the start and end messages.
- Dark-only surface, so no light-theme variant is needed. Motion: none; the progress block and error line appear and disappear instantly.

### Embed-link warning
- A static note, not a banner. It has an info icon (16px, `--clip-text-secondary`) and 12px secondary text, and is linked to Copy embed link with `aria-describedby`. The meaning is that embed links work without the extension but fail on videos that block embedding. Final wording goes in CONTENT.md.

### Popup states
| State | Content |
|---|---|
| YouTube watch page, panel closed | Body "Clip a section of this video." Full-width primary button "Open clip panel". |
| YouTube watch page, panel open | Full-width tonal button "Close clip panel". |
| Any other page (non-YouTube, YouTube home or search, and for now Shorts) | Secondary body text "Open a YouTube video to clip it." No button. |
| Page not reachable (tab opened before install, or the content script is missing) | Body "Reload this tab to use the extension." Tonal button "Reload tab". |

Live streams count as watch pages until the Shorts/live TODO is decided, so the popup agrees with the in-player button.
Button states follow the shared rules. Focus goes to the button (if there is one) when the popup opens.

### Clip playback bar
- `--clip-surface`, radius 12, height 48px (auto when wrapped), padding `6px 6px 6px 16px`, `role="status"`.
- Left side: a 20px range icon, then "Clip · 1:23 – 1:45" (range style), then "0:22" in secondary text.
- Right side: a tonal "Replay" button with a replay icon, then a tonal "Watch full video" button, which leaves clip mode and removes the bar.
- Ended (paused at END): the text changes to "Clip ended". Replay changes to the primary style. A polite announcement is made. Focus is **not** moved.
- Hover, focus-visible and active follow the shared rules. The bar has no disabled state.
- **TODO (owner)**: optionally mark the clip range on YouTube's progress bar (a 3px `--clip-accent` segment). It helps orientation but touches YouTube's DOM. Recommendation: skip it for v1.

## Motion

- Panel open: `opacity 0→1` plus `translateY(4px→0)`, `150ms cubic-bezier(0.2, 0, 0, 1)`. Close: `100ms` opacity only. The clip bar uses the same open motion.
- Everything else is instant: hover, pressed, the copied/error label swap, and theme changes. **No `transition` on colour or background properties**, so a theme swap can never animate.
- `prefers-reduced-motion: reduce`: no transforms and no fades. Everything appears and disappears instantly.
- Preview looping is video playback, not UI motion. Nothing in the UI pulses or animates while it runs.

## Imagery

### Extension icon (to design)
- Glyph: the same `[ ▶ ]` range mark as the clip button. It must not use YouTube's red rounded-rectangle play logo or scissors, and must not suggest it is an official YouTube product.
- Needed: an SVG master, toolbar 16 and 32px, and add-on 48, 96 and 128px (for the AMO listing).
- Toolbar: a single-colour glyph with light and dark variants (Firefox `theme_icons`), readable at 16px. Test it on light, dark and system toolbar themes.
- Add-on icon: the glyph on a neutral `#0f0f0f` rounded tile.
- **TODO (owner)**: the final colour and whether the tile keeps the glyph alone. This depends on the final name, which is still open. Note that "YouTube" in the name may conflict with AMO naming policy and with YouTube's own "Clips" feature.

### Screenshots (README and AMO)
- Three shots: clip panel (always dark), clip playback bar (dark theme), popup (either theme). 1280×800, browser content only, with no bookmarks bar and no other tabs visible.
- Use a clean Firefox profile, signed out of YouTube. No avatar, history, subscriptions, notifications or personalised recommendations visible. Crop or blur recommendations if needed.
- **TODO (owner)**: choose the demo video. It should be one you have the right to show (your own upload, Creative Commons or public domain).
- The owner approves every screenshot before it is committed.
