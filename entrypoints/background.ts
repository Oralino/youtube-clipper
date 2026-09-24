import { browser } from "wxt/browser";
import {
  CONVERT_PORT,
  type ConvertRequest,
  type ConvertResponse,
} from "../media/conversionMessages.ts";
import { convertToMp4, type Mp4Conversion } from "../media/convertToMp4.ts";

// Converts Firefox's WebM recordings to MP4 here rather than in the content script: conversion failed
// in the content script in Firefox (owner's test, 2026-09-24), and the background page is an ordinary
// extension page with the full WebCodecs API. Disconnecting the port cancels the conversion.
export default defineBackground(() => {
  browser.runtime.onConnect.addListener((port) => {
    if (port.name !== CONVERT_PORT) return;
    let job: Mp4Conversion | null = null;
    const send = (response: ConvertResponse) => port.postMessage(response);

    port.onMessage.addListener((request: ConvertRequest) => {
      if (job) return;
      let shown = -1;
      job = convertToMp4(
        new Blob([request.webm], { type: "video/webm" }),
        request.bitrate,
        (progress) => {
          // One message per whole percent is plenty for the progress bar.
          const percent = Math.floor(progress * 100);
          if (percent > shown) {
            shown = percent;
            send({ type: "progress", progress });
          }
        },
      );
      job.result
        .then(async (mp4) => send({ type: "done", mp4: await mp4.arrayBuffer() }))
        .catch((error: unknown) => send({ type: "error", message: String(error) }));
    });

    port.onDisconnect.addListener(() => job?.cancel());
  });
});
