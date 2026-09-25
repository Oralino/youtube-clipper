import { createRoot, type Root } from "react-dom/client";
import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { createShadowRootUi } from "wxt/utils/content-script-ui/shadow-root";
import ClipPanel from "../../components/ClipPanel.tsx";
import panelCss from "../../components/clipPanel.css?inline";
import type { VideoPage } from "../../lib/videoId.ts";

// Where the panel goes. Watch pages: an overlay inside the player, in every player mode (the owner's
// choice, 2026-09-24). Shorts: the box around the player, because YouTube's Shorts overlay (title,
// controls) sits above the player's own stacking context and would cover a panel inside it.
const SURFACES = {
  watch: { player: "#movie_player", anchor: "#movie_player" },
  shorts: {
    player: "#shorts-player",
    anchor: "ytd-reel-video-renderer #player-container:has(#shorts-player)",
  },
} satisfies Record<VideoPage["kind"], { player: string; anchor: string }>;
const CLOSE_MS = 100;
// Kept from YouTube's player: its shortcuts (typing "5" in a field would seek to 50%), and its
// click (play/pause), double-click (fullscreen) and wheel (volume) handlers.
const ISOLATED_EVENTS = [
  "keydown",
  "keyup",
  "keypress",
  "click",
  "dblclick",
  "mousedown",
  "mouseup",
  "pointerdown",
  "pointerup",
  "wheel",
];

export interface ClipPanelController {
  readonly isOpen: boolean;
  /** Whether keyboard focus is inside the panel. */
  readonly hasFocus: boolean;
  /** Opens the panel for the current video. Returns false if the page isn't ready for it. */
  open(kind: VideoPage["kind"]): boolean;
  /**
   * Closes the panel. `immediate` skips the close animation: use it when the video changed, so a
   * quick reopen can't revive a panel bound to the old video.
   */
  close(options?: { immediate?: boolean }): void;
}

export async function createClipPanel(
  ctx: ContentScriptContext,
  {
    onClose,
    onFocusLost,
  }: {
    onClose: () => void;
    /** Called when an ad hides the panel while focus is inside it. */
    onFocusLost: () => void;
  },
): Promise<ClipPanelController> {
  let isOpen = false;
  let video: HTMLVideoElement | null = null;
  let anchor: Element | null = null;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;

  const ui = await createShadowRootUi<Root>(ctx, {
    name: "clip-ext-panel",
    position: "inline",
    anchor: () => anchor,
    append: "last",
    css: panelCss,
    isolateEvents: ISOLATED_EVENTS,
    onMount: (container) => {
      const root = createRoot(container);
      if (video) root.render(<ClipPanel video={video} onClose={onClose} />);
      return root;
    },
    onRemove: (root) => root?.unmount(),
  });
  const host = ui.shadowHost;

  // Hidden while an ad plays: it would cover "Skip ad", and the video element is playing the ad.
  // Hiding (not closing) keeps what was typed for when the ad ends.
  const adObserver = new MutationObserver(syncAd);
  function syncAd() {
    const ad = video?.closest(".html5-video-player")?.classList.contains("ad-showing") ?? false;
    if (ad && !host.hasAttribute("data-ad") && document.activeElement === host) onFocusLost();
    host.toggleAttribute("data-ad", ad);
  }

  function remove() {
    clearTimeout(closeTimer);
    closeTimer = undefined;
    adObserver.disconnect();
    delete host.dataset.closing;
    ui.remove();
  }

  ctx.onInvalidated(remove);

  return {
    get isOpen() {
      return isOpen;
    },
    get hasFocus() {
      // Focus inside a shadow root shows on the page as focus on its host.
      return host.isConnected && document.activeElement === host;
    },
    open(kind) {
      if (isOpen) return true;
      // Reopened while the close animation runs: keep the panel as it is. Only for the same kind of
      // page; navigation closes immediately, so a different kind here would be a new video.
      if (closeTimer !== undefined && host.dataset.surface === kind) {
        clearTimeout(closeTimer);
        closeTimer = undefined;
        delete host.dataset.closing;
        isOpen = true;
        return true;
      }
      if (closeTimer !== undefined) remove();
      const surface = SURFACES[kind];
      video = document.querySelector<HTMLVideoElement>(`${surface.player} video`);
      anchor = document.querySelector(surface.anchor);
      if (!video || !anchor) return false;

      host.dataset.surface = kind;
      ui.mount();
      syncAd();
      const player = video.closest(".html5-video-player");
      if (player) adObserver.observe(player, { attributeFilter: ["class"] });
      isOpen = true;
      return true;
    },
    close({ immediate = false } = {}) {
      if (!isOpen) {
        if (immediate && closeTimer !== undefined) remove();
        return;
      }
      isOpen = false;
      if (immediate || matchMedia("(prefers-reduced-motion: reduce)").matches) {
        remove();
        return;
      }
      host.dataset.closing = "";
      closeTimer = setTimeout(remove, CLOSE_MS);
    },
  };
}
