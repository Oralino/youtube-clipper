import { getVideoId } from "../../lib/videoId.ts";
import { createClipButton } from "./clipButton.ts";
import { createClipPanel } from "./clipPanel.tsx";
import "./clipButton.css";

export default defineContentScript({
  matches: ["*://www.youtube.com/*", "*://m.youtube.com/*"],
  async main(ctx) {
    let videoId: string | null = null;

    const panel = await createClipPanel(ctx, {
      onClose: () => closePanel(true),
      onFocusLost: () => button.focus(),
    });
    const button = createClipButton(ctx, {
      onClick: () => (panel.isOpen ? closePanel(false) : openPanel()),
    });

    function openPanel() {
      if (panel.open()) button.setExpanded(true);
    }

    function closePanel(returnFocus: boolean, immediate = false) {
      // Don't let focus fall to <body> when the panel disappears from under it.
      const hadFocus = panel.hasFocus;
      panel.close({ immediate });
      button.setExpanded(false);
      if (returnFocus || hadFocus) button.focus();
    }

    // YouTube switches videos without a page load, so re-check on every navigation.
    const sync = () => {
      const nextId = getVideoId(location.href);
      if (nextId !== videoId) {
        videoId = nextId;
        closePanel(false, true);
      }
      // Desktop only: m.youtube.com has a different player and no room for the button.
      button.setVisible(nextId !== null && location.hostname === "www.youtube.com");
    };

    sync();
    ctx.addEventListener(window, "wxt:locationchange", sync);
    ctx.addEventListener(document, "yt-navigate-finish", sync);
  },
});
