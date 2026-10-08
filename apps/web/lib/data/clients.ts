import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { client, type Client } from "@spear/db";
import { ForbiddenError, isUniqueViolation, NotFoundError, ValidationError } from "./errors";
import { assertCanManageClients, clientReadScope, type DataContext } from "./scope";
import { clientInput, parseInput, slugify } from "./validation";

export type ClientSummary = Client & { accountCount: number };

export async function listClients(
  { db, viewer }: DataContext,
  opts: { includeArchived?: boolean } = {},
): Promise<ClientSummary[]> {
  const where = opts.includeArchived
    ? clientReadScope(viewer)
    : and(clientReadScope(viewer), isNull(client.archivedAt));
  const rows = await db
    .select({
      client,
      // Fully qualified: drizzle renders bare column names inside sql``, which would bind to the subquery table.
      accountCount: sql<number>`(select count(*) from social_account sa where sa.client_id = "client"."id")`,
    })
    .from(client)
    .where(where)
    .orderBy(asc(client.isSample), asc(client.name));
  return rows.map((r) => ({ ...r.client, accountCount: Number(r.accountCount) }));
}

/** Throws NotFoundError when the client does not exist or the viewer may not read it. */
export async function getClient({ db, viewer }: DataContext, clientId: string): Promise<Client> {
  const row = await db.query.client.findFirst({
    where: and(eq(client.id, clientId), clientReadScope(viewer)),
  });
  if (!row) throw new NotFoundError("Client");
  return row;
}

export async function createClient(ctx: DataContext, input: unknown): Promise<Client> {
  assertCanManageClients(ctx.viewer);
  const data = parseInput(clientInput, input);
  const base = slugify(data.name);

  for (let attempt = 1; attempt <= 20; attempt++) {
    const slug = attempt === 1 ? base : `${base}-${attempt}`;
    const id = crypto.randomUUID();
    try {
      const [row] = await ctx.db
        .insert(client)
        .values({ id, agencyId: ctx.viewer.agencyId, slug, createdBy: ctx.viewer.memberId, ...data })
        .returning();
      if (row) return row;
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
    }
  }
  throw new ValidationError("A client with a similar name already exists.", { name: "Pick a different name." });
}

export async function updateClient(ctx: DataContext, clientId: string, input: unknown): Promise<Client> {
  await getClient(ctx, clientId);
  assertCanManageClients(ctx.viewer);
  const data = parseInput(clientInput, input);
  const [row] = await ctx.db
    .update(client)
    .set(data)
    .where(and(eq(client.id, clientId), eq(client.agencyId, ctx.viewer.agencyId)))
    .returning();
  if (!row) throw new NotFoundError("Client");
  return row;
}

export async function archiveClient(ctx: DataContext, clientId: string): Promise<void> {
  await getClient(ctx, clientId);
  if (ctx.viewer.role !== "owner") throw new ForbiddenError("Only owners can archive a client.");
  await ctx.db
    .update(client)
    .set({ archivedAt: new Date().toISOString() })
    .where(and(eq(client.id, clientId), eq(client.agencyId, ctx.viewer.agencyId), isNull(client.archivedAt)));
}

export async function restoreClient(ctx: DataContext, clientId: string): Promise<void> {
  await getClient(ctx, clientId);
  if (ctx.viewer.role !== "owner") throw new ForbiddenError("Only owners can restore a client.");
  await ctx.db
    .update(client)
    .set({ archivedAt: null })
    .where(and(eq(client.id, clientId), eq(client.agencyId, ctx.viewer.agencyId)));
}
