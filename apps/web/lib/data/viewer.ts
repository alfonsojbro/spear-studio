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
    // Every statement re-checks that the invite is still open, inside one D1 batch
    // (a transaction). If a parallel request accepted it first, nothing is inserted.
    try {
      // Raw D1 batch: drizzle's batch() only takes query builders, and these are INSERT ... SELECT.
      const d1 = db.$client;
      await d1.batch([
        d1
          .prepare(
            `insert into member (id, agency_id, email, role, created_by)
             select ?1, agency_id, email, role, created_by from staff_invite
             where id = ?2 and accepted_at is null`,
          )
          .bind(memberId, invite.id),
        d1
          .prepare(
            `insert into client_member (id, client_id, member_id, role, created_by)
             select ?1, client_id, ?2, 'freelancer', created_by from staff_invite
             where id = ?3 and accepted_at is null and client_id is not null
               and exists (select 1 from member where id = ?2)`,
          )
          .bind(crypto.randomUUID(), memberId, invite.id),
        d1
          .prepare(`update staff_invite set accepted_at = ?1, updated_at = ?1 where id = ?2 and accepted_at is null`)
          .bind(now, invite.id),
      ]);
    } catch (error) {
      // The same email was inserted by a parallel request. Fall through and read the row.
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
