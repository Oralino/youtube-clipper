# DESIGN.md

Visual source of truth, maintained by design-advisor. **Status: Approved by the owner (2026-09-24).** Open TODO (owner) items below are tracked in `TASKS.md`.
*Revised 2026-09-24:* the clip button sections (Layout, Components, its contrast note) were updated to match YouTube's current player (`ytp-delhi-modern-icons`), the open state is now a filled icon instead of a red underline (owner decision; `--clip-active-bar` removed, no red anywhere), Popup states treats live streams as watch pages, and the fullscreen panel overlay is always dark (owner decision; TODO resolved).
*Revised 2026-09-24 (clip panel review):* panel wording (heading, region name, close button name) now defers to CONTENT.md; the container-query line explains the 528px CSS value; the overlay records `z-index: 70` (to verify); Motion notes the replay on placement change; the time-input error documents its layout push and 4px gap; "Use current time" accessible names follow WCAG 2.5.3; added the clip-length readout type role and pill padding.

## Constraints (decided)

- Plain CSS with custom properties, React 19 + TypeScript. No Tailwind, no UI library.
- Feel: quick, unobtrusive, native, as if YouTube had built it. Match YouTube's control sizing, spacing and type. No web fonts loaded into youtube.com.
- Themes (D11): the in-page button, panel and clip bar follow YouTube's `dark` attribute on `<html>`. The popup follows `prefers-color-scheme`. No flash on load. Theme swaps are instant.
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

A YouTube control, not an app. The panel looks like YouTube's own description box: a flat grey rounded block in the page flow, with Roboto, pill buttons and the black/white "Subscribe" style for the one primary action. Numbers (times) are the content, so they get tabular figures and the clearest type. Silent when idle, with one small button in the player. It shows feedback only where the user is looking: the label on the button they just pressed.

## Layout

### Clip button (in the player)
- Visually the **first item of the right controls**, so it doesn't move the settings, theater and fullscreen buttons people are used to. Current player: first child of `.ytp-right-controls-left` (the pill with expand, autoplay, CC, settings), so it sits inside that group's dark translucent pill. Older players with a flat `.ytp-right-controls`: its first child.
- Takes its size from YouTube's `.ytp-button` class rather than hard-coded px (about 48×40 today, 32×32 at the smallest widths), so it scales with the native buttons. `.ytp-button` clips overflow, so nothing may draw outside the button box.
- No `data-priority`, so like settings it stays visible in narrow players when YouTube collapses prioritised buttons behind its expand button.
- Shown on every `/watch` page, including live streams for now (live detection is unverified). Hidden elsewhere. **TODO (owner)**: decide on Shorts and live streams; hiding it on live stays part of that TODO.

### Clip panel
One component with two placements.

| Player mode | Placement | Width | Theme |
|---|---|---|---|
| Default | Docked in the page flow, **directly below the player and above the video title**, `margin-top: 12px` | Full width of the primary column | YouTube theme |
| Theater | Same slot, below the full-width player, in the primary column | Primary column width | YouTube theme |
| Fullscreen | Overlay inside the player, anchored `right: 12px; bottom: 72px` (clears the progress bar and controls), `z-index: 70` (to verify in the owner's fullscreen check: the settings menu and the progress-bar thumbnail open above it, and `bottom: 72px` clears the enlarged scrubber) | `360px`, `max-height: calc(100% - 96px)`, scrolls inside | Dark tokens always |

Why it docks: the video stays fully visible and scrubbable while times are set, and it keeps working at any window width because it sits in the page flow. Fullscreen hides the page, so there it has to overlay the player.
The fullscreen overlay always uses dark tokens, even when YouTube is in light mode, to match YouTube's in-player menus (owner decision, 2026-09-24).
*Main session:* this means moving or re-mounting the shadow host on `fullscreenchange`. The mechanism is your call.

Internal layout uses a container query on the panel's own width, not the viewport. The 560px breakpoint is the panel's width; the CSS uses `@container (min-width: 528px)` because container queries measure the content box (560 − 2 × 16px padding).
- **≥ 560px (wide):**
  - Row 1: header (panel title, duration readout, close button on the right).
  - Row 2: Start group, then End group (`gap: 24px`).
  - Row 3: Preview toggle on the left. Copy embed link, then Copy link, on the right (primary action last, as in YouTube dialogs).
  - Row 4: embed note, full width.
- **< 560px (narrow):** everything stacks in a single column. Each time group stays on one row (field plus "Use current time"). The Preview and copy buttons become full width in the order Preview, Copy link, Copy embed link. The note sits below Copy embed link.
- Padding `16px`. Row gap `12px`.

Focus order: Close → Start → Use current time (start) → End → Use current time (end) → Preview → Copy embed link → Copy link. When the panel opens, focus goes to Start. `Esc` closes the panel and returns focus to the clip button.
*Main session:* keydown events inside the panel must not reach YouTube's shortcuts. Otherwise typing "1:23" seeks the video, because number keys jump to 10%, 20% and so on.

### Toolbar popup
- Fixed `width: 320px`, height fits the content, padding `16px`, no internal scrolling.
- Header row: 16px extension icon + extension name. Below it: one line of body text and at most one action.

### Clip playback bar
- Same docked slot as the panel (below the player, above the title), full width of the primary column. If the panel is also open, the bar sits above it with `8px` between them.
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

*Main session:* Firefox does not support `:host-context()`, so mirror YouTube's `<html dark>` onto the shadow host as `data-theme` before the first render (to avoid a flash) and keep it in sync afterwards. The fullscreen overlay always forces `data-theme="dark"`.

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

The dark pairs at 4.5 to 4.6 pass with little margin. Don't lighten those backgrounds or darken those texts without re-checking. The clip button's `#eee` icon relies on YouTube's dark translucent control pill (older players: the bottom gradient), the same as the native buttons. Its tooltip has no box and relies on the native `text-shadow: 0 0 2px #000` over video. This is an accepted exception to the text/background rule, for parity with YouTube's own tooltip.

## Spacing, radius, elevation

- Spacing scale: `4, 8, 12, 16, 24px`. Inside a group: 8. Between rows: 12. Panel padding: 16. Between the Start and End groups: 24. Between a field and its error message: 4.
- Pill buttons: horizontal padding `0 16px`.
- Control height: `36px` for buttons, inputs and icon buttons (touch target ≥ 24px, so it meets 2.5.8).
- Radius: panel, clip bar and fullscreen overlay `12px` (as YouTube's description box). Inputs `8px`. Buttons are pills, `18px`. Icon buttons are circles, `50%`.
- Elevation: **none**. The docked panel and bar are flat, like the description box. The fullscreen overlay is opaque `--clip-surface`, with no shadow and no blur.

## Components

Shared states for every button and input:
- **focus-visible:** `outline: 2px solid var(--clip-accent); outline-offset: 2px`.
- **Hover:** changes the background token instantly (see Motion).
- **Disabled:** loses its fill or changes to secondary text. It is never faded with opacity. `cursor: default`. Uses `aria-disabled` or `disabled`.

### Clip button
- Markup: `<button class="ytp-button clip-ext-button" aria-label="Clip" aria-expanded="false">`. No `title` attribute (it would add a second, browser tooltip).
- Icon: a play triangle centred between two range brackets `[ ▶ ]`. 24×24 SVG, `fill="currentColor"`, path `M4 4h4v2H6v12h2v2H4zM20 4h-4v2h2v12h-2v2h4zM10 8l6 4-6 4z`. No drop-shadow `<use>`; current native icons have none.
- Default: colour inherited from `.ytp-button` (`#eee`). Hover: YouTube's native control hover. Focus-visible: inherits YouTube's `.ytp-button` focus ring. Don't restyle any of it.
- Tooltip: YouTube's `.ytp-tooltip` doesn't attach to injected buttons, so we render our own that matches it: plain text, no background box, `#eee`, `13px / 15px`, weight 500, `text-shadow: 0 0 2px #000`, font `"YouTube Noto", Roboto, Arial, sans-serif`. Centred on the button, about 20px above its top edge, clamped inside the player, `z-index: 1003`. Shows on hover and on keyboard focus.
- Active (panel open): `aria-expanded="true"`, and the icon swaps to a filled variant (YouTube's outline → filled convention, as on Like). Still `currentColor`, no underline, no red. Same 24×24 grid and 4–20 footprint: a rounded box with the triangle cut out, `fill-rule="evenodd"`, path `M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM10 8l6 4-6 4z`.
- Disabled: not shown. Remove the button rather than showing a dead control (for example on a video that isn't ready yet).

### Clip panel
- Region named by its heading (`aria-labelledby`). Background `--clip-surface`, radius 12, padding 16. All wording (heading, labels, accessible names) comes from CONTENT.md.
- Header: the heading (panel title style), then the duration readout "0:22" in secondary text, then a close icon button (36px circle, transparent, hover `--clip-tonal`, accessible name from CONTENT.md).

### Time input + "Use current time"
- Label above the field ("Start" or "End", field label style). The field is `104px` wide and 36px high, with `--clip-field` background, 1px `--clip-border`, radius 8 and padding `0 12px`. It accepts `m:ss` or `h:mm:ss`. Placeholder "0:00" in `--clip-text-secondary`.
- To its right, 8px gap: a tonal pill "Use current time". Its accessible name starts with the visible label and adds the field (WCAG 2.5.3); wording in CONTENT.md.
- Hover: field border changes to `--clip-text`. Focus-visible: the accent outline.
- Error (unparseable, end ≤ start, or past the video length): 2px `--clip-error` border (use `box-shadow: inset 0 0 0 1px` on top of the 1px border so the layout doesn't shift), `aria-invalid="true"`, and a 12px error message below in `--clip-error` linked by `aria-describedby`. Example: "End must be after start." Wording goes in CONTENT.md. The message takes 4px + 18px and pushes content below it down. No space is reserved; errors show only after the field is left.
- Disabled: not used.

### Preview toggle
- Tonal pill with a loop icon plus "Preview", `aria-pressed`.
- Pressed (looping): `--clip-accent-subtle` background, `--clip-accent` text and icon, label "Stop preview".
- Hover (unpressed): `--clip-tonal-hover`.
- Disabled (range invalid): `--clip-surface` background, 1px `--clip-tonal-hover` border, `--clip-text-secondary` text.

### Copy buttons
- **Copy link** is primary: `--clip-primary-bg` and `--clip-primary-text`, with hover `--clip-primary-bg-hover`. **Copy embed link** is tonal.
- Copied: the label and icon change in place to a check icon plus "Copied" for 2s, then revert. The button width is fixed with `min-width` so nothing jumps. A polite live region announces "Link copied".
- Error (clipboard refused): the label changes to "Couldn't copy" in the same button colours for 2s, and a read-only field with the URL appears below the buttons, pre-selected, so the user can copy it manually. It is announced politely.
- Disabled (range invalid): primary uses `--clip-tonal` background with `--clip-text-secondary` text. Tonal uses the Preview disabled style.

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
- A placement change (entering or leaving fullscreen) replays the open motion.
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
- Three shots: clip panel (light theme), clip playback bar (dark theme), popup (either theme). 1280×800, browser content only, with no bookmarks bar and no other tabs visible.
- Use a clean Firefox profile, signed out of YouTube. No avatar, history, subscriptions, notifications or personalised recommendations visible. Crop or blur recommendations if needed.
- **TODO (owner)**: choose the demo video. It should be one you have the right to show (your own upload, Creative Commons or public domain).
- The owner approves every screenshot before it is committed.
