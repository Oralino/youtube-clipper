# DESIGN.md

Visual source of truth, maintained by design-advisor. **Status: Approved by the owner (2026-09-24); accessibility-pass changes (Forced colours, Preview toggle, clip-length and error announcements) approved 2026-09-25. The Shorts sections (Layout, Shorts; Components, Shorts clip button) await owner approval.** Open TODO (owner) items below are tracked in `TASKS.md`.

## Constraints (decided)

- Plain CSS with custom properties, React 19 + TypeScript. No Tailwind, no UI library.
- Feel: quick, unobtrusive, native, as if YouTube had built it. Match YouTube's control sizing, spacing and type. No web fonts loaded into youtube.com.
- Themes (D11): the clip panel is always dark (it's an in-player overlay, like YouTube's player menus), whatever YouTube's or the system's theme. The clip button has no theme; it inherits YouTube's player control styling. There is no toolbar popup and no other extension page, so nothing follows `prefers-color-scheme`. No flash on load.
- Accessibility (D10): WCAG AA contrast for every text/background pair, full keyboard use, visible focus, `prefers-reduced-motion` respected, no opacity on text for hierarchy.
- Surfaces must work in the default, theater and fullscreen player modes and in narrow windows.
- Nothing personal in the UI, docs or screenshots.

## Avoid

- Purple/blue gradients, glassmorphism or backdrop blur, emoji icons, glow, and animation on everything.
- Anything that fights YouTube: branded headers or logos inside the panel, custom fonts on youtube.com, heavy or coloured shadows, a new accent colour, a "card floating on the page" look.
- YouTube's red anywhere in our UI. Red means "played" and "live" on YouTube.
- Scissors as our icon. YouTube's native Clip feature uses scissors, and ours must not look like it.
- Opacity or `rgba()` text colours. Every text colour is a solid hex from the tokens.

## Personality / direction

A YouTube control, not an app. The panel looks like YouTube's own in-player menus: a flat, opaque dark rounded block over the video, with Roboto, pill buttons and the black/white "Subscribe" style for the one primary action (Save video). Numbers (times) are the content, so they get tabular figures and the clearest type. Silent when idle, with one small button in the player. It shows feedback only where the user is looking: the label on the button they just pressed.

## Layout

### Clip button (in the player)
- Visually the **first item of the right controls**, so it doesn't move the settings, theater and fullscreen buttons people are used to. Current player: first child of `.ytp-right-controls-left` (the pill with expand, autoplay, CC, settings), so it sits inside that group's dark translucent pill. Older players with a flat `.ytp-right-controls`: its first child.
- Takes its size from YouTube's `.ytp-button` class rather than hard-coded px (about 48×40 today, 32×32 at the smallest widths), so it scales with the native buttons. `.ytp-button` clips overflow, so nothing may draw outside the button box.
- No `data-priority`, so like settings it stays visible in narrow players when YouTube collapses prioritised buttons behind its expand button.
- Shown on every `/watch` page, including live streams (owner decision 2026-09-25: live keeps this button). On Shorts it lives in the action bar instead (see Shorts below). Hidden elsewhere.

### Clip panel
An overlay inside the player in **every player mode** (default, theater and fullscreen), with one placement (owner decision, 2026-09-24).
- Placement: inside `#movie_player`, anchored `right: 12px; bottom: 72px` (clears the progress bar and controls), `z-index: 70` (to verify in the owner's fullscreen check: the settings menu and the progress-bar thumbnail open above it, and `bottom: 72px` clears the enlarged scrubber).
- Size: `width: min(360px, calc(100% - 24px))`, `max-height: calc(100% - 96px)`, scrolls inside. It shrinks to fit small players.
- Theme: dark tokens always, even when YouTube is in light mode.
- While open it covers the bottom-right of the video.
- During ads (`#movie_player.ad-showing`): hidden without losing what was typed, and shown again when the ad ends. This keeps it off "Skip ad" and stops "Use current time" reading the ad's time. Implemented as a `data-ad` attribute on the host with `:host([data-ad]) { display: none !important }`.

Why an overlay: opening and closing it never moves the video or the title, it behaves the same in all three modes, and it appears the way YouTube's own in-player menus do.

Internal layout: a single column (the panel never gets wide enough for more). Each time group is one row (field plus "Use current time"; see the wrap rule below). The File name field is the last group in the fields block, `12px` below the End group (below End's error line when one shows). Keeping all the inputs together puts the actions in one stack below them, puts the field right under the times its placeholder is built from, and keeps everything that locks during saving in one block. Preview is full width, `12px` below the File name field. The Save video group comes last, `12px` below Preview; its button is full width. The two are separate groups because Save video is a different kind of action (slow, makes a file) and carries its own status and note. If a build leaves Save video out (Chrome store, see `TASKS.md`), the group is simply absent.
- Padding `16px`. Row gap `12px`.
- A time row stays on one line while it fits. In the narrowest players (the panel's inner width drops below the field plus the pill, about 252px) the pill wraps under the field: `.time-row { flex-wrap: wrap }`. This is static layout, so it never moves a control under the pointer.

Focus order: Close → Start → Use current time (start) → End → Use current time (end) → File name → Preview → Save video (matches the visual order). When the panel opens, focus goes to Start. `Esc` closes the panel and returns focus to the clip button.
*Main session:* keydown events inside the panel must not reach YouTube's shortcuts. Otherwise typing "1:23" seeks the video, because number keys jump to 10%, 20% and so on.

### Shorts (owner decision 2026-09-25)
Same panel component, same dark tokens, same internal layout, focus order and behaviour. Only the button and two placement numbers differ.
- **Button:** in the Shorts action bar, directly after Share and before Remix (spec under Components, Shorts clip button). No button in the player.
- **Panel placement:** over the video, like watch pages, anchored to the player's bottom-right, so it opens right next to the Clip button in the action bar. It covers the title/channel metadata while open (accepted, as it covers the video on watch pages). Beside the player was rejected: the free space there disappears in narrow windows, and it would be a second placement to maintain.
  - The panel can't live inside `#shorts-player` (YouTube's overlay covers it). The host mounts in `#player-container` (the player's rect) at `z-index: 2`, above `ytd-reel-player-overlay-renderer` (`z-index: 1`), with `pointer-events: none` on that box and `pointer-events: auto` on `.panel`, so the video and YouTube's controls stay clickable around the panel.
  - Numbers: `right: 12px; width: min(360px, calc(100% - 24px))` as on watch pages. `bottom: 24px` (Shorts has no control bar at the bottom, only the thin progress bar on the bottom edge, which must stay reachable for seeking) and `max-height: calc(100% - 88px)` (keeps the top ~64px free for YouTube's play/pause, volume and fullscreen buttons). Set with a host attribute: `:host([data-surface="shorts"]) .panel { bottom: 24px; max-height: calc(100% - 88px); }`. Verify in dev Firefox that the scrubber's hover area fits below 24px; if not, raise `bottom` to clear it.
  - At a ~378px player the panel is 354px wide and fits without scrolling on a 672px-tall player. Shorter windows shrink the player; the panel then scrolls inside, as on watch pages.
  - If YouTube's narrow layout moves the action bar onto the video (verify the width at which it does), the panel must not cover it: in that layout use `right: 72px; width: min(360px, calc(100% - 84px))`, so the Clip button stays visible and pressable.
- **Focus:** opening moves focus to Start; `Esc`, Close and the button return focus to the Shorts Clip button. Scrolling to another Short fires navigation, which closes the panel (and stops saving, as on watch pages); focus is not moved then, because the action bar is being rebuilt.
- **Keys:** the keydown rule above matters more here: Up/Down arrows move to the next Short, so arrows typed in the time or name fields must not reach YouTube.
- **Ads:** Shorts ads are their own entries in the feed. Don't show the Clip button on an ad Short if it's detectable without YouTube internals (verify, for example the ad renderer or the "Sponsored" badge). If `#shorts-player` gets `.ad-showing`, use the same `data-ad` hiding as watch pages.
- *Main session:* the Shorts `<video>` has `loop`, so a clip that ends at the video's end can be looped back to 0:00 before the pause. Treat that jump as the clip's end, not as "the video was skipped".

## Typography

Font stack (no loading): `"Roboto", "Arial", sans-serif` (YouTube's own stack).

Use `font-variant-numeric: tabular-nums` on every time value.

| Role | Size / line height | Weight |
|---|---|---|
| Panel title | 16px / 22px | 500 |
| Field label ("Start", "End", "File name (optional)") | 12px / 16px | 500 |
| Time input value | 14px / 20px | 400, tabular |
| File name value and placeholder | 14px / 20px | 400 (not tabular) |
| Clip-length readout (panel header) | 14px / 20px | 400, tabular, `--clip-text-secondary` |
| Button label | 14px / 20px (36px control height) | 500 |
| Note, helper, error text | 12px / 18px | 400 |
| Save progress ("Saving 0:03 / 0:07", "Converting to MP4 45%") | 12px / 18px | 500, tabular, `--clip-text` |

Minimum size is 12px. Hierarchy comes from size, weight and the secondary colour, never from opacity.

## Color

Tokens use YouTube's own neutrals so the UI blends in. They keep the short `--clip-` prefix (it fits the name, Clipper for YouTube) and are defined on `:host` inside the shadow root.

**Only the dark set is in use.** With the popup gone, no surface renders the light set: the panel is always dark and the clip button inherits YouTube's styling. `--clip-page` (the popup background) is also unused in both sets; the time field uses `--clip-field`. *Main session:* confirm nothing in the build reads the light values or `--clip-page`. If so, the light block, `--clip-page`, the `data-theme` switch and the table's Light column can go; say the word and design-advisor will collapse this section to one set.

```css
/* Light: UNUSED since the popup was removed (2026-09-24) */
:host {
  color-scheme: light;
  --clip-page: #ffffff;          /* unused (was the popup background) */
  --clip-surface: #f2f2f2;       /* panel background (matches YouTube's description box) */
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

/* Dark: the only set in use, on :host([data-theme="dark"]) */
:host([data-theme="dark"]) {
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

*Main session:* the clip panel's shadow host always sets `data-theme="dark"`.

**The accent (blue) is used only for:** focus rings and the pressed Preview state. It is never used for fills on large areas and never for the primary button.

### Contrast (WCAG 2.x ratios, AA: text 4.5:1, non-text 3:1)

The Light column and the "on page" rows are kept only until the light set is removed (see above). The Dark column is the one that ships.

| Pair | Light | Dark |
|---|---|---|
| text on page | 19.2 | 17.0 |
| text on surface | 17.1 | 13.2 |
| text on field | 19.2 | 17.0 |
| text on tonal | 15.2 | 9.3 |
| text on tonal-hover | 13.6 | 7.5 |
| text-secondary on page / field | 6.3 | 8.3 |
| text-secondary on surface (notes, disabled buttons) | 5.6 | 6.4 |
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

The dark pairs at 4.6 pass with little margin. Don't lighten those backgrounds or darken those texts without re-checking. The clip button's `#eee` icon relies on YouTube's dark translucent control pill (older players: the bottom gradient), the same as the native buttons. Its tooltip has no box and relies on the native `text-shadow: 0 0 2px #000` over video. This is an accepted exception to the text/background rule, for parity with YouTube's own tooltip.

## Spacing, radius, elevation

- Spacing scale: `4, 8, 12, 16, 24px`. Inside a group: 8. Between rows (including the stacked Start and End groups): 12. Panel padding: 16. Between a field and its error message: 4.
- Pill buttons: horizontal padding `0 16px`.
- Control height: `36px` for buttons, inputs and icon buttons (touch target ≥ 24px, so it meets 2.5.8).
- Radius: panel `12px`. Inputs `8px`. Buttons are pills, `18px`. Icon buttons are circles, `50%`.
- Elevation: **none**. The panel overlay is opaque `--clip-surface`, with no shadow and no blur.

## Components

Shared states for every button and input:
- **focus-visible:** `outline: 2px solid var(--clip-accent); outline-offset: 2px`.
- **Hover:** changes the background token instantly (see Motion).
- **Disabled:** loses its fill and changes to secondary text. It is never faded with opacity. `cursor: default`. Uses `aria-disabled` or `disabled`. One disabled look for every button, tonal or primary: `--clip-surface` background, 1px `--clip-tonal-hover` border, `--clip-text-secondary` text.

### Forced colours
Windows High Contrast replaces our colours, and backgrounds carry the button shapes, the pressed and disabled states and the progress fill. A small `@media (forced-colors: active)` block restores them with system colours only; sizes don't change (`box-sizing: border-box`).
- Buttons (tonal, primary, close): `1px solid ButtonText` border. Hover has no forced-colours look (accepted).
- Disabled: `GrayText` text, icon and border.
- Pressed Preview: `Highlight` background, `HighlightText` text and icon. That is the system's own selected/pressed look, it reads as a filled state at a glance, and it can't be confused with the focus outline the way a thicker border could.
- Invalid time field: 2px border (padding 1px less, so the text doesn't move); the error message carries the meaning.
- Locked fields: `GrayText` border.
- Progress: track `1px solid CanvasText` on `Canvas`, fill `CanvasText`.
- Focus: the outline stays; forced colours keep outlines. On the pressed Preview (which opts out below) it uses `CanvasText`, since the accent isn't a system colour.
- `forced-color-adjust: none` only on the pressed Preview and the progress fill, as a guard so their system-colour backgrounds aren't overridden.

### Icons
- UI icons (panel) are simple line icons drawn for the project: 24×24 grid, `fill="none"`, `stroke="currentColor"`, stroke width 2, round caps and joins, `aria-hidden="true"`. They take the text colour of their control, including pressed and disabled.
- Sizes: `20px` in pill buttons (8px gap to the label, centred with the label), `16px` in notes (1px top offset so it centres on the 18px line), `24px` in the close icon button.
- Set: close (X), loop (Preview), check (Saved), info (quality note, saving note), download (Save video) `M12 4v11M7 10l5 5 5-5M5 20h14` (same 4–20 footprint as the range glyph), stop (Stop saving) `M8 6h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z` (a 12px rounded square, same 6–18 footprint as close, so it can't be read as the panel's close).
- Exception: the range glyph `[ ▶ ]` stays filled everywhere it appears (clip button, extension icon). It is the product mark and a player control, drawn like YouTube's player icons.
- Why stroke fits: the player's current icons read as ~2px line icons (outline by default, filled when active), and the panel is an opaque block read with its own text, not next to the control bar.

### Clip button
- Markup: `<button class="ytp-button clip-ext-button" aria-label="Clip" aria-expanded="false">`. No `title` attribute (it would add a second, browser tooltip).
- Icon: a play triangle centred between two range brackets `[ ▶ ]`. 24×24 SVG, `fill="currentColor"`, path `M4 4h4v2H6v12h2v2H4zM20 4h-4v2h2v12h-2v2h4zM10 8l6 4-6 4z`. No drop-shadow `<use>`; current native icons have none.
- Default: colour inherited from `.ytp-button` (`#eee`). Hover: YouTube's native control hover. Focus-visible: inherits YouTube's `.ytp-button` focus ring. Don't restyle any of it.
- Tooltip: YouTube's `.ytp-tooltip` doesn't attach to injected buttons, so we render our own that matches it: plain text, no background box, `#eee`, `13px / 15px`, weight 500, `text-shadow: 0 0 2px #000`, font `"YouTube Noto", Roboto, Arial, sans-serif`. Centred on the button, about 20px above its top edge, clamped inside the player, `z-index: 1003`. Shows on hover and on keyboard focus.
- Active (panel open): `aria-expanded="true"`, and the icon swaps to a filled variant (YouTube's outline → filled convention, as on Like). Still `currentColor`, no underline, no red. Same 24×24 grid and 4–20 footprint: a rounded box with the triangle cut out, `fill-rule="evenodd"`, path `M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM10 8l6 4-6 4z`.
- Disabled: not shown. Remove the button rather than showing a dead control (for example on a video that isn't ready yet).

### Shorts clip button
Looks like one of YouTube's own action-bar items (Like, Share, Remix): a 48px tonal circle with the icon, and the visible label "Clip" under it (wording from CONTENT.md). Lives in the page DOM, so every class has the `clip-ext-` prefix and every size is px.
- Position: a new item directly after Share and before Remix, inside `reel-action-bar-view-model`. Spacing matches YouTube's items: `padding-bottom: 8px` on the item, and `margin-top: 0` (YouTube gives every child of the bar a 16px top margin and resets it only for its own items; verified 2026-09-25). Re-insert it whenever YouTube rebuilds the bar (next Short).
- Markup (mirrors YouTube's `label > button + div`, so clicking the label text also presses the button):
  ```html
  <div class="clip-ext-shorts-item">
    <label class="clip-ext-shorts-action">
      <button type="button" class="clip-ext-shorts-button" aria-label="Clip" aria-expanded="false">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">…</svg>
      </button>
      <div class="clip-ext-shorts-label" aria-hidden="true">Clip</div>
    </label>
  </div>
  ```
  The accessible name equals the visible label (WCAG 2.5.3); the label div is `aria-hidden` so it isn't read twice. No `title`, no tooltip (the label is visible, as on YouTube's items).
- Icon: the same filled `[ ▶ ]` paths as the player button, closed and open variants, swapped with `aria-expanded` (see Clip button).
- Theme: follows YouTube's site theme with our own values: light by default, dark under `html[dark]` (YouTube's dark-theme attribute). YouTube's own properties are hashed per build, so we can't reuse them.

  ```css
  .clip-ext-shorts-item {
    --clip-ext-shorts-bg: rgba(0, 0, 0, 0.05);
    --clip-ext-shorts-bg-hover: rgba(0, 0, 0, 0.1);
    --clip-ext-shorts-text: #0f0f0f;
    padding-bottom: 8px; /* YouTube spaces bar items this way */
  }
  html[dark] .clip-ext-shorts-item {
    --clip-ext-shorts-bg: rgba(255, 255, 255, 0.1);
    --clip-ext-shorts-bg-hover: rgba(255, 255, 255, 0.2);
    --clip-ext-shorts-text: #f1f1f1;
  }
  .clip-ext-shorts-action {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 48px;
    cursor: pointer;
  }
  .clip-ext-shorts-button {
    display: grid;
    place-items: center;
    box-sizing: border-box;
    width: 48px;
    height: 48px;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: var(--clip-ext-shorts-bg);
    color: var(--clip-ext-shorts-text);
    cursor: pointer;
  }
  .clip-ext-shorts-button:hover {
    background: var(--clip-ext-shorts-bg-hover);
  }
  .clip-ext-shorts-button:focus-visible {
    outline: 2px solid var(--clip-ext-shorts-text);
    outline-offset: 2px;
  }
  .clip-ext-shorts-label {
    margin-top: 4px;
    color: var(--clip-ext-shorts-text);
    font-family: "Roboto", "Arial", sans-serif;
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
    text-align: center;
  }
  @media (forced-colors: active) {
    .clip-ext-shorts-button { border: 1px solid ButtonText; }
  }
  ```
- The dark values match YouTube's Share button. The translucent backgrounds are fills, not text, so the no-`rgba()`-text rule holds.
- Contrast (effective colours on the page): dark: label `#f1f1f1` on `#0f0f0f` 17.0, icon on the circle (≈`#272727`) 13.2, on hover (≈`#3f3f3f`) 9.3; light: label `#0f0f0f` on `#ffffff` 19.2, icon on ≈`#f2f2f2` 17.1, on hover ≈`#e6e6e6` 15.2. The focus ring uses the text colour (17.0 / 19.2 against the page), not our accent, because `#3ea6ff` is only 2.6:1 on YouTube's light page. The circle itself is faint against the page in both themes, exactly like YouTube's items; the icon and label carry the meaning.
- Active (panel open): `aria-expanded="true"` and the filled icon. No colour change, no red, no pressed background.
- Motion: none (hover is instant).
- Disabled: not shown, as for the player button.

### Clip panel
- Region named by its heading (`aria-labelledby`). Background `--clip-surface`, radius 12, padding 16. All wording (heading, labels, accessible names) comes from CONTENT.md.
- Header: the heading (panel title style), then the duration readout "0:22" in secondary text (with a visually hidden prefix so screen readers hear "Clip length 0:22"; wording in CONTENT.md, no visual change), then a close icon button (36px circle, transparent, hover `--clip-tonal`, 24px close icon in `--clip-text`, accessible name from CONTENT.md).

### Time input + "Use current time"
- Label above the field ("Start" or "End", field label style). The field is `104px` wide and 36px high, with `--clip-field` background, 1px `--clip-border`, radius 8 and padding `0 12px`. It accepts `m:ss` or `h:mm:ss`. Placeholder "0:00" in `--clip-text-secondary`.
- To its right, 8px gap: a tonal pill "Use current time". Its accessible name starts with the visible label and adds the field (WCAG 2.5.3); wording in CONTENT.md.
- Hover: field border changes to `--clip-text`. Focus-visible: the accent outline.
- Locked (while saving): `readonly`, still focusable and readable. `--clip-surface` background, 1px `--clip-tonal-hover` border, text stays `--clip-text`, no hover change. "Use current time" uses the shared disabled style with `aria-disabled`. Styled with `.time-input:read-only`. It never needs to combine with Error, because saving needs a valid range.
- Error (unparseable, end ≤ start, or past the video length): 2px `--clip-error` border (use `box-shadow: inset 0 0 0 1px` on top of the 1px border so the layout doesn't shift), `aria-invalid="true"`, and a 12px error message below in `--clip-error` linked by `aria-describedby`. Example: "End must be after start." Wording goes in CONTENT.md. The message takes 4px + 18px. Because the panel is anchored to the bottom, it pushes the content above it up (accepted: errors show only after the field is left, so the shift never happens under the user's typing). No space is reserved. When an error appears on leaving the field or after "Use current time", it is also announced once through the panel's polite status region (focus has already moved, so it would otherwise go unheard). Leaving or filling Start also announces the "End must be after start" it puts on End, if End has been left before. Never while typing.
- Disabled: not used (see Locked).

### File name field
- Optional text field that names the saved file. The label above it uses the field label style, and the wording comes from CONTENT.md. The label says "optional", so there is **no hint line**. The placeholder shows the automatic name, and adding ".mp4" or cleaning out characters is unsurprising enough to stay silent.
- Field: **full width** (`width: 100%`). Otherwise identical to the time input: 36px high, `--clip-field` background, 1px `--clip-border`, radius 8, padding `0 12px`, and the same hover, focus-visible and Locked (`:read-only`) styles. Not tabular. `autocomplete="off"`, `spellcheck="false"`, no `inputmode`.
- Placeholder: the automatic name without ".mp4" (for example "Me at the zoo (0.05-0.12)"), or only the video title until the range is valid. Colour `--clip-text-secondary` (8.3:1 on the field, 6.4:1 on the locked surface). A long placeholder, or a long value when the field isn't focused, ends in an ellipsis (`text-overflow: ellipsis` on the input and on `::placeholder`). The screen reader gets the placeholder as the field's description, so no extra `aria-describedby` is needed.
- `maxLength={80}`, matching the main session's cap, so what the field shows is what the file gets (a silent cut at save time would break that). The input's count includes a typed ".mp4", which is fine. The main session's cap must count the same way (UTF-16 code units, as `maxLength` does).
- No error state. Characters Windows doesn't allow are removed at save time. A name with nothing left after cleaning gets the automatic name.
- `Enter` does nothing (it must not start a save).
- Locked while Saving and Converting, like the time fields. It keeps its value when the times change and clears when the panel closes.

### Preview toggle
- Stays **tonal**: it's the check before the main action, so it sits one step below Save video. Loop icon plus "Preview".
- A plain button, **not** `aria-pressed`: its label states the action and changes with the state, so the name alone tells the state (a changing name plus "pressed" reads badly, and a fixed name would break WCAG 2.5.3).
- Pressed (looping): `data-active` on the button, `--clip-accent-subtle` background, `--clip-accent` text and icon, label "Stop preview".
- Hover (unpressed): `--clip-tonal-hover`. No hover change while pressed.
- Disabled (range invalid, or while saving): the shared disabled style. Starting a save ends a running preview.

### Save video
The panel's **primary** action (Subscribe style). One button that changes in place (like Preview), so focus never has to move. Status (progress or error) goes **above** the button and notes go below it, so the button itself never moves: the panel is anchored to the bottom and grows upwards, so anything added below the button would push it up under the pointer. The saving, converting and quality notes must take the same height for this to hold: `.save > .note { min-height: 36px }` reserves 2 lines, and none of the three may wrap to 3 at the narrowest panel (keep them short in CONTENT.md).

| State | Above the button (group starts 12px below Preview) | Button | Below the button |
|---|---|---|---|
| Idle | nothing | **Primary**: `--clip-primary-bg`, `--clip-primary-text`, hover `--clip-primary-bg-hover`. Download icon + "Save video" | 8px: quality note |
| Unavailable (range invalid) | nothing | Shared disabled style, `aria-disabled`, still focusable, no hover change | 8px: quality note |
| Saving | Progress line "Saving 0:03 / 0:07", 8px, progress bar, 8px | **Tonal**: stop icon + "Stop saving", hover `--clip-tonal-hover` | 8px: saving note (replaces the quality note) |
| Converting (Firefox only, after Saving) | Progress line "Converting to MP4 45%", 8px, the same bar (restarts at 0, fills with conversion progress), 8px | Unchanged from Saving: tonal "Stop saving" (now cancels the conversion; no file) | 8px: converting note (replaces the saving note) |
| Saved (2s) | nothing | Primary, check icon + "Saved", then back to Idle | 8px: quality note (the browser shows its own download) |
| Failed | Error line (field error style, `--clip-error`, linked by `aria-describedby`), 8px | Back to Idle (primary) immediately, so retry is one press | 8px: quality note |

- Why Stop saving drops to tonal: stopping is a cancel, not the main action. The colour change marks the mode switch under the pointer, keeps the brightest element in the panel from inviting an accidental stop while the clip plays, and keeps the white button away from the white progress fill just above it. Width and height don't change, so nothing moves.
- Quality note: the recording follows the quality selected in YouTube's player, and on "Auto" the resolution can change mid-save. A static note: 16px info icon and 12px / 18px text, both `--clip-text-secondary`, 8px gap. Linked to the button with `aria-describedby`, so it's read before pressing. It's a hint, not a warning: no colour, never an error. If the main session can tell that the player is on Auto without YouTube internals, show the note only then. Otherwise always show it. The saving note uses the same style.
- Progress bar: full width, `4px` high, radius `2px`, track `--clip-tonal`, fill `--clip-text`. Fill uses `transform: scaleX(elapsed / length)` from the left, updated about 4 times a second (throttled; Chrome's `timeupdate` runs at about this rate anyway, so steps look the same in both browsers), no transition. `aria-hidden="true"`: the text line carries the value. Times are clip-relative (0:00 to the clip length), `m:ss` as elsewhere.
- Converting (owner decision, see `REQUIREMENTS.md`): Firefox records WebM, so the finished recording is converted to MP4 in the browser, which takes a few seconds or more. It counts as saving: same button, same locks, same "closing stops it" rule; only the progress line, the bar's meaning and the note change. The video is already paused at the clip's end. The bar updates per whole percent (not throttled to 4 Hz; accepted, it's `aria-hidden` and has no transition). The percentage uses the save-progress role, so tabular figures keep the line from jittering. Chrome records MP4 directly and goes straight from Saving to Saved.
- Saving and Converting lock the Start/End fields, "Use current time" and the File name field (see Locked), and disable Preview. Close and the header stay as they are. The Stop saving button gets `aria-describedby` on the current note (saving or converting).
- Stop saving: discards the recording (no partial file), pauses the video where it is, removes the progress block, and restores Idle and the fields. Focus stays on the button. During Converting it cancels the conversion the same way: no MP4 and no WebM is saved.
- Finished: the video pauses at the clip's end, the file downloads, the button shows Saved. Focus stays on the button.
- Failed reasons (wording in CONTENT.md): protected (DRM) video, an ad started, the video was paused, the video was skipped (seeked), the browser can't record, the MP4 conversion failed, and a generic fallback. The conversion case is the one Failed state where a file does download: the WebM is saved instead, and the error line says so (accepted as an error-coloured line because the user asked for MP4 and didn't get it). Check the protected and can't-record cases before playback starts, so those fail instantly without seeking. The error stays until the next Save press, a change to the times, or the panel closing. The ad case appears when the panel returns after the ad (it's hidden during ads).
- Closing stops saving: Close, `Esc`, the clip button and moving to another video all stop and discard, with no confirmation, and focus returns to the clip button as usual. Saving never traps `Esc`. The saving note tells the user this before it can happen.
- Announcements go through the panel's existing polite status region, never per second or per percent: once at start (with the clip length), every 30s of recorded time for longer clips, once when Converting starts (Firefox, no percentage), then once on Saved, stop or failure (the error text itself). Clips under 30s get only the start, converting (Firefox) and end messages. The progress line and bar are not live. Skip a 30s progress announcement that falls within the last 5s of the clip, so "Converting to MP4" (or "Video saved") doesn't cut it off.
- Dark-only surface, so no light-theme variant is needed. Motion: none; the progress block and error line appear and disappear instantly.

## Motion

- Panel open: `opacity 0→1` plus `translateY(4px→0)`, `150ms cubic-bezier(0.2, 0, 0, 1)`. Close: `100ms` opacity only.
- Everything else is instant: hover, pressed, and the Save video label and style swaps. **No `transition` on colour or background properties.**
- `prefers-reduced-motion: reduce`: no transforms and no fades. Everything appears and disappears instantly.
- Preview looping and saving are video playback, not UI motion. Nothing in the UI pulses or animates while they run.

## Imagery

### Extension icon
For **Clipper for YouTube** (decided 2026-09-24). There is no toolbar button, so the icon only appears in about:addons, Firefox's extensions menu, install and permission prompts, and the AMO listing. No `theme_icons`, no light/dark toolbar variants, no single-colour version.
- Glyph: the clip button's `[ ▶ ]` range mark, glyph only (no letters, no second element). Never YouTube's red, never a red rounded-rectangle play logo, never scissors, nothing that suggests an official YouTube product.
- Colours: tile `#0f0f0f`, glyph `#ffffff` (19.2:1), tile rim `#4d4d4d` (the dark `--clip-tonal-hover`). No gradient, shadow or gloss.
- Rim, and why: `#0f0f0f` against Firefox's dark about:addons page and cards (about `#1c1b22` / `#2b2a33`; verify) is only 1.1 / 1.3:1, so the tile's outline disappears and the glyph floats. The rim is a lighter edge band 1/32 of the tile wide, inside the tile edge. It raises the edge to about 2.0 / 1.7:1 on those backgrounds. That is enough to show the tile's shape. It doesn't need 3:1, because the glyph carries the meaning and is 19.2:1 on any background. On light backgrounds the rim reads as a faint inner edge.
- Tile: full bleed (no transparent padding, so the glyph gets every pixel at 32px). Corner radius 18.75% of the tile side (24 on 128, 6 on 32). The rim's inner corner is concentric (radius minus rim width).
- Two SVG files. The main session rasterises each PNG straight from its SVG at the exact size. Never downscale a larger PNG.

| PNG size | Source | Glyph share of tile | Glyph stroke |
|---|---|---|---|
| 16, 32 | Small variant (32 grid, pixel-snapped) | 75% | 2px at 16, 4px at 32 |
| 48, 96, 128 | Master (128 grid) | 62.5% | 3.75px at 48, 7.5 at 96, 10 at 128 |

**Master** (48, 96, 128): the clip-button glyph scaled ×5 and centred (`X = 5u + 4` from the 24 grid, glyph box 24–104). The triangle's centroid sits on the tile centre, as in the original.

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="24" fill="#4d4d4d"/>
  <rect x="4" y="4" width="120" height="120" rx="20" fill="#0f0f0f"/>
  <path fill="#ffffff" d="M24 24h20v10H34v60h10v10H24zM104 24H84v10h10v60H84v10h20zM54 44l30 20-30 20z"/>
</svg>
```

**Small variant** (16, 32): the same tile and rim on a 32 grid. The glyph is redrawn so every glyph edge falls on an even unit, which is a whole pixel at both 16 and 32. At 16px the master's strokes and gaps would be 1.25px and blur into grey. Here, at 16px: brackets are 2px thick with 2px arm tips, 2px from the bracket to the triangle's flat side, 1px from each arm to the triangle's corner, and 1px from the triangle's tip to the right bracket. The triangle is 5×6px. Compared with the master: the glyph fills more of the tile, the strokes are heavier (1/6 of the glyph width instead of 1/8) and the triangle is slightly squatter (10×12 instead of 6×8 proportions). The rim is 1 unit wide, so at 16px it is half a pixel and renders as a softened edge. That is intended.

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#4d4d4d"/>
  <rect x="1" y="1" width="30" height="30" rx="5" fill="#0f0f0f"/>
  <path fill="#ffffff" d="M4 4h8v4H8v16h4v4H4zM28 4h-8v4h4v16h-4v4h8zM12 10l10 6-10 6z"/>
</svg>
```

- Acceptance check (main session, owner approves): view the 16 and 32 PNGs at 100% on `#ffffff` and on `#1c1b22`. The black gaps between the arms and the triangle must be visible at 16, and the triangle must read as a play symbol, not a blob. The 48 and 96 PNGs are antialiased, not pixel-snapped, which is fine at those sizes.

### Screenshots (README and AMO)
- Two shots: clip panel idle and clip panel while saving (both always dark). 1280×800, browser content only, with no bookmarks bar and no other tabs visible.
- Use a clean Firefox profile, signed out of YouTube. No avatar, history, subscriptions, notifications or personalised recommendations visible. Crop or blur recommendations if needed.
- **TODO (owner)**: choose the demo video. It should be one you have the right to show (your own upload, Creative Commons or public domain).
- The owner approves every screenshot before it is committed.
