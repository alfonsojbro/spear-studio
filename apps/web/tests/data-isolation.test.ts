import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createData, ForbiddenError, NotFoundError, ValidationError } from "@/lib/data";
import { resolveViewer } from "@/lib/data/viewer";
import {
  AGENCY,
  CLIENT_A,
  CLIENT_B,
  createTestDb,
  dataFor,
  OTHER_CLIENT,
  PEOPLE,
  seedFixtures,
  validClient,
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
  // Fresh rows per test: cascades clear dependants.
  await t.d1.batch([t.d1.prepare("delete from staff_invite"), t.d1.prepare("delete from agency")]);
  await seedFixtures(t.d1);
});

const ids = (rows: { id: string }[]) => rows.map((r) => r.id).sort();

describe("reading clients", () => {
  it("owner sees every client of their agency and nothing from another agency", async () => {
    const data = await dataFor(t.db, PEOPLE.owner.email);
    expect(ids(await data.clients.listClients())).toEqual([CLIENT_A, CLIENT_B].sort());
    await expect(data.clients.getClient(OTHER_CLIENT)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("editor sees every client of the agency", async () => {
    const data = await dataFor(t.db, PEOPLE.editor.email);
    expect(ids(await data.clients.listClients())).toEqual([CLIENT_A, CLIENT_B].sort());
  });

  it("freelancer sees only their client and gets not-found on others", async () => {
    const data = await dataFor(t.db, PEOPLE.freelancer.email);
    expect(data.viewer.clientIds).toEqual([CLIENT_A]);
    expect(ids(await data.clients.listClients())).toEqual([CLIENT_A]);
    await expect(data.clients.getClient(CLIENT_B)).rejects.toBeInstanceOf(NotFoundError);
    await expect(data.socialAccounts.listSocialAccounts(CLIENT_B)).rejects.toBeInstanceOf(NotFoundError);
    const overview = await data.overview.getOverview();
    expect(overview.clients.map((c) => c.id)).toEqual([CLIENT_A]);
    expect(overview.totals.accounts).toBe(1);
  });

  it("freelancer cannot write to their own client or any other", async () => {
    const data = await dataFor(t.db, PEOPLE.freelancer.email);
    await expect(data.clients.updateClient(CLIENT_A, validClient)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      data.socialAccounts.addSocialAccount(CLIENT_A, { platform: "tiktok", handle: "x" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    // Another client answers not-found, not forbidden, so ids do not leak.
    await expect(data.clients.updateClient(CLIENT_B, validClient)).rejects.toBeInstanceOf(NotFoundError);
    await expect(data.socialAccounts.removeSocialAccount(CLIENT_B, "sa-b")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("a person with no member row and no invite gets no viewer at all", async () => {
    expect(await resolveViewer(t.db, "stranger@nowhere.local")).toBeNull();
  });

  it("a removed member loses access on the next request", async () => {
    const owner = await dataFor(t.db, PEOPLE.owner.email);
    await owner.members.removeMember(PEOPLE.editor.id);
    expect(await resolveViewer(t.db, PEOPLE.editor.email)).toBeNull();
  });

  it("a viewer with an empty grant list sees nothing", async () => {
    const owner = await dataFor(t.db, PEOPLE.owner.email);
    const data = createData(t.db, { ...owner.viewer, role: "freelancer", clientIds: [] });
    expect(await data.clients.listClients()).toEqual([]);
    await expect(data.clients.getClient(CLIENT_A)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("writing clients", () => {
  it("strategist and owner can create; editor cannot", async () => {
    const strategist = await dataFor(t.db, PEOPLE.strategist.email);
    const created = await strategist.clients.createClient(validClient);
    expect(created.agencyId).toBe(AGENCY);
    expect(created.slug).toBe("new-client");

    const owner = await dataFor(t.db, PEOPLE.owner.email);
    const second = await owner.clients.createClient(validClient);
    expect(second.slug).toBe("new-client-2");

    const editor = await dataFor(t.db, PEOPLE.editor.email);
    await expect(editor.clients.createClient(validClient)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(editor.clients.updateClient(CLIENT_A, validClient)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("rejects invalid client input with field errors", async () => {
    const owner = await dataFor(t.db, PEOPLE.owner.email);
    const error = await owner.clients
      .createClient({ name: "x", timezone: "Mars/Base", language: "xx", region: "ZZ" })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ValidationError);
    expect(Object.keys((error as ValidationError).fieldErrors).sort()).toEqual(["language", "name", "region", "timezone"]);
  });

  it("archive is owner only", async () => {
    const strategist = await dataFor(t.db, PEOPLE.strategist.email);
    await expect(strategist.clients.archiveClient(CLIENT_A)).rejects.toBeInstanceOf(ForbiddenError);

    const owner = await dataFor(t.db, PEOPLE.owner.email);
    await owner.clients.archiveClient(CLIENT_A);
    expect(ids(await owner.clients.listClients())).toEqual([CLIENT_B]);
    expect(ids(await owner.clients.listClients({ includeArchived: true }))).toEqual([CLIENT_A, CLIENT_B].sort());
  });

  it("social accounts: managers add and remove, duplicates are rejected", async () => {
    const am = await dataFor(t.db, PEOPLE.strategist.email);
    const added = await am.socialAccounts.addSocialAccount(CLIENT_B, { platform: "tiktok", handle: "@client.b" });
    expect(added.handle).toBe("client.b");
    await expect(
      am.socialAccounts.addSocialAccount(CLIENT_B, { platform: "tiktok", handle: "client.b" }),
    ).rejects.toBeInstanceOf(ValidationError);
    // Removing with the wrong client id is not-found, even for a real account id.
    await expect(am.socialAccounts.removeSocialAccount(CLIENT_A, added.id)).rejects.toBeInstanceOf(NotFoundError);
    await am.socialAccounts.removeSocialAccount(CLIENT_B, added.id);
  });
});

describe("members and invites", () => {
  it("only owners list members or invite", async () => {
    const editor = await dataFor(t.db, PEOPLE.editor.email);
    await expect(editor.members.listMembers()).rejects.toBeInstanceOf(ForbiddenError);
    await expect(editor.invites.createInvite({ email: "a@b.co", role: "editor" })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    const owner = await dataFor(t.db, PEOPLE.owner.email);
    const members = await owner.members.listMembers();
    expect(members).toHaveLength(4);
    expect(members.find((m) => m.id === PEOPLE.freelancer.id)?.clients.map((c) => c.id)).toEqual([CLIENT_A]);
  });

  it("the last owner cannot be removed or demoted", async () => {
    const owner = await dataFor(t.db, PEOPLE.owner.email);
    await expect(owner.members.removeMember(PEOPLE.owner.id)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(owner.members.updateMemberRole(PEOPLE.owner.id, "editor")).rejects.toBeInstanceOf(ForbiddenError);

    await owner.members.updateMemberRole(PEOPLE.strategist.id, "owner");
    await owner.members.removeMember(PEOPLE.owner.id);
    expect(await resolveViewer(t.db, PEOPLE.owner.email)).toBeNull();
  });

  it("owners cannot touch members of another agency", async () => {
    const owner = await dataFor(t.db, PEOPLE.owner.email);
    await expect(owner.members.removeMember(PEOPLE.otherOwner.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("a freelancer invite needs a client of this agency and grants only that client on first visit", async () => {
    const owner = await dataFor(t.db, PEOPLE.owner.email);
    await expect(owner.invites.createInvite({ email: "new@x.co", role: "freelancer" })).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(
      owner.invites.createInvite({ email: "new@x.co", role: "freelancer", clientId: OTHER_CLIENT }),
    ).rejects.toBeInstanceOf(ValidationError);

    await owner.invites.createInvite({ email: "New@X.co", role: "freelancer", clientId: CLIENT_B });
    await expect(owner.invites.createInvite({ email: "new@x.co", role: "editor" })).rejects.toBeInstanceOf(
      ValidationError,
    );

    const viewer = await resolveViewer(t.db, "NEW@x.co");
    expect(viewer?.role).toBe("freelancer");
    expect(viewer?.clientIds).toEqual([CLIENT_B]);
    expect(await owner.invites.listOpenInvites()).toHaveLength(0);
  });

  it("a staff invite becomes a staff member that sees all clients", async () => {
    const owner = await dataFor(t.db, PEOPLE.owner.email);
    await owner.invites.createInvite({ email: "am@x.co", role: "account_manager" });
    const viewer = await resolveViewer(t.db, "am@x.co");
    expect(viewer?.clientIds).toBe("all");
    expect(viewer?.agencyId).toBe(AGENCY);
  });

  it("revoked invites grant nothing", async () => {
    const owner = await dataFor(t.db, PEOPLE.owner.email);
    const invite = await owner.invites.createInvite({ email: "gone@x.co", role: "editor" });
    await owner.invites.revokeInvite(invite.id);
    expect(await resolveViewer(t.db, "gone@x.co")).toBeNull();
  });
});
