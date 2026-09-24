import { browser } from "wxt/browser";
import { CONVERT_PORT, type ConvertRequest, type ConvertResponse } from "./conversionMessages.ts";
import type { Mp4Conversion } from "./convertToMp4.ts";

/**
 * Runs `convertToMp4` in the background page (see entrypoints/background.ts) and reports back.
 * Cancelling disconnects the port, which cancels the conversion there.
 */
export function convertInBackground(
  webm: Blob,
  bitrate: number,
  onProgress: (progress: number) => void,
): Mp4Conversion {
  const port = browser.runtime.connect({ name: CONVERT_PORT });
  let settled = false;

  const result = new Promise<Blob>((resolve, reject) => {
    port.onMessage.addListener((response: ConvertResponse) => {
      if (response.type === "progress") return onProgress(response.progress);
      settled = true;
      port.disconnect();
      if (response.type === "done") resolve(new Blob([response.mp4], { type: "video/mp4" }));
      else reject(new Error(response.message));
    });
    port.onDisconnect.addListener(() => {
      if (!settled) reject(new Error("the background page stopped before the conversion finished"));
    });
    webm
      .arrayBuffer()
      .then((buffer) => {
        const request: ConvertRequest = { webm: buffer, bitrate };
        port.postMessage(request);
      })
      .catch(reject);
  });

  return {
    result,
    cancel: () => {
      settled = true;
      port.disconnect();
    },
  };
}
