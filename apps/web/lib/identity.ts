import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";
import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { resolveViewer, type Viewer } from "@/lib/data/viewer";

/**
 * Who is calling. There is no middleware/proxy (OpenNext does not run Node
 * middleware), so every server component, action and route handler calls this.
 *
 * - development: DEV_USER_EMAIL from .dev.vars (getEnv refuses it elsewhere).
 * - deployed: Cloudflare Access puts a signed JWT in `Cf-Access-Jwt-Assertion`.
 *   We verify signature (team JWKS), issuer and audience before trusting the email.
 *   Without CF_ACCESS_TEAM_DOMAIN and CF_ACCESS_AUD nobody gets in.
 */

export const ACCESS_JWT_HEADER = "cf-access-jwt-assertion";

/** "myteam" | "myteam.cloudflareaccess.com" | "https://myteam.cloudflareaccess.com/" -> "https://myteam.cloudflareaccess.com" */
export function accessIssuer(teamDomain: string): string {
  let host = teamDomain.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  if (!host.includes(".")) host = `${host}.cloudflareaccess.com`;
  return `https://${host}`;
}

const jwksCache = new Map<string, JWTVerifyGetKey>();
function teamJwks(issuer: string): JWTVerifyGetKey {
  let jwks = jwksCache.get(issuer);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
    jwksCache.set(issuer, jwks);
  }
  return jwks;
}

/**
 * Verifies a Cloudflare Access application token and returns the user's email,
 * or null when the token is invalid, expired, for another app, or has no email
 * (service tokens). `jwks` is injectable for tests.
 */
export async function verifyAccessJwt(
  token: string | null | undefined,
  opts: { teamDomain: string; audience: string; jwks?: JWTVerifyGetKey },
): Promise<string | null> {
  if (!token || !opts.teamDomain || !opts.audience) return null;
  const issuer = accessIssuer(opts.teamDomain);
  try {
    const { payload } = await jwtVerify(token, opts.jwks ?? teamJwks(issuer), {
      issuer,
      audience: opts.audience,
      algorithms: ["RS256"],
      clockTolerance: 30,
    });
    const email = payload.email;
    return typeof email === "string" && email.includes("@") ? email.trim().toLowerCase() : null;
  } catch (error) {
    console.warn(JSON.stringify({ level: "warn", msg: "access jwt rejected", reason: (error as Error).name }));
    return null;
  }
}

export const getAuthenticatedEmail = cache(async (): Promise<string | null> => {
  const env = await getEnv();
  if (env.NODE_ENV === "development" && env.DEV_USER_EMAIL) return env.DEV_USER_EMAIL;
  if (!env.CF_ACCESS_TEAM_DOMAIN || !env.CF_ACCESS_AUD) return null;
  const token = (await headers()).get(ACCESS_JWT_HEADER);
  return verifyAccessJwt(token, { teamDomain: env.CF_ACCESS_TEAM_DOMAIN, audience: env.CF_ACCESS_AUD });
});

export const getViewer = cache(async (): Promise<Viewer | null> => {
  const email = await getAuthenticatedEmail();
  if (!email) return null;
  return resolveViewer(await getDb(), email);
});
