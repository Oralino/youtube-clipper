import {
  BlobSource,
  BufferTarget,
  canEncodeAudio,
  Conversion,
  Input,
  Mp4OutputFormat,
  Output,
  WEBM,
} from "mediabunny";
import { AUDIO_BPS } from "../lib/recording.ts";

export interface Mp4Conversion {
  /** Resolves with the MP4, or rejects if the conversion failed or was cancelled. */
  result: Promise<Blob>;
  cancel: () => void;
}

/**
 * Converts a recorded WebM (Firefox's MediaRecorder can't write MP4) to MP4 with the browser's own
 * encoders: H.264 video at the recording's size (no scaling), and AAC audio where the browser can
 * encode it, otherwise the recording's Opus copied as-is (Firefox has no AAC encoder).
 */
export function convertToMp4(
  webm: Blob,
  videoBitrate: number,
  onProgress: (progress: number) => void,
): Mp4Conversion {
  let conversion: Conversion | null = null;
  let cancelled = false;

  const result = (async () => {
    const aac = await canEncodeAudio("aac", { bitrate: AUDIO_BPS });
    const target = new BufferTarget();
    conversion = await Conversion.init({
      input: new Input({ source: new BlobSource(webm), formats: [WEBM] }),
      output: new Output({ format: new Mp4OutputFormat({ fastStart: "in-memory" }), target }),
      // No width or height, so the video keeps the recording's size.
      video: { codec: "avc", bitrate: videoBitrate },
      audio: aac ? { codec: "aac", bitrate: AUDIO_BPS } : { codec: "opus" },
    });
    if (cancelled) throw new Error("cancelled");
    if (!conversion.isValid) {
      const reasons = conversion.discardedTracks.map((track) => track.reason).join(", ");
      throw new Error(`can't convert this recording (${reasons})`);
    }
    conversion.onProgress = onProgress;
    await conversion.execute();
    if (!target.buffer) throw new Error("the conversion produced no file");
    return new Blob([target.buffer], { type: "video/mp4" });
  })();

  return {
    result,
    cancel: () => {
      cancelled = true;
      void conversion?.cancel();
    },
  };
}
