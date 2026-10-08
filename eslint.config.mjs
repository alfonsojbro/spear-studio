import js from "@eslint/js";
import nextVitals from "eslint-config-next/core-web-vitals";
import globals from "globals";
import tseslint from "typescript-eslint";

// Patterns are relative to this file (repo root), wherever eslint is run from.
const webFiles = ["apps/web/**/*.{ts,tsx,js,jsx,mjs}"];

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/.open-next/**",
      "**/.wrangler/**",
      "**/dist/**",
      "**/.turbo/**",
      "**/cloudflare-env.d.ts",
      "**/next-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Next.js rules (react, hooks, a11y, next) only for the web app.
  ...nextVitals.map((config) => ({ ...config, files: webFiles })),
  {
    files: webFiles,
    settings: { react: { version: "19.3" } },
    rules: {
      // App Router only; there is no pages/ directory.
      "@next/next/no-html-link-for-pages": "off",
    },
  },
  {
    languageOptions: { globals: { ...globals.node } },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser: tseslint.parser },
    rules: {
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
    },
  },
  {
    // The scoped data layer is the only door to tenant data (see CLAUDE.md).
    files: ["apps/web/app/**/*.{ts,tsx}", "apps/web/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "@/lib/db", message: "Use getData() from @/lib/data/server. Raw DB access is not allowed here." },
            { name: "@spear/db", allowTypeImports: true, message: "Use getData(); only types may be imported here." },
            { name: "drizzle-orm", message: "Queries live in lib/data/*." },
          ],
          patterns: [
            { group: ["@/lib/data/*", "!@/lib/data/server"], allowTypeImports: true, message: "Import from @/lib/data or @/lib/data/server." },
            { group: ["@spear/db/*"], allowTypeImports: true, message: "Use getData(); only types may be imported here." },
          ],
        },
      ],
    },
  },
);
