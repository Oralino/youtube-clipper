export default defineContentScript({
  matches: ["*://www.youtube.com/*", "*://m.youtube.com/*"],
  // YouTube strips the clip hash from the address bar right after load, so read it before its scripts run.
  runAt: "document_start",
  main() {},
});
