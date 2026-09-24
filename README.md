# YouTube Clips
A Firefox extension that lets you make clips straight from a YouTube video and share them as a link.

> **Status:** in planning; nothing is built yet. Progress is tracked in [TASKS.md](TASKS.md).

## Features
Planned for the first version:
- A **Clip** button in the YouTube player.
- Set a start and end time, typed or taken from the current playback position.
- Preview the clip before sharing.
- Copy a clip link. Friends with the extension see just that part; without it, the video plays from the
  clip's start.
- Copy an embed link, which plays inline in desktop Discord (not in a browser or Discord mobile).
- Save the clip as a video file (MP4 where the browser supports it) to share anywhere, including phones.

No accounts and no servers: a clip's link carries everything about it.

## Run from source
Requirements: [Node.js](https://nodejs.org) 24 and Firefox.

```bash
npm install
npm run dev
```

`npm run dev` opens Firefox with the extension loaded and reloads it on every change.

## Build
```bash
npm run build
```

The build goes to `.output/`. To try it in your normal Firefox, open `about:debugging` →
**This Firefox** → **Load Temporary Add-on**, and pick the `manifest.json` in the build folder.

## Usage
1. Open a video on youtube.com.
2. Click **Clip** in the player controls (or the extension's toolbar icon).
3. Set the start and end, preview it, then **Copy link** and send it.

## Tech
[WXT](https://wxt.dev), TypeScript, React 19, plain CSS, Vitest. Manifest V3 for Firefox.

## License
**TODO (owner)**: Choose a license before the repo goes public. Until then, all rights reserved.
