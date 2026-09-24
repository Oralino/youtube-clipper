import { createRoot, type Root } from "react-dom/client";
import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { createShadowRootUi } from "wxt/utils/content-script-ui/shadow-root";
import ClipPanel from "../../components/ClipPanel.tsx";
import panelCss from "../../components/clipPanel.css?inline";

// Between the player and the video title, in both default and theater mode.
const ANCHOR = "ytd-watch-flexy #below ytd-watch-metadata";
const CLOSE_MS = 100;
// Kept from YouTube's player: its shortcuts (typing "5" in a field would seek to 50%), and in
// fullscreen its click (play/pause), double-click (exit fullscreen) and wheel (volume) handlers.
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
  open(): boolean;
  /**
   * Closes the panel. `immediate` skips the close animation: use it when the video changed, so a
   * quick reopen can't revive a panel bound to the old video.
   */
  close(options?: { immediate?: boolean }): void;
}

export async function createClipPanel(
  ctx: ContentScriptContext,
  { onClose }: { onClose: () => void },
): Promise<ClipPanelController> {
  let isOpen = false;
  let video: HTMLVideoElement | null = null;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;

  const ui = await createShadowRootUi<Root>(ctx, {
    name: "clip-ext-panel",
    position: "inline",
    anchor: ANCHOR,
    append: "before",
    css: panelCss,
    isolateEvents: ISOLATED_EVENTS,
    onMount: (container, _shadow, host) => {
      // Set before the first render so the panel never flashes in the wrong theme.
      applyTheme(host);
      const root = createRoot(container);
      if (video) root.render(<ClipPanel video={video} onClose={onClose} />);
      return root;
    },
    onRemove: (root) => root?.unmount(),
  });
  const host = ui.shadowHost;

  const themeObserver = new MutationObserver(() => applyTheme(host));

  function place() {
    const player = document.querySelector("#movie_player");
    const fullscreen = document.fullscreenElement;
    if (player && fullscreen?.contains(player)) {
      player.append(host);
      host.dataset.placement = "overlay";
    } else {
      document.querySelector(ANCHOR)?.before(host);
      delete host.dataset.placement;
    }
    applyTheme(host);
  }

  function remove() {
    clearTimeout(closeTimer);
    closeTimer = undefined;
    themeObserver.disconnect();
    delete host.dataset.closing;
    ui.remove();
  }

  ctx.addEventListener(document, "fullscreenchange", () => {
    // Also while the close animation runs, so it doesn't fade out in the wrong place.
    if (host.isConnected) place();
  });
  ctx.onInvalidated(remove);

  return {
    get isOpen() {
      return isOpen;
    },
    get hasFocus() {
      // Focus inside a shadow root shows on the page as focus on its host.
      return host.isConnected && document.activeElement === host;
    },
    open() {
      if (isOpen) return true;
      // Reopened while the close animation runs: keep the panel as it is.
      if (closeTimer !== undefined) {
        clearTimeout(closeTimer);
        closeTimer = undefined;
        delete host.dataset.closing;
        isOpen = true;
        return true;
      }
      video = document.querySelector<HTMLVideoElement>("#movie_player video");
      if (!video || !document.querySelector(ANCHOR)) return false;

      ui.mount();
      place();
      themeObserver.observe(document.documentElement, { attributeFilter: ["dark"] });
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

function applyTheme(host: HTMLElement) {
  // Fullscreen is always dark, like YouTube's own in-player menus.
  const dark =
    host.dataset.placement === "overlay" || document.documentElement.hasAttribute("dark");
  host.dataset.theme = dark ? "dark" : "light";
}
