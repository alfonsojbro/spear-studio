import { and, asc, eq, ne, or, sql } from "drizzle-orm";
import { isAgencyRole, type AgencyRole } from "@spear/core";
import { client, clientMember, member, type Member } from "@spear/db";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors";
import { assertOwner, type DataContext } from "./scope";

export type MemberWithClients = Member & { clients: { id: string; name: string }[] };

export async function listMembers(ctx: DataContext): Promise<MemberWithClients[]> {
  assertOwner(ctx.viewer);
  const members = await ctx.db
    .select()
    .from(member)
    .where(eq(member.agencyId, ctx.viewer.agencyId))
    .orderBy(asc(member.email));
  const grants = await ctx.db
    .select({ memberId: clientMember.memberId, id: client.id, name: client.name })
    .from(clientMember)
    .innerJoin(client, eq(client.id, clientMember.clientId))
    .where(eq(client.agencyId, ctx.viewer.agencyId));
  return members.map((m) => ({
    ...m,
    clients: grants.filter((g) => g.memberId === m.id).map(({ id, name }) => ({ id, name })),
  }));
}

/** Count of other owners, computed inside the same statement so concurrent changes cannot remove the last owner. */
const otherOwnersExist = (agencyId: string, memberId: string) =>
  sql`(select count(*) from ${member} m2 where m2.agency_id = ${agencyId} and m2.role = 'owner' and m2.id != ${memberId}) > 0`;

export async function updateMemberRole(ctx: DataContext, memberId: string, role: unknown): Promise<void> {
  assertOwner(ctx.viewer);
  if (!isAgencyRole(role)) throw new ValidationError("Pick a valid role.", { role: "Pick a valid role." });
  const target = await ctx.db.query.member.findFirst({
    where: and(eq(member.id, memberId), eq(member.agencyId, ctx.viewer.agencyId)),
  });
  if (!target) throw new NotFoundError("Member");
  const updated = await ctx.db
    .update(member)
    .set({ role: role as AgencyRole })
    .where(
      and(
        eq(member.id, memberId),
        eq(member.agencyId, ctx.viewer.agencyId),
        // Demoting an owner is allowed only while another owner remains.
        role === "owner" ? undefined : or(ne(member.role, "owner"), otherOwnersExist(ctx.viewer.agencyId, memberId)),
      ),
    )
    .returning({ id: member.id });
  if (updated.length === 0) throw new ForbiddenError("The agency needs at least one owner.");
}

export async function removeMember(ctx: DataContext, memberId: string): Promise<void> {
  assertOwner(ctx.viewer);
  const target = await ctx.db.query.member.findFirst({
    where: and(eq(member.id, memberId), eq(member.agencyId, ctx.viewer.agencyId)),
  });
  if (!target) throw new NotFoundError("Member");
  const deleted = await ctx.db
    .delete(member)
    .where(
      and(
        eq(member.id, memberId),
        eq(member.agencyId, ctx.viewer.agencyId),
        or(ne(member.role, "owner"), otherOwnersExist(ctx.viewer.agencyId, memberId)),
      ),
    )
    .returning({ id: member.id });
  if (deleted.length === 0) throw new ForbiddenError("You cannot remove the last owner.");
}
