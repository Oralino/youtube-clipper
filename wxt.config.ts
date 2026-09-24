import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
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
