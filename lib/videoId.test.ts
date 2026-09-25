import { describe, expect, it } from "vitest";
import { getVideoPage } from "./videoId.ts";

const ID = "jNQXAC9IVRw";

describe("getVideoPage", () => {
  it.each([
    ["a watch page", `https://www.youtube.com/watch?v=${ID}&list=PL123`],
    ["youtube.com without www", `https://youtube.com/watch?v=${ID}`],
    ["the mobile site", `https://m.youtube.com/watch?v=${ID}&pp=2AEFkAIB`],
    ["a youtu.be link", `https://youtu.be/${ID}?si=abc`],
    ["an uppercase URL", `HTTPS://WWW.YOUTUBE.COM/watch?v=${ID}`],
  ])("reads %s as a watch page", (_, href) => {
    expect(getVideoPage(href)).toEqual({ id: ID, kind: "watch" });
  });

  it.each([
    ["a Short", `https://www.youtube.com/shorts/${ID}`],
    ["a Short with a trailing slash", `https://www.youtube.com/shorts/${ID}/`],
    ["a Short with a share parameter", `https://www.youtube.com/shorts/${ID}?feature=share`],
    ["a Short on the mobile site", `https://m.youtube.com/shorts/${ID}`],
  ])("reads %s", (_, href) => {
    expect(getVideoPage(href)).toEqual({ id: ID, kind: "shorts" });
  });

  it("accepts a URL object", () => {
    expect(getVideoPage(new URL(`https://www.youtube.com/watch?v=${ID}`))).toEqual({
      id: ID,
      kind: "watch",
    });
  });

  it.each([
    ["the home page", "https://www.youtube.com/"],
    ["search results", "https://www.youtube.com/results?search_query=zoo"],
    ["an embed", `https://www.youtube.com/embed/${ID}`],
    ["the Shorts feed", "https://www.youtube.com/shorts"],
    ["a Shorts path with more after the ID", `https://www.youtube.com/shorts/${ID}/extra`],
    ["a malformed Short ID", "https://www.youtube.com/shorts/short"],
    ["YouTube Music", `https://music.youtube.com/watch?v=${ID}`],
    ["a trailing slash on /watch/", `https://www.youtube.com/watch/?v=${ID}`],
    ["plain http", `http://www.youtube.com/watch?v=${ID}`],
    ["a look-alike host", `https://www.youtube.com.evil.test/watch?v=${ID}`],
    ["a malformed video ID", "https://www.youtube.com/watch?v=short"],
    ["an empty youtu.be path", "https://youtu.be/"],
    ["not a URL", "not a url"],
  ])("returns null for %s", (_, href) => {
    expect(getVideoPage(href)).toBeNull();
  });
});
