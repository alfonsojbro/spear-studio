import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// No incremental cache in P0: every page is dynamic (identity per request).
export default defineCloudflareConfig({});
