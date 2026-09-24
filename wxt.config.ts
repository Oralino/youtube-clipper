import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  hooks: {
    // WXT's quick MV3 content-script reload registers a second copy while Firefox keeps running
    // the cached manifest copy, so edits only showed after a restart. After a file change, reload
    // the whole extension instead. WXT also calls this when the extension starts; that call must
    // stay as it is, or each reload would trigger the next one.
    "server:created": (wxt, server) => {
      const reloadContentScript = server.reloadContentScript;
      let fileChanged = false;
      server.watcher.on("all", () => {
        fileChanged = true;
      });
      server.reloadContentScript = (payload) => {
        if (!fileChanged) return reloadContentScript(payload);
        fileChanged = false;
        wxt.logger.info("Reloading the whole extension");
        server.reloadExtension();
      };
    },
  },
  manifestVersion: 3,
  manifest: {
    name: "YouTube Clips",
    description: "Make clips straight from a YouTube video and share them as a link.",
    browser_specific_settings: {
      gecko: {
        id: "{a9e93662-cd96-4e4d-9406-69f18ca40af8}",
        // Clips live only in the link; nothing is collected or sent anywhere.
        data_collection_permissions: { required: ["none"] },
      },
    },
  },
});
