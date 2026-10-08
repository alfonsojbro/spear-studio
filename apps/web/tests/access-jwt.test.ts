import { beforeAll, describe, expect, it } from "vitest";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWTVerifyGetKey } from "jose";
import { accessIssuer, verifyAccessJwt } from "@/lib/identity";

const TEAM = "spearmedia.cloudflareaccess.com";
const AUD = "test-aud-tag";

let privateKey: CryptoKey;
let jwks: JWTVerifyGetKey;
let otherKey: CryptoKey;

beforeAll(async () => {
  const pair = await generateKeyPair("RS256");
  privateKey = pair.privateKey;
  const jwk = { ...(await exportJWK(pair.publicKey)), kid: "k1", alg: "RS256" };
  jwks = createLocalJWKSet({ keys: [jwk] });
  otherKey = (await generateKeyPair("RS256")).privateKey;
});

async function sign(claims: Record<string, unknown>, opts: { key?: CryptoKey; iss?: string; aud?: string; exp?: string } = {}) {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "RS256", kid: "k1" })
    .setIssuer(opts.iss ?? `https://${TEAM}`)
    .setAudience(opts.aud ?? AUD)
    .setIssuedAt()
    .setExpirationTime(opts.exp ?? "5m")
    .sign(opts.key ?? privateKey);
}

const verify = (token: string | null) => verifyAccessJwt(token, { teamDomain: TEAM, audience: AUD, jwks });

describe("Cloudflare Access JWT", () => {
  it("accepts a valid token and returns the lowercased email", async () => {
    expect(await verify(await sign({ email: "Owner@SpearMedia.com", sub: "u1" }))).toBe("owner@spearmedia.com");
  });

  it("rejects wrong audience, wrong issuer, bad signature and expired tokens", async () => {
    expect(await verify(await sign({ email: "a@b.co" }, { aud: "another-app" }))).toBeNull();
    expect(await verify(await sign({ email: "a@b.co" }, { iss: "https://evil.cloudflareaccess.com" }))).toBeNull();
    expect(await verify(await sign({ email: "a@b.co" }, { key: otherKey }))).toBeNull();
    expect(await verify(await sign({ email: "a@b.co" }, { exp: "-10m" }))).toBeNull();
  });

  it("rejects missing tokens, garbage and tokens without an email (service tokens)", async () => {
    expect(await verify(null)).toBeNull();
    expect(await verify("not.a.jwt")).toBeNull();
    expect(await verify(await sign({ common_name: "service-token-id" }))).toBeNull();
  });

  it("refuses to verify without team domain or audience configured", async () => {
    const token = await sign({ email: "a@b.co" });
    expect(await verifyAccessJwt(token, { teamDomain: "", audience: AUD, jwks })).toBeNull();
    expect(await verifyAccessJwt(token, { teamDomain: TEAM, audience: "", jwks })).toBeNull();
  });

  it("normalises the team domain to the issuer URL", () => {
    expect(accessIssuer("spearmedia")).toBe("https://spearmedia.cloudflareaccess.com");
    expect(accessIssuer("spearmedia.cloudflareaccess.com")).toBe("https://spearmedia.cloudflareaccess.com");
    expect(accessIssuer("https://spearmedia.cloudflareaccess.com/")).toBe("https://spearmedia.cloudflareaccess.com");
  });
});
