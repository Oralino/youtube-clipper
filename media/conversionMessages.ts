// Messages between the content script and the background page, which does the MP4 conversion
// (it failed in the content script in Firefox; see entrypoints/background.ts).
export const CONVERT_PORT = "convert-to-mp4";

export interface ConvertRequest {
  webm: ArrayBuffer;
  bitrate: number;
}

export type ConvertResponse =
  | { type: "progress"; progress: number }
  | { type: "done"; mp4: ArrayBuffer }
  | { type: "error"; message: string };
