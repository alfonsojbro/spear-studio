import "server-only";
import { cache } from "react";
import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { resolveViewer, type Viewer } from "@/lib/data/viewer";

/**
 * Who is calling. There is no middleware/proxy (OpenNext does not run Node
 * middleware), so every server component, action and route handler calls this.
 *
 * - development: DEV_USER_EMAIL from .dev.vars (getEnv refuses it elsewhere).
 * - deployed: Cloudflare Access JWT (`Cf-Access-Jwt-Assertion`). Verification
 *   lands in P0b; until then a deployed build grants no access at all.
 */
export const getAuthenticatedEmail = cache(async (): Promise<string | null> => {
  const env = await getEnv();
  if (env.NODE_ENV === "development" && env.DEV_USER_EMAIL) return env.DEV_USER_EMAIL;
  return null;
});

export const getViewer = cache(async (): Promise<Viewer | null> => {
  const email = await getAuthenticatedEmail();
  if (!email) return null;
  return resolveViewer(await getDb(), email);
});
