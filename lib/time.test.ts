import { describe, expect, it } from "vitest";
import { formatTime, parseTime, parseYouTubeTime } from "./time.ts";

describe("parseTime", () => {
  it.each([
    ["83", 83],
    ["0", 0],
    ["1:23", 83],
    ["0:05", 5],
    ["1:5", 65],
    ["1:02:03", 3723],
    ["  1:23  ", 83],
    ["90:00", 5400],
  ])("parses %j as %i", (input, expected) => {
    expect(parseTime(input)).toBe(expected);
  });

  it.each(["", "   ", "abc", "1:60", "1:00:60", "1:2:3:4", "-5", "1.5", "1:", ":30", "1m23s"])(
    "rejects %j",
    (input) => {
      expect(parseTime(input)).toBeNull();
    },
  );
});

describe("parseTime overflow", () => {
  it("rejects numbers too big to be exact seconds", () => {
    expect(parseTime("9".repeat(400))).toBeNull();
    expect(parseTime("9007199254740993")).toBeNull();
  });
});

describe("formatTime", () => {
  it.each([
    [0, "0:00"],
    [5, "0:05"],
    [83, "1:23"],
    [600, "10:00"],
    [3723, "1:02:03"],
    [36000, "10:00:00"],
    [83.9, "1:23"],
    [-4, "0:00"],
    [NaN, "0:00"],
    [Infinity, "0:00"],
  ])("formats %d as %j", (seconds, expected) => {
    expect(formatTime(seconds)).toBe(expected);
  });

  it("round-trips with parseTime", () => {
    for (const seconds of [0, 59, 60, 3599, 3600, 7322]) {
      expect(parseTime(formatTime(seconds))).toBe(seconds);
    }
  });
});

describe("parseYouTubeTime", () => {
  it.each([
    ["5", 5],
    ["5s", 5],
    ["83s", 83],
    ["1m23s", 83],
    ["2m", 120],
    ["1h", 3600],
    ["1h2m3s", 3723],
    ["1h3s", 3603],
  ])("parses %j as %i", (value, expected) => {
    expect(parseYouTubeTime(value)).toBe(expected);
  });

  it.each(["", "s", "abc", "1:23", "-5", "5x", "1s2m", "9".repeat(400)])("rejects %j", (value) => {
    expect(parseYouTubeTime(value)).toBeNull();
  });
});
