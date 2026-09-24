# YouTube Clips
A Firefox extension that lets you clip part of a YouTube video and save it as an MP4 to share anywhere.

> **Status:** in planning; nothing is built yet. Progress is tracked in [TASKS.md](TASKS.md).

## Features
Planned for the first version:
- A **Clip** button in the YouTube player.
- Set a start and end time, typed or taken from the current playback position.
- Preview the clip before saving.
- Save the clip as an MP4 at the quality you're watching, to share anywhere, including phones.

No accounts and no servers: everything happens in your browser.

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
3. Set the start and end, preview it, then **Save video** and share the MP4.

## Tech
[WXT](https://wxt.dev), TypeScript, React 19, plain CSS, Vitest. Manifest V3 for Firefox.

## License
**TODO (owner)**: Choose a license before the repo goes public. Until then, all rights reserved.
