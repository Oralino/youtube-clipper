import { getVideoPage, type VideoPage } from "../../lib/videoId.ts";
import { createClipButton, type ClipButton } from "./clipButton.ts";
import { createClipPanel } from "./clipPanel.tsx";
import { createShortsButton } from "./shortsButton.ts";
import "./clipButton.css";

export default defineContentScript({
  matches: ["*://www.youtube.com/*", "*://m.youtube.com/*"],
  async main(ctx) {
    let page: VideoPage | null = null;

    const panel = await createClipPanel(ctx, {
      onClose: () => closePanel(true),
      onFocusLost: () => currentButton()?.focus(),
    });
    const onClick = () => (panel.isOpen ? closePanel(false) : openPanel());
    // Watch pages get a button in the player's controls, Shorts one in the action bar beside it.
    const buttons: Record<VideoPage["kind"], ClipButton> = {
      watch: createClipButton(ctx, { onClick }),
      shorts: createShortsButton(ctx, { onClick }),
    };

    function currentButton(): ClipButton | null {
      return page ? buttons[page.kind] : null;
    }

    function openPanel() {
      if (page && panel.open(page.kind)) buttons[page.kind].setExpanded(true);
    }

    function closePanel(returnFocus: boolean, immediate = false) {
      // Don't let focus fall to <body> when the panel disappears from under it.
      const hadFocus = panel.hasFocus;
      panel.close({ immediate });
      buttons.watch.setExpanded(false);
      buttons.shorts.setExpanded(false);
      if (returnFocus || hadFocus) currentButton()?.focus();
    }

    // YouTube switches videos (and Shorts, on scroll) without a page load, so re-check on every
    // navigation.
    const sync = () => {
      const next = getVideoPage(location.href);
      const changed = next?.id !== page?.id || next?.kind !== page?.kind;
      page = next;
      // Desktop only: m.youtube.com has a different player and no room for the button.
      const desktop = location.hostname === "www.youtube.com";
      buttons.watch.setVisible(desktop && page?.kind === "watch");
      buttons.shorts.setVisible(desktop && page?.kind === "shorts");
      // After the buttons, so focus from a closing panel can land on the new page's button. On the
      // next Short the bar is still being rebuilt, and focus() on the detached button does nothing.
      if (changed) closePanel(false, true);
    };

    sync();
    ctx.addEventListener(window, "wxt:locationchange", sync);
    ctx.addEventListener(document, "yt-navigate-finish", sync);
  },
});
