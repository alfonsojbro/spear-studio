import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AGENCY_ROLES, canManageTeam, roleLabel } from "@spear/core";
import { InviteForm } from "@/components/invite-form";
import { PageHeader } from "@/components/page-header";
import { InviteList, MemberList } from "@/components/team-lists";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { getData } from "@/lib/data/server";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const data = await getData();
  // Owner only. Others get the same 404 as a missing page.
  if (!canManageTeam(data.viewer.role)) notFound();
  const [members, invites, clients] = await Promise.all([
    data.members.listMembers(),
    data.invites.listOpenInvites(),
    data.clients.listClients(),
  ]);
  const roles = AGENCY_ROLES.map((r) => ({ value: r, label: roleLabel(r) }));

  return (
    <div className="grid max-w-3xl gap-6">
      <PageHeader
        title="Team"
        description="Who can open Spear Studio. Staff see every client; freelancers see only the client they are invited to."
      />
      <Panel>
        <PanelHeader title="Invite someone" description="Access starts the first time they sign in with this email." />
        <InviteForm roles={roles} clients={clients.map((c) => ({ value: c.id, label: c.name }))} />
      </Panel>
      <Panel>
        <PanelHeader title="Open invites" />
        <InviteList
          invites={invites.map((i) => ({
            id: i.id,
            email: i.email,
            roleLabel: roleLabel(i.role),
            clientName: i.clientName,
            createdAt: i.createdAt,
          }))}
        />
      </Panel>
      <Panel>
        <PanelHeader title="Members" description="The agency always keeps at least one owner." />
        <MemberList
          roles={roles}
          members={members.map((m) => ({
            id: m.id,
            email: m.email,
            name: m.name,
            role: m.role,
            clients: m.clients.map((c) => c.name),
            isYou: m.id === data.viewer.memberId,
          }))}
        />
      </Panel>
    </div>
  );
}
