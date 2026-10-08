import { defineConfig } from "drizzle-kit";

/**
 * Drizzle is the query layer; SQL migrations in ./migrations are hand-reviewed
 * and applied with `wrangler d1 migrations apply` (see apps/web/wrangler.jsonc).
 * `pnpm --filter @spear/db generate` can draft the next migration from schema.ts;
 * always review and rename it to the NNNN_name.sql pattern before committing.
 */
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/schema.ts",
  out: "./migrations",
});
