import { and, eq, inArray, sql, type SQL } from "drizzle-orm";
import { canManageClients, canManageTeam } from "@spear/core";
import { client, type Database, type JobMessage } from "@spear/db";
import { ForbiddenError } from "./errors";
import type { Viewer } from "./viewer";

/** Minimal producer interface, so tests can pass a fake queue. */
export type JobsQueue = { send(message: JobMessage): Promise<unknown> };

export type DataContext = { db: Database; viewer: Viewer; jobsQueue?: JobsQueue };

/** SQL condition limiting `client` rows to what the viewer may read. Always use it. */
export function clientReadScope(viewer: Viewer): SQL {
  const agency = eq(client.agencyId, viewer.agencyId);
  if (viewer.clientIds === "all") return agency;
  if (viewer.clientIds.length === 0) return sql`0`;
  return and(agency, inArray(client.id, viewer.clientIds)) as SQL;
}

export function assertCanManageClients(viewer: Viewer): void {
  if (!canManageClients(viewer.role)) {
    throw new ForbiddenError("Only owners, strategists and account managers can change clients.");
  }
}

export function assertOwner(viewer: Viewer): void {
  if (!canManageTeam(viewer.role)) throw new ForbiddenError("Only owners can do this.");
}
