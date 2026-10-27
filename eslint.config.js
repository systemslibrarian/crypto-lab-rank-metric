import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["coverage/**", "dist/**", "node_modules/**", "test-results/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: [
      "e2e/**/*.ts",
      "scripts/**/*.mjs",
      "playwright.config.ts",
      "vite.config.ts",
      "vitest.config.ts",
    ],
    languageOptions: {
      globals: globals.node,
    },
  },
  eslintConfigPrettier,
);
