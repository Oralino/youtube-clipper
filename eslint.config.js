import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import { defineConfig } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";
import autoImports from "./.wxt/eslint-auto-imports.mjs";

export default defineConfig(
  { ignores: [".output/", ".wxt/"] },
  js.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat["recommended-latest"],
  autoImports,
  {
    languageOptions: {
      globals: globals.browser,
    },
  },
  prettier,
);
