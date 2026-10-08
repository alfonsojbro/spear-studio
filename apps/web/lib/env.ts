import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { connection } from "next/server";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("production"),
  DEV_USER_EMAIL: z.email().optional(),
  CF_ACCESS_TEAM_DOMAIN: z.string().optional(),
  CF_ACCESS_AUD: z.string().optional(),
});

export type AppEnv = z.infer<typeof schema>;

export class EnvError extends Error {
  override name = "EnvError";
}

/**
 * Reads and validates env at request time (never at build time, so `next build`
 * needs no values). Worker vars come from the Cloudflare context; Next also
 * loads process.env. Throws loudly on invalid or unsafe config.
 */
export async function getEnv(): Promise<AppEnv> {
  // Request-time only: opts every caller out of static prerendering, so builds never need env or bindings.
  await connection();
  const { env: cf } = await getCloudflareContext({ async: true });
  const cfVars = cf as unknown as Record<string, unknown>;
  const pick = (key: string) => {
    const value = cfVars[key] ?? process.env[key];
    return typeof value === "string" && value.length > 0 ? value : undefined;
  };
  const parsed = schema.safeParse({
    // NODE_ENV comes from Next only: a .dev.vars file must never flip a deployed Worker into dev mode.
    NODE_ENV: process.env.NODE_ENV,
    DEV_USER_EMAIL: pick("DEV_USER_EMAIL"),
    CF_ACCESS_TEAM_DOMAIN: pick("CF_ACCESS_TEAM_DOMAIN"),
    CF_ACCESS_AUD: pick("CF_ACCESS_AUD"),
  });
  if (!parsed.success) {
    throw new EnvError(`Invalid environment: ${z.prettifyError(parsed.error)}`);
  }
  const env = parsed.data;
  if (env.DEV_USER_EMAIL && env.NODE_ENV !== "development") {
    throw new EnvError("DEV_USER_EMAIL is set outside development. Remove it from the deployed Worker.");
  }
  return env;
}
