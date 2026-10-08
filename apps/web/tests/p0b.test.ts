import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { JobMessage } from "@spear/db";
import { ForbiddenError, NotFoundError, UnavailableError, ValidationError } from "@/lib/data";
import { resolveViewer } from "@/lib/data/viewer";
import {
  AGENCY,
  CLIENT_A,
  CLIENT_B,
  createTestDb,
  dataFor,
  OTHER_AGENCY,
  OTHER_CLIENT,
  PEOPLE,
  seedFixtures,
  type TestDb,
} from "./helpers";

let t: TestDb;

beforeAll(async () => {
  t = await createTestDb();
});
afterAll(async () => {
  await t?.dispose();
});
beforeEach(async () => {
  await t.d1.batch([t.d1.prepare("delete from staff_invite"), t.d1.prepare("delete from agency")]);
  await seedFixtures(t.d1);
});

function fakeQueue() {
  const sent: JobMessage[] = [];
  return { sent, send: async (m: JobMessage) => void sent.push(m) };
}

describe("jobs (queue producer + heartbeat)", () => {
  it("staff enqueue a system.ping stamped with their agency and member id", async () => {
    const queue = fakeQueue();
    const editor = await dataFor(t.db, PEOPLE.editor.email, { jobsQueue: queue });
    const { requestedAt } = await editor.jobs.requestPing();
    expect(queue.sent).toEqual([
      { type: "system.ping", agencyId: AGENCY, requestedBy: PEOPLE.editor.id, requestedAt },
    ]);
  });

  it("freelancers cannot enqueue or read heartbeats", async () => {
    const queue = fakeQueue();
    const freelancer = await dataFor(t.db, PEOPLE.freelancer.email, { jobsQueue: queue });
    await expect(freelancer.jobs.requestPing()).rejects.toBeInstanceOf(ForbiddenError);
    await expect(freelancer.jobs.getLastHeartbeat()).rejects.toBeInstanceOf(ForbiddenError);
    expect(queue.sent).toHaveLength(0);
  });

  it("a missing queue binding is a clear UnavailableError, not a crash", async () => {
    const owner = await dataFor(t.db, PEOPLE.owner.email);
    await expect(owner.jobs.requestPing()).rejects.toBeInstanceOf(UnavailableError);
  });

  it("heartbeats are read per agency, newest first", async () => {
    const insert = (id: string, agency: string, ranAt: string) =>
      t.d1
        .prepare(
          "insert into job_heartbeat (id, agency_id, job_name, instance_id, requested_at, ran_at, worker_id) values (?, ?, 'system.ping', ?, ?, ?, 'test')",
        )
        .bind(id, agency, `inst-${id}`, ranAt, ranAt);
    await t.d1.batch([
      insert("h1", AGENCY, "2026-10-08T10:00:00.000Z"),
      insert("h2", AGENCY, "2026-10-08T11:00:00.000Z"),
      insert("h3", OTHER_AGENCY, "2026-10-08T12:00:00.000Z"),
    ]);
    const owner = await dataFor(t.db, PEOPLE.owner.email);
    expect((await owner.jobs.getLastHeartbeat())?.id).toBe("h2");
    const other = await dataFor(t.db, PEOPLE.otherOwner.email);
    expect((await other.jobs.getLastHeartbeat())?.id).toBe("h3");
  });

  it("a heartbeat is written once per workflow instance", async () => {
    const write = () =>
      t.d1
        .prepare(
          "insert into job_heartbeat (id, agency_id, job_name, instance_id, requested_at, worker_id) values (?, ?, 'system.ping', 'same', '2026-10-08T00:00:00Z', 'test') on conflict (instance_id) do nothing",
        )
        .bind(crypto.randomUUID(), AGENCY)
        .run();
    await write();
    await write();
    const { results } = await t.d1.prepare("select count(*) as n from job_heartbeat where instance_id = 'same'").all<{ n: number }>();
    expect(results[0]?.n).toBe(1);
  });
});

describe("review follow-ups", () => {
  it("restoreClient brings an archived client back, owner only", async () => {
    const owner = await dataFor(t.db, PEOPLE.owner.email);
    await owner.clients.archiveClient(CLIENT_A);
    const strategist = await dataFor(t.db, PEOPLE.strategist.email);
    await expect(strategist.clients.restoreClient(CLIENT_A)).rejects.toBeInstanceOf(ForbiddenError);
    await owner.clients.restoreClient(CLIENT_A);
    expect((await owner.clients.listClients()).map((c) => c.id).sort()).toEqual([CLIENT_A, CLIENT_B].sort());
  });

  it("owners cannot revoke invites, change roles or archive clients of another agency", async () => {
    const other = await dataFor(t.db, PEOPLE.otherOwner.email);
    const invite = await other.invites.createInvite({ email: "x@other.co", role: "editor" });
    const owner = await dataFor(t.db, PEOPLE.owner.email);
    await expect(owner.invites.revokeInvite(invite.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(owner.members.updateMemberRole(PEOPLE.otherOwner.id, "editor")).rejects.toBeInstanceOf(NotFoundError);
    await expect(owner.clients.archiveClient(OTHER_CLIENT)).rejects.toBeInstanceOf(NotFoundError);
    await expect(owner.clients.restoreClient(OTHER_CLIENT)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("a freelancer can read the social accounts of their own client", async () => {
    const freelancer = await dataFor(t.db, PEOPLE.freelancer.email);
    const accounts = await freelancer.socialAccounts.listSocialAccounts(CLIENT_A);
    expect(accounts.map((a) => a.handle)).toEqual(["client.a"]);
  });

  it("member and open-invite checks are scoped to the agency", async () => {
    const other = await dataFor(t.db, PEOPLE.otherOwner.email);
    // The editor belongs to agency 1; agency 2 must not learn that.
    await expect(other.invites.createInvite({ email: PEOPLE.editor.email, role: "editor" })).resolves.toBeTruthy();
    // An open invite in agency 2 does not block agency 1 from inviting the same email.
    await other.invites.createInvite({ email: "shared@x.co", role: "editor" });
    const owner = await dataFor(t.db, PEOPLE.owner.email);
    await expect(owner.invites.createInvite({ email: "shared@x.co", role: "editor" })).resolves.toBeTruthy();
    // Still unique inside one agency.
    await expect(owner.invites.createInvite({ email: "shared@x.co", role: "strategist" })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it("emails are trimmed and lowercased before validation", async () => {
    const owner = await dataFor(t.db, PEOPLE.owner.email);
    const invite = await owner.invites.createInvite({ email: "  Mixed.Case@Example.COM ", role: "editor" });
    expect(invite.email).toBe("mixed.case@example.com");
  });

  it("concurrent first visits accept an invite once and create one member", async () => {
    const owner = await dataFor(t.db, PEOPLE.owner.email);
    await owner.invites.createInvite({ email: "race@x.co", role: "freelancer", clientId: CLIENT_B });
    const [a, b] = await Promise.all([resolveViewer(t.db, "race@x.co"), resolveViewer(t.db, "race@x.co")]);
    expect(a?.memberId).toBe(b?.memberId);
    const { results } = await t.d1
      .prepare("select (select count(*) from member where email = 'race@x.co') as m, (select count(*) from client_member cm join member mm on mm.id = cm.member_id where mm.email = 'race@x.co') as g")
      .all<{ m: number; g: number }>();
    expect(results[0]).toEqual({ m: 1, g: 1 });
  });

  it("an invite revoked before acceptance creates no member", async () => {
    // Simulates the race: the invite is read, then revoked, then the batch runs.
    const owner = await dataFor(t.db, PEOPLE.owner.email);
    const invite = await owner.invites.createInvite({ email: "late@x.co", role: "editor" });
    await t.d1.prepare("update staff_invite set accepted_at = '2026-01-01T00:00:00Z' where id = ?").bind(invite.id).run();
    expect(await resolveViewer(t.db, "late@x.co")).toBeNull();
  });
});

describe("client access for existing members (team page)", () => {
  it("owner grants and revokes a client for a freelancer", async () => {
    const owner = await dataFor(t.db, PEOPLE.owner.email);
    await owner.members.grantClientAccess(PEOPLE.freelancer.id, CLIENT_B);
    expect((await resolveViewer(t.db, PEOPLE.freelancer.email))?.clientIds).toEqual(expect.arrayContaining([CLIENT_A, CLIENT_B]));
    await expect(owner.members.grantClientAccess(PEOPLE.freelancer.id, CLIENT_B)).rejects.toBeInstanceOf(ValidationError);
    await owner.members.revokeClientAccess(PEOPLE.freelancer.id, CLIENT_A);
    expect((await resolveViewer(t.db, PEOPLE.freelancer.email))?.clientIds).toEqual([CLIENT_B]);
  });

  it("supports client roles and rejects unknown ones", async () => {
    const owner = await dataFor(t.db, PEOPLE.owner.email);
    await owner.members.grantClientAccess(PEOPLE.freelancer.id, CLIENT_B, "client_viewer");
    await expect(owner.members.grantClientAccess(PEOPLE.freelancer.id, CLIENT_B, "admin")).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it("is owner only, rejects staff targets and other agencies' clients or members", async () => {
    const strategist = await dataFor(t.db, PEOPLE.strategist.email);
    await expect(strategist.members.grantClientAccess(PEOPLE.freelancer.id, CLIENT_B)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    const owner = await dataFor(t.db, PEOPLE.owner.email);
    await expect(owner.members.grantClientAccess(PEOPLE.editor.id, CLIENT_B)).rejects.toBeInstanceOf(ValidationError);
    await expect(owner.members.grantClientAccess(PEOPLE.freelancer.id, OTHER_CLIENT)).rejects.toBeInstanceOf(NotFoundError);
    await expect(owner.members.grantClientAccess(PEOPLE.otherOwner.id, CLIENT_B)).rejects.toBeInstanceOf(NotFoundError);
    await expect(owner.members.revokeClientAccess(PEOPLE.freelancer.id, CLIENT_B)).rejects.toBeInstanceOf(NotFoundError);
  });
});
