import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  transpilePackages: ["@spear/core", "@spear/db"],
  poweredByHeader: false,
  typedRoutes: false,
  // Next 16.4 writes an AGENTS.md on dev start; the repo keeps its own CLAUDE.md instead.
  agentRules: false,
  devIndicators: { position: "bottom-right" },
};

export default nextConfig;

// Gives `next dev` the local D1 binding (Miniflare) through getCloudflareContext().
if (process.env.NODE_ENV === "development") {
  void initOpenNextCloudflareForDev();
}
