import { and, desc, eq, isNull } from "drizzle-orm";
import { inviteNeedsClient } from "@spear/core";
import { client, member, staffInvite, type StaffInvite } from "@spear/db";
import { isUniqueViolation, NotFoundError, ValidationError } from "./errors";
import { assertOwner, type DataContext } from "./scope";
import { inviteInput, parseInput } from "./validation";

export type InviteWithClient = StaffInvite & { clientName: string | null };

export async function listOpenInvites(ctx: DataContext): Promise<InviteWithClient[]> {
  assertOwner(ctx.viewer);
  const rows = await ctx.db
    .select({ invite: staffInvite, clientName: client.name })
    .from(staffInvite)
    .leftJoin(client, eq(client.id, staffInvite.clientId))
    .where(and(eq(staffInvite.agencyId, ctx.viewer.agencyId), isNull(staffInvite.acceptedAt)))
    .orderBy(desc(staffInvite.createdAt));
  return rows.map((r) => ({ ...r.invite, clientName: r.clientName }));
}

export async function createInvite(ctx: DataContext, input: unknown): Promise<StaffInvite> {
  assertOwner(ctx.viewer);
  const data = parseInput(inviteInput, input);

  if (inviteNeedsClient(data.role) && !data.clientId) {
    throw new ValidationError("Freelancers work on one client.", { clientId: "Pick the client." });
  }
  const clientId = inviteNeedsClient(data.role) ? data.clientId : undefined;
  if (clientId) {
    const owned = await ctx.db.query.client.findFirst({
      where: and(eq(client.id, clientId), eq(client.agencyId, ctx.viewer.agencyId)),
    });
    if (!owned) throw new ValidationError("Pick a client of this agency.", { clientId: "Unknown client." });
  }
  const existing = await ctx.db.query.member.findFirst({ where: eq(member.email, data.email) });
  if (existing) throw new ValidationError("This person is already a member.", { email: "Already a member." });

  try {
    const [row] = await ctx.db
      .insert(staffInvite)
      .values({
        id: crypto.randomUUID(),
        agencyId: ctx.viewer.agencyId,
        email: data.email,
        role: data.role,
        clientId: clientId ?? null,
        createdBy: ctx.viewer.memberId,
      })
      .returning();
    if (!row) throw new Error("Insert returned no row");
    return row;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ValidationError("An invite for this email is already open.", { email: "Already invited." });
    }
    throw error;
  }
}

export async function revokeInvite(ctx: DataContext, inviteId: string): Promise<void> {
  assertOwner(ctx.viewer);
  const deleted = await ctx.db
    .delete(staffInvite)
    .where(
      and(eq(staffInvite.id, inviteId), eq(staffInvite.agencyId, ctx.viewer.agencyId), isNull(staffInvite.acceptedAt)),
    )
    .returning({ id: staffInvite.id });
  if (deleted.length === 0) throw new NotFoundError("Invite");
}
