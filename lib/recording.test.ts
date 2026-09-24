import { describe, expect, it } from "vitest";
import {
  clipFileName,
  defaultClipName,
  pickRecordingType,
  videoBitrate,
  videoTitleFrom,
} from "./recording.ts";

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

describe("videoTitleFrom", () => {
  it("drops YouTube's suffix and the unread count", () => {
    expect(videoTitleFrom("Me at the zoo - YouTube")).toBe("Me at the zoo");
    expect(videoTitleFrom("(3) Me at the zoo - YouTube")).toBe("Me at the zoo");
  });

  it("keeps a title without the suffix", () => {
    expect(videoTitleFrom("Me at the zoo")).toBe("Me at the zoo");
  });
});

describe("defaultClipName", () => {
  it("names the clip after the video and the range", () => {
    expect(defaultClipName("Me at the zoo", 5, 12)).toBe("Me at the zoo (0.05-0.12)");
    expect(defaultClipName("Long talk", 3723, 3800)).toBe("Long talk (1.02.03-1.03.20)");
  });

  it("removes characters that aren't allowed in file names", () => {
    expect(defaultClipName('A/B: "C" <D>?*|\\', 0, 5)).toBe("A B C D (0.00-0.05)");
  });

  it("shortens very long titles and drops trailing dots or spaces", () => {
    expect(defaultClipName(`${"a".repeat(79)}. more`, 0, 5)).toBe(`${"a".repeat(79)} (0.00-0.05)`);
  });

  it("falls back to 'clip' when nothing usable is left", () => {
    expect(defaultClipName("  ???  ", 0, 5)).toBe("clip (0.00-0.05)");
  });
});

describe("clipFileName", () => {
  const fallback = "Me at the zoo (0.05-0.12)";

  it("uses the typed name", () => {
    expect(clipFileName("Elephants", fallback, "mp4")).toBe("Elephants.mp4");
  });

  it("uses the automatic name when nothing was typed", () => {
    expect(clipFileName("", fallback, "mp4")).toBe(`${fallback}.mp4`);
    expect(clipFileName("   ", fallback, "webm")).toBe(`${fallback}.webm`);
  });

  it("doesn't double a typed extension", () => {
    expect(clipFileName("Elephants.mp4", fallback, "mp4")).toBe("Elephants.mp4");
    expect(clipFileName("Elephants.MP4 ", fallback, "mp4")).toBe("Elephants.mp4");
    expect(clipFileName("Elephants.webm", fallback, "mp4")).toBe("Elephants.mp4");
  });

  it("cleans characters that aren't allowed and trailing dots", () => {
    expect(clipFileName('My: "best" clip?.', fallback, "mp4")).toBe("My best clip.mp4");
  });

  it("falls back when the typed name has nothing usable left", () => {
    expect(clipFileName("???", fallback, "mp4")).toBe(`${fallback}.mp4`);
  });

  it("keeps Windows reserved names usable", () => {
    expect(clipFileName("con", fallback, "mp4")).toBe("_con.mp4");
    expect(clipFileName("LPT1", fallback, "mp4")).toBe("_LPT1.mp4");
  });

  it("caps very long names at 80 characters", () => {
    expect(clipFileName("x".repeat(200), fallback, "mp4")).toBe(`${"x".repeat(80)}.mp4`);
  });
});
