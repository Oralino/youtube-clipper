import { getVideoId } from "../../lib/clipLink.ts";
import { createClipButton } from "./clipButton.ts";
import "./clipButton.css";

export default defineContentScript({
  matches: ["*://www.youtube.com/*", "*://m.youtube.com/*"],
  // YouTube strips the clip hash from the address bar right after load, so read it before its scripts run.
  runAt: "document_start",
  main(ctx) {
    let videoId: string | null = null;
    let panelOpen = false;

    const button = createClipButton(ctx, {
      onClick: () => {
        panelOpen = !panelOpen;
        button.setExpanded(panelOpen);
      },
    });

    // YouTube switches videos without a page load, so re-check on every navigation.
    const sync = () => {
      const nextId = getVideoId(location.href);
      if (nextId !== videoId) {
        videoId = nextId;
        panelOpen = false;
        button.setExpanded(false);
      }
      // Desktop only: m.youtube.com has a different player and no room for the button.
      button.setVisible(nextId !== null && location.hostname === "www.youtube.com");
    };

    sync();
    ctx.addEventListener(window, "wxt:locationchange", sync);
    ctx.addEventListener(document, "yt-navigate-finish", sync);
  },
});
