import n from "eslint-plugin-n";
import prettier from "eslint-plugin-prettier";
import globals from "globals";
import eslintPluginJsonc from "eslint-plugin-jsonc";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import pluginVue from "eslint-plugin-vue";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  { ignores: ["!**/.*", "**/node_modules/.*"] },
  // eslint:recommended for all files
  ...compat.extends("eslint:recommended"),
  {
    plugins: {
      n,
      prettier,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest,
        ...globals.node,
      },
    },
  },
  ...eslintPluginJsonc.configs["recommended-with-json"].map((config) => ({
    ...config,
    files: ["**/*.json"],
  })),
  ...eslintPluginJsonc.configs["recommended-with-jsonc"].map((config) => ({
    ...config,
    files: ["**/*.jsonc"],
  })),
  ...eslintPluginJsonc.configs["recommended-with-json5"].map((config) => ({
    ...config,
    files: ["**/*.json5"],
  })),
  // JS/JSX: react/recommended
  ...compat.extends("plugin:react/recommended").map((config) => ({
    ...config,
    files: ["**/*.js", "**/*.mjs", "**/*.cjs", "**/*.jsx"],
  })),
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs", "**/*.jsx"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
          modules: true,
        },
      },
    },
  },
  // TS/TSX: typescript-eslint + n + react + prettier
  ...compat
    .extends(
      "plugin:@typescript-eslint/recommended",
      "plugin:n/recommended",
      "plugin:react/recommended",
      "prettier"
    )
    .map((config) => ({
      ...config,
      files: ["**/*.ts", "**/*.cts", "**/*.mts", "**/*.tsx"],
    })),
  {
    files: ["**/*.ts", "**/*.cts", "**/*.mts", "**/*.tsx"],

    plugins: {
      "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
    },

    settings: {
      react: {
        version: "detect",
      },
    },

    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  // Disable n/* rules: they flag Node.js module resolution as errors in a
  // browser-based Gatsby app where node_modules are not present at lint time.
  {
    files: [
      "**/*.ts",
      "**/*.cts",
      "**/*.mts",
      "**/*.tsx",
      "**/*.js",
      "**/*.mjs",
      "**/*.cjs",
      "**/*.jsx",
    ],
    rules: {
      "n/no-missing-import": "off",
      "n/no-missing-require": "off",
      "n/no-unpublished-import": "off",
      "n/no-unpublished-require": "off",
      "n/no-unsupported-features/node-builtins": "off",
      "n/no-unsupported-features/es-builtins": "off",
      "n/no-unsupported-features/es-syntax": "off",
    },
  },
  ...pluginVue.configs["flat/recommended"],
];
