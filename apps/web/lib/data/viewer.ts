import { and, eq, isNull } from "drizzle-orm";
import { isAgencyStaff, type AgencyRole } from "@spear/core";
import { clientMember, member, staffInvite, type Database } from "@spear/db";
import { isUniqueViolation } from "./errors";

export type Viewer = {
  memberId: string;
  agencyId: string;
  email: string;
  name: string | null;
  role: AgencyRole;
  /** "all" for agency staff; otherwise the client ids granted through client_member. */
  clientIds: string[] | "all";
};

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Maps an authenticated email (Cloudflare Access, or the dev stub) to a Viewer.
 * First visit with an open staff_invite creates the member (+ client_member) row.
 * No member and no invite returns null: the caller shows "No access".
 */
export async function resolveViewer(db: Database, rawEmail: string): Promise<Viewer | null> {
  const email = normaliseEmail(rawEmail);
  if (!email) return null;

  let row = await db.query.member.findFirst({ where: eq(member.email, email) });

  if (!row) {
    const invite = await db.query.staffInvite.findFirst({
      where: and(eq(staffInvite.email, email), isNull(staffInvite.acceptedAt)),
    });
    if (!invite) return null;

    const memberId = crypto.randomUUID();
    const now = new Date().toISOString();
    try {
      const insertMember = db.insert(member).values({
        id: memberId,
        agencyId: invite.agencyId,
        email,
        role: invite.role,
        createdBy: invite.createdBy,
      });
      const accept = db
        .update(staffInvite)
        .set({ acceptedAt: now })
        .where(and(eq(staffInvite.id, invite.id), isNull(staffInvite.acceptedAt)));
      if (invite.clientId) {
        await db.batch([
          insertMember,
          db.insert(clientMember).values({
            id: crypto.randomUUID(),
            clientId: invite.clientId,
            memberId,
            role: "freelancer",
            createdBy: invite.createdBy,
          }),
          accept,
        ]);
      } else {
        await db.batch([insertMember, accept]);
      }
    } catch (error) {
      // A parallel first request accepted the invite already. Fall through and read the row.
      if (!isUniqueViolation(error)) throw error;
    }
    row = await db.query.member.findFirst({ where: eq(member.email, email) });
    if (!row) return null;
  }

  let clientIds: Viewer["clientIds"] = "all";
  if (!isAgencyStaff(row.role)) {
    const grants = await db
      .select({ clientId: clientMember.clientId })
      .from(clientMember)
      .where(eq(clientMember.memberId, row.id));
    clientIds = grants.map((g) => g.clientId);
  }

  return {
    memberId: row.id,
    agencyId: row.agencyId,
    email: row.email,
    name: row.name,
    role: row.role,
    clientIds,
  };
}
