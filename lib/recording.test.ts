import { describe, expect, it } from "vitest";
import { clipFileName, pickRecordingType, videoBitrate } from "./recording.ts";

describe("pickRecordingType", () => {
  it("prefers MP4 with H.264 and AAC", () => {
    expect(pickRecordingType(() => true)).toEqual({
      mimeType: "video/mp4;codecs=avc1,mp4a.40.2",
      extension: "mp4",
    });
  });

  it("falls back to WebM when MP4 isn't supported", () => {
    const webmOnly = (type: string) => type.startsWith("video/webm");
    expect(pickRecordingType(webmOnly)).toEqual({
      mimeType: "video/webm;codecs=vp9,opus",
      extension: "webm",
    });
  });

  it("returns null when nothing can be recorded", () => {
    expect(pickRecordingType(() => false)).toBeNull();
  });
});

describe("videoBitrate", () => {
  it("scales with resolution and frame rate", () => {
    expect(videoBitrate(1920, 1080, 30)).toBe(6_220_800);
    expect(videoBitrate(1920, 1080, 60)).toBe(12_441_600);
  });

  it("assumes 30 fps when the frame rate is unknown", () => {
    expect(videoBitrate(1920, 1080)).toBe(6_220_800);
    expect(videoBitrate(1920, 1080, NaN)).toBe(6_220_800);
    expect(videoBitrate(1920, 1080, 0)).toBe(6_220_800);
  });

  it("keeps small videos at a sensible minimum", () => {
    expect(videoBitrate(320, 240, 30)).toBe(2_500_000);
  });

  it("caps very large videos", () => {
    expect(videoBitrate(7680, 4320, 60)).toBe(40_000_000);
  });

  it("uses the minimum when the size is unknown", () => {
    expect(videoBitrate(0, 0, 30)).toBe(2_500_000);
    expect(videoBitrate(NaN, 1080, 30)).toBe(2_500_000);
  });
});

describe("clipFileName", () => {
  it("names the file after the video and the range", () => {
    expect(clipFileName("Me at the zoo", 5, 12, "mp4")).toBe("Me at the zoo (0.05-0.12).mp4");
    expect(clipFileName("Long talk", 3723, 3800, "webm")).toBe("Long talk (1.02.03-1.03.20).webm");
  });

  it("removes characters that aren't allowed in file names", () => {
    expect(clipFileName('A/B: "C" <D>?*|\\', 0, 5, "mp4")).toBe("A B C D (0.00-0.05).mp4");
  });

  it("shortens very long titles and drops trailing dots or spaces", () => {
    const name = clipFileName(`${"a".repeat(79)}. more`, 0, 5, "mp4");
    expect(name).toBe(`${"a".repeat(79)} (0.00-0.05).mp4`);
  });

  it("falls back to 'clip' when nothing usable is left", () => {
    expect(clipFileName("  ???  ", 0, 5, "mp4")).toBe("clip (0.00-0.05).mp4");
  });
});
