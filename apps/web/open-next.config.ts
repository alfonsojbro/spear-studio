import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// No incremental cache in P0: every page is dynamic (identity per request).
const config = {
  ...defineCloudflareConfig({}),
  // OpenNext runs this (in standalone mode). `build` itself calls OpenNext, so it must not be the default `pnpm build`.
  buildCommand: "pnpm run build:next",
};

export default config;
