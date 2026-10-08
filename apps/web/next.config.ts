import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  transpilePackages: ["@spear/core", "@spear/db"],
  poweredByHeader: false,
  typedRoutes: false,
};

export default nextConfig;

// Gives `next dev` the local D1 binding (Miniflare) through getCloudflareContext().
if (process.env.NODE_ENV === "development") {
  void initOpenNextCloudflareForDev();
}
