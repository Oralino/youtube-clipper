import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { STRINGS } from "../../lib/strings.ts";
import { createIcon, setIconOpen, type ClipButton } from "./clipButton.ts";

// The action bar (Like, Comments, Share, Remix) of the Short that's playing.
const ACTION_BAR = "ytd-reel-video-renderer:has(#shorts-player) reel-action-bar-view-model";

/**
 * The Clip button in the Shorts action bar, styled like YouTube's own items. YouTube rebuilds the
 * bar for every Short in one go, which WXT's autoMount can't see (the anchor never goes missing),
 * so a page observer puts the button back into whichever bar is current.
 */
export function createShortsButton(
  ctx: ContentScriptContext,
  { onClick }: { onClick: () => void },
): ClipButton {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "clip-ext-shorts-button";
  button.setAttribute("aria-label", STRINGS.clipButton.label);
  button.setAttribute("aria-expanded", "false");
  const icon = createIcon(false);
  button.append(icon);
  button.addEventListener("click", onClick);
  // Keeps Enter and Space from also reaching YouTube's Shorts shortcuts.
  button.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") event.stopPropagation();
  });

  // Visible label, as on YouTube's items; the button's aria-label already says it.
  const text = document.createElement("div");
  text.className = "clip-ext-shorts-label";
  text.setAttribute("aria-hidden", "true");
  text.textContent = STRINGS.clipButton.label;

  // A <label>, like YouTube's items, so clicking the text also presses the button.
  const action = document.createElement("label");
  action.className = "clip-ext-shorts-action";
  action.append(button, text);
  const item = document.createElement("div");
  item.className = "clip-ext-shorts-item";
  item.append(action);

  let visible = false;
  let frame = 0;
  // Shorts pages change constantly, so checks are batched to one per frame.
  const observer = new MutationObserver(() => {
    if (!frame) frame = requestAnimationFrame(place);
  });

  function place() {
    frame = 0;
    const bar = document.querySelector(ACTION_BAR);
    if (!bar) return;
    const before = itemAfterShare(bar);
    if (item.parentElement === bar && item.nextElementSibling === before) return;
    bar.insertBefore(item, before);
  }

  function hide() {
    observer.disconnect();
    cancelAnimationFrame(frame);
    frame = 0;
    item.remove();
  }
  ctx.onInvalidated(hide);

  return {
    setVisible(next) {
      if (next === visible) return;
      visible = next;
      if (visible) {
        observer.observe(document.body, { childList: true, subtree: true });
        place();
      } else {
        hide();
      }
    },
    setExpanded(expanded) {
      button.setAttribute("aria-expanded", String(expanded));
      // Changes the icon in place: replacing it mid-click would detach the click's target, and the
      // <label> would then pass the click on to the button a second time (closing the panel again).
      setIconOpen(icon, expanded);
    },
    focus() {
      button.focus();
    },
  };
}

/**
 * The item the button goes in front of: Remix, the last of YouTube's action buttons (Share is the
 * one before it). Found by position, because the buttons' names are translated.
 */
function itemAfterShare(bar: Element): Element | null {
  const buttons = [...bar.children].filter((child) => child.localName === "button-view-model");
  if (buttons.length >= 2) return buttons[buttons.length - 1] ?? null;
  return bar.querySelector(":scope > pivot-button-view-model");
}
