import { describe, expect, it } from "vitest";
import { getVideoId } from "./videoId.ts";

const ID = "jNQXAC9IVRw";

describe("getVideoId", () => {
  it.each([
    ["a watch page", `https://www.youtube.com/watch?v=${ID}&list=PL123`],
    ["youtube.com without www", `https://youtube.com/watch?v=${ID}`],
    ["the mobile site", `https://m.youtube.com/watch?v=${ID}&pp=2AEFkAIB`],
    ["a youtu.be link", `https://youtu.be/${ID}?si=abc`],
    ["an uppercase URL", `HTTPS://WWW.YOUTUBE.COM/watch?v=${ID}`],
  ])("reads %s", (_, href) => {
    expect(getVideoId(href)).toBe(ID);
  });

  it("accepts a URL object", () => {
    expect(getVideoId(new URL(`https://www.youtube.com/watch?v=${ID}`))).toBe(ID);
  });

  it.each([
    ["the home page", "https://www.youtube.com/"],
    ["search results", "https://www.youtube.com/results?search_query=zoo"],
    ["an embed", `https://www.youtube.com/embed/${ID}`],
    ["a Short", `https://www.youtube.com/shorts/${ID}`],
    ["YouTube Music", `https://music.youtube.com/watch?v=${ID}`],
    ["a trailing slash on /watch/", `https://www.youtube.com/watch/?v=${ID}`],
    ["plain http", `http://www.youtube.com/watch?v=${ID}`],
    ["a look-alike host", `https://www.youtube.com.evil.test/watch?v=${ID}`],
    ["a malformed video ID", "https://www.youtube.com/watch?v=short"],
    ["an empty youtu.be path", "https://youtu.be/"],
    ["not a URL", "not a url"],
  ])("returns null for %s", (_, href) => {
    expect(getVideoId(href)).toBeNull();
  });
});
