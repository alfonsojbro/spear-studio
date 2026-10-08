import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { getPlatformProxy } from "wrangler";
import { createDatabase, type Database } from "@spear/db";
import type { AgencyRole } from "@spear/core";
import { createData } from "@/lib/data";
import { resolveViewer, type Viewer } from "@/lib/data/viewer";

const migration = fileURLToPath(new URL("../../../packages/db/migrations/0001_core.sql", import.meta.url));

/** Splits a migration into statements. Fine for 0001 (no triggers or semicolons in strings). */
function statements(sqlText: string): string[] {
  return sqlText
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(/;\s*(?:\n|$)/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export type TestDb = { db: Database; d1: D1Database; dispose: () => Promise<void> };

/** A fresh, in-memory local D1 (Miniflare via wrangler) with migrations applied. */
export async function createTestDb(): Promise<TestDb> {
  const proxy = await getPlatformProxy<{ DB: D1Database }>({
    configPath: fileURLToPath(new URL("../wrangler.jsonc", import.meta.url)),
    persist: false,
  });
  const d1 = proxy.env.DB;
  await d1.batch(statements(readFileSync(migration, "utf8")).map((s) => d1.prepare(s)));
  return { db: createDatabase(d1), d1, dispose: () => proxy.dispose() };
}

export const AGENCY = "aaaaaaaa-0000-4000-8000-000000000001";
export const OTHER_AGENCY = "aaaaaaaa-0000-4000-8000-000000000002";
export const CLIENT_A = "cccccccc-0000-4000-8000-00000000000a";
export const CLIENT_B = "cccccccc-0000-4000-8000-00000000000b";
export const OTHER_CLIENT = "cccccccc-0000-4000-8000-00000000000c";

export const PEOPLE = {
  owner: { id: "mmmmmmmm-0000-4000-8000-000000000001", email: "owner@test.local", role: "owner" },
  strategist: { id: "mmmmmmmm-0000-4000-8000-000000000002", email: "strategist@test.local", role: "strategist" },
  editor: { id: "mmmmmmmm-0000-4000-8000-000000000003", email: "editor@test.local", role: "editor" },
  freelancer: { id: "mmmmmmmm-0000-4000-8000-000000000004", email: "freelancer@test.local", role: "freelancer" },
  otherOwner: { id: "mmmmmmmm-0000-4000-8000-000000000005", email: "boss@other.local", role: "owner" },
} as const satisfies Record<string, { id: string; email: string; role: AgencyRole }>;

/** Two agencies; agency 1 has clients A and B; the freelancer is on client A only. */
export async function seedFixtures(d1: D1Database): Promise<void> {
  const run = (sql: string, ...params: unknown[]) => d1.prepare(sql).bind(...params);
  const memberSql = "insert into member (id, agency_id, email, role) values (?, ?, ?, ?)";
  const clientSql =
    "insert into client (id, agency_id, name, slug, timezone, language, region) values (?, ?, ?, ?, 'UTC', 'en', 'US')";
  await d1.batch([
    run("insert into agency (id, name, slug) values (?, 'Agency', 'agency')", AGENCY),
    run("insert into agency (id, name, slug) values (?, 'Other', 'other')", OTHER_AGENCY),
    run(memberSql, PEOPLE.owner.id, AGENCY, PEOPLE.owner.email, "owner"),
    run(memberSql, PEOPLE.strategist.id, AGENCY, PEOPLE.strategist.email, "strategist"),
    run(memberSql, PEOPLE.editor.id, AGENCY, PEOPLE.editor.email, "editor"),
    run(memberSql, PEOPLE.freelancer.id, AGENCY, PEOPLE.freelancer.email, "freelancer"),
    run(memberSql, PEOPLE.otherOwner.id, OTHER_AGENCY, PEOPLE.otherOwner.email, "owner"),
    run(clientSql, CLIENT_A, AGENCY, "Client A", "client-a"),
    run(clientSql, CLIENT_B, AGENCY, "Client B", "client-b"),
    run(clientSql, OTHER_CLIENT, OTHER_AGENCY, "Other Client", "other-client"),
    run(
      "insert into client_member (id, client_id, member_id, role) values ('cm-1', ?, ?, 'freelancer')",
      CLIENT_A,
      PEOPLE.freelancer.id,
    ),
    run("insert into social_account (id, client_id, platform, handle) values ('sa-a', ?, 'ig', 'client.a')", CLIENT_A),
    run("insert into social_account (id, client_id, platform, handle) values ('sa-b', ?, 'ig', 'client.b')", CLIENT_B),
  ]);
}

export async function viewerFor(db: Database, email: string): Promise<Viewer> {
  const viewer = await resolveViewer(db, email);
  if (!viewer) throw new Error(`No viewer for ${email}`);
  return viewer;
}

export async function dataFor(db: Database, email: string) {
  return createData(db, await viewerFor(db, email));
}

export const validClient = { name: "New Client", timezone: "America/Managua", language: "es", region: "NI" };
