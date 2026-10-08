/**
 * Scoped data layer. The ONLY way app code reads or writes tenant data.
 * Every function takes the viewer and enforces client access in SQL.
 * Server code gets a bound instance through getData() in lib/data/server.ts.
 */
import type { Database } from "@spear/db";
import * as clients from "./clients";
import * as invites from "./invites";
import * as members from "./members";
import * as overview from "./overview";
import type { DataContext } from "./scope";
import * as socialAccounts from "./social-accounts";
import type { Viewer } from "./viewer";

export * from "./errors";
export type { Viewer } from "./viewer";
export type { ClientSummary } from "./clients";
export type { MemberWithClients } from "./members";
export type { InviteWithClient } from "./invites";
export type { ClientStatus, Overview } from "./overview";
export { LANGUAGES, REGIONS } from "./validation";

type Bound<F> = F extends (ctx: DataContext, ...args: infer A) => infer R ? (...args: A) => R : never;
function bind<T extends Record<string, unknown>>(ctx: DataContext, mod: T) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(mod)) {
    if (typeof value === "function") out[key] = (...args: unknown[]) => value(ctx, ...args);
  }
  return out as { [K in keyof T as T[K] extends (ctx: DataContext, ...args: never[]) => unknown ? K : never]: Bound<T[K]> };
}

export function createData(db: Database, viewer: Viewer) {
  const ctx: DataContext = { db, viewer };
  return {
    viewer,
    clients: bind(ctx, clients),
    socialAccounts: bind(ctx, socialAccounts),
    members: bind(ctx, members),
    invites: bind(ctx, invites),
    overview: bind(ctx, overview),
  };
}

export type Data = ReturnType<typeof createData>;
