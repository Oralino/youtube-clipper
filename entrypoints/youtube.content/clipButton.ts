import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { createIntegratedUi } from "wxt/utils/content-script-ui/integrated";
import { STRINGS } from "../../lib/strings.ts";

const SVG_NS = "http://www.w3.org/2000/svg";
// A play triangle between range brackets. Not scissors: YouTube's own Clip feature uses those.
const ICON_PATH = "M4 4h4v2H6v12h2v2H4zM20 4h-4v2h2v12h-2v2h4zM10 8l6 4-6 4z";
// YouTube's tooltip sits this far above the top of its control buttons.
const TOOLTIP_GAP = 20;
const TOOLTIP_EDGE = 12;

export interface ClipButton {
  /** Shows the button (it mounts as soon as the player controls exist). Also hides the tooltip. */
  setVisible(visible: boolean): void;
  /** Reflects whether the clip panel is open. */
  setExpanded(expanded: boolean): void;
}

export function createClipButton(
  ctx: ContentScriptContext,
  { onClick }: { onClick: () => void },
): ClipButton {
  const tooltip = document.createElement("div");
  tooltip.className = "clip-ext-tooltip";
  tooltip.textContent = STRINGS.clipButton.label;
  // The button's aria-label already says the same thing.
  tooltip.setAttribute("aria-hidden", "true");

  const ui = createIntegratedUi(ctx, {
    position: "inline",
    tag: "button",
    anchor: "#movie_player .ytp-right-controls",
    // Newer players split the right controls into groups; go first in the left group when it exists.
    append: (anchor, root) =>
      (anchor.querySelector(".ytp-right-controls-left") ?? anchor).prepend(root),
    // WXT empties the wrapper on every removal, so the icon is rebuilt on each mount.
    onMount: (wrapper) => wrapper.replaceChildren(createIcon()),
    onRemove: () => tooltip.remove(),
  });
  // WXT's own invalidation cleanup detaches the button but leaves autoMount's observer running,
  // which would re-insert a stale button after an extension reload. ui.remove() stops both.
  ctx.onInvalidated(() => ui.remove());

  // A button because of `tag: "button"` above.
  const button = ui.wrapper as HTMLButtonElement;
  button.type = "button";
  button.className = "ytp-button clip-ext-button";
  button.setAttribute("aria-label", STRINGS.clipButton.label);
  button.setAttribute("aria-expanded", "false");

  button.addEventListener("click", () => {
    tooltip.remove();
    onClick();
  });
  // Enter activates the button without also reaching YouTube's shortcuts. Space never gets here:
  // YouTube takes it first for play/pause, and the owner is fine with that (tested 2026-09-24).
  button.addEventListener("keydown", (event) => {
    if (event.key === "Enter") event.stopPropagation();
  });
  button.addEventListener("mouseenter", () => showTooltip(button, tooltip));
  button.addEventListener("focus", () => {
    if (button.matches(":focus-visible")) showTooltip(button, tooltip);
  });
  button.addEventListener("mouseleave", () => tooltip.remove());
  button.addEventListener("blur", () => tooltip.remove());

  let autoMounting = false;
  return {
    setVisible(visible) {
      // Called on every navigation; YouTube may keep the controls, so don't leave a tooltip behind.
      tooltip.remove();
      if (visible && !autoMounting) {
        ui.autoMount();
        autoMounting = true;
      } else if (!visible && autoMounting) {
        ui.remove();
        autoMounting = false;
      }
    },
    setExpanded(expanded) {
      button.setAttribute("aria-expanded", String(expanded));
    },
  };
}

function createIcon(): SVGSVGElement {
  // Built with DOM calls: YouTube enforces Trusted Types, so innerHTML throws.
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "24");
  svg.setAttribute("height", "24");
  svg.setAttribute("fill", "currentColor");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", ICON_PATH);
  svg.append(path);
  return svg;
}

function showTooltip(button: HTMLElement, tooltip: HTMLElement): void {
  const player = button.closest("#movie_player");
  if (!player) return;
  player.append(tooltip);

  const playerBox = player.getBoundingClientRect();
  const buttonBox = button.getBoundingClientRect();
  const half = tooltip.offsetWidth / 2;
  const centre = buttonBox.left - playerBox.left + buttonBox.width / 2;
  // Keep it inside the player, as YouTube's own tooltips are.
  const left = Math.min(
    Math.max(centre, half + TOOLTIP_EDGE),
    playerBox.width - half - TOOLTIP_EDGE,
  );
  tooltip.style.left = `${left - half}px`;
  tooltip.style.top = `${buttonBox.top - playerBox.top - TOOLTIP_GAP - tooltip.offsetHeight}px`;
}
