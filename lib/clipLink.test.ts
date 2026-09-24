import { describe, expect, it } from "vitest";
import {
  buildClipLink,
  buildEmbedLink,
  getVideoId,
  parseClipLink,
  validateRange,
  type Clip,
} from "./clipLink.ts";

const ID = "jNQXAC9IVRw";
const clip: Clip = { videoId: ID, start: 5, end: 12 };

describe("buildClipLink", () => {
  it("puts the start in t and the end in the hash", () => {
    expect(buildClipLink(clip)).toBe(`https://www.youtube.com/watch?v=${ID}&t=5#clip_end=12`);
  });

  it("round-trips through parseClipLink", () => {
    const long: Clip = { videoId: "a-b_c-d_e-f", start: 3600, end: 7322 };
    expect(parseClipLink(buildClipLink(long))).toEqual(long);
  });
});

describe("buildEmbedLink", () => {
  it("uses the embed player's start and end", () => {
    expect(buildEmbedLink(clip)).toBe(`https://www.youtube.com/embed/${ID}?start=5&end=12`);
  });
});

describe("parseClipLink", () => {
  // The URLs the page actually receives, recorded in the link-format test (2026-09-24).
  it.each([
    ["a direct open", `https://www.youtube.com/watch?v=${ID}&t=5#clip_end=12`],
    [
      "a youtu.be redirect",
      `https://www.youtube.com/watch?t=5&v=${ID}&feature=youtu.be#clip_end=12`,
    ],
    [
      "an m.youtube.com redirect",
      `https://m.youtube.com/watch?v=${ID}&t=5&pp=2AEFkAIB#clip_end=12`,
    ],
    ["YouTube's 5s form of t", `https://www.youtube.com/watch?v=${ID}&t=5s#clip_end=12`],
    ["a youtu.be link itself", `https://youtu.be/${ID}?t=5#clip_end=12`],
    ["youtube.com without www", `https://youtube.com/watch?v=${ID}&t=5#clip_end=12`],
    ["an uppercase URL", `HTTPS://WWW.YOUTUBE.COM/watch?v=${ID}&t=5#clip_end=12`],
    ["another key in the hash", `https://www.youtube.com/watch?v=${ID}&t=5#foo=1&clip_end=12`],
  ])("reads %s", (_, href) => {
    expect(parseClipLink(href)).toEqual(clip);
  });

  it("starts at 0 when t is missing", () => {
    expect(parseClipLink(`https://www.youtube.com/watch?v=${ID}#clip_end=12`)).toEqual({
      ...clip,
      start: 0,
    });
  });

  it("reads t in minutes and seconds", () => {
    expect(parseClipLink(`https://www.youtube.com/watch?v=${ID}&t=1m5s#clip_end=90`)).toEqual({
      videoId: ID,
      start: 65,
      end: 90,
    });
  });

  it("uses the first clip_end when the hash repeats it", () => {
    expect(parseClipLink(`https://www.youtube.com/watch?v=${ID}#clip_end=5&clip_end=12`)).toEqual({
      videoId: ID,
      start: 0,
      end: 5,
    });
  });

  it.each([
    ["no clip_end", `https://www.youtube.com/watch?v=${ID}&t=5`],
    [
      "an end too big to be exact",
      `https://www.youtube.com/watch?v=${ID}&t=5#clip_end=${"9".repeat(309)}`,
    ],
    [
      "a start too big to be exact",
      `https://www.youtube.com/watch?v=${ID}&t=${"9".repeat(309)}#clip_end=12`,
    ],
    ["plain http", `http://www.youtube.com/watch?v=${ID}&t=5#clip_end=12`],
    ["YouTube Music", `https://music.youtube.com/watch?v=${ID}&t=5#clip_end=12`],
    ["a trailing slash on /watch/", `https://www.youtube.com/watch/?v=${ID}&t=5#clip_end=12`],
    [
      "clip_end in the query, not the hash",
      `https://www.youtube.com/watch?v=${ID}&t=5&clip_end=12`,
    ],
    ["a non-numeric end", `https://www.youtube.com/watch?v=${ID}&t=5#clip_end=abc`],
    ["a decimal end", `https://www.youtube.com/watch?v=${ID}&t=5#clip_end=12.5`],
    ["an end before the start", `https://www.youtube.com/watch?v=${ID}&t=20#clip_end=12`],
    ["an end equal to the start", `https://www.youtube.com/watch?v=${ID}&t=12#clip_end=12`],
    ["an unreadable t", `https://www.youtube.com/watch?v=${ID}&t=abc#clip_end=12`],
    ["no video ID", "https://www.youtube.com/watch?t=5#clip_end=12"],
    ["a malformed video ID", "https://www.youtube.com/watch?v=short&t=5#clip_end=12"],
    ["a non-watch YouTube page", `https://www.youtube.com/shorts/${ID}#clip_end=12`],
    ["another site", `https://example.com/watch?v=${ID}&t=5#clip_end=12`],
    ["a look-alike host", `https://www.youtube.com.evil.test/watch?v=${ID}#clip_end=12`],
    ["not a URL", "clip me"],
  ])("rejects %s", (_, href) => {
    expect(parseClipLink(href)).toBeNull();
  });
});

describe("getVideoId", () => {
  it("reads watch pages, including a URL object", () => {
    expect(getVideoId(`https://www.youtube.com/watch?v=${ID}&list=PL123`)).toBe(ID);
    expect(getVideoId(new URL(`https://m.youtube.com/watch?v=${ID}`))).toBe(ID);
  });

  it("reads youtu.be links", () => {
    expect(getVideoId(`https://youtu.be/${ID}?si=abc`)).toBe(ID);
  });

  it.each([
    "https://www.youtube.com/",
    "https://www.youtube.com/results?search_query=zoo",
    `https://www.youtube.com/embed/${ID}`,
    "https://youtu.be/",
    "not a url",
  ])("returns null for %s", (href) => {
    expect(getVideoId(href)).toBeNull();
  });
});

describe("validateRange", () => {
  it("accepts a range inside the video", () => {
    expect(validateRange(5, 12, 19)).toBeNull();
    expect(validateRange(0, 19, 19)).toBeNull();
  });

  it("treats a missing, NaN (loading) or Infinity (live) length as unknown", () => {
    expect(validateRange(5, 9999)).toBeNull();
    expect(validateRange(5, 9999, NaN)).toBeNull();
    expect(validateRange(5, 9999, Infinity)).toBeNull();
  });

  it("rejects a start or end that isn't a finite number", () => {
    expect(validateRange(NaN, 12, 19)).toBe("outside-video");
    expect(validateRange(5, NaN, 19)).toBe("outside-video");
    expect(validateRange(5, Infinity)).toBe("outside-video");
  });

  it("rejects an end at or before the start", () => {
    expect(validateRange(12, 5, 19)).toBe("end-before-start");
    expect(validateRange(12, 12, 19)).toBe("end-before-start");
  });

  it("rejects times outside the video", () => {
    expect(validateRange(5, 20, 19)).toBe("outside-video");
    expect(validateRange(-1, 12, 19)).toBe("outside-video");
  });
});
