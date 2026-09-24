import { describe, expect, it } from "vitest";
import { checkClipForm } from "./clipForm.ts";

describe("checkClipForm", () => {
  it("returns a range for two valid times", () => {
    expect(checkClipForm("0:05", "0:12", 19)).toEqual({
      startError: null,
      endError: null,
      range: { start: 5, end: 12 },
    });
  });

  it("treats empty fields as not yet filled in, not as errors", () => {
    expect(checkClipForm("", "", 19)).toEqual({ startError: null, endError: null, range: null });
    expect(checkClipForm("0:05", "  ", 19)).toEqual({
      startError: null,
      endError: null,
      range: null,
    });
  });

  it("flags unreadable times on the field that has them", () => {
    expect(checkClipForm("abc", "0:12", 19).startError).toBe("unreadable-time");
    expect(checkClipForm("0:05", "1:60", 19).endError).toBe("unreadable-time");
  });

  it("flags an end at or before the start on the end field", () => {
    expect(checkClipForm("0:12", "0:05", 19)).toMatchObject({
      startError: null,
      endError: "end-before-start",
      range: null,
    });
    expect(checkClipForm("0:12", "0:12", 19).endError).toBe("end-before-start");
  });

  it("flags times past the end of the video", () => {
    expect(checkClipForm("0:19", "", 19).startError).toBe("outside-video");
    expect(checkClipForm("0:05", "0:20", 19).endError).toBe("outside-video");
  });

  it("allows the end to be exactly the video's length", () => {
    expect(checkClipForm("0:05", "0:19", 19).range).toEqual({ start: 5, end: 19 });
  });

  it("doesn't also blame the end when the start is the problem", () => {
    expect(checkClipForm("0:25", "0:10", 19)).toMatchObject({
      startError: "outside-video",
      endError: null,
    });
  });

  it("skips the length checks while the length is unknown (loading or live)", () => {
    expect(checkClipForm("0:05", "9:00", NaN).range).toEqual({ start: 5, end: 540 });
    expect(checkClipForm("0:05", "9:00", Infinity).range).toEqual({ start: 5, end: 540 });
  });
});
