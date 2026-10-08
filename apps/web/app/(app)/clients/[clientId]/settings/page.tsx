import type { Metadata } from "next";
import { canManageClients } from "@spear/core";
import { ArchiveClient } from "@/components/archive-client";
import { ClientSettingsForm } from "@/components/client-settings-form";
import { Check } from "@/components/icons";
import { SocialAccountsPanel } from "@/components/social-accounts-panel";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { getData } from "@/lib/data/server";
import { clientFieldOptions } from "../../../_lib/client-options";
import { orNotFound } from "../../../_lib/not-found";

export const metadata: Metadata = { title: "Client settings" };

export default async function ClientSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const [{ clientId }, { created }] = await Promise.all([params, searchParams]);
  const data = await getData();
  const client = await orNotFound(data.clients.getClient(clientId));
  const accounts = await data.socialAccounts.listSocialAccounts(clientId);
  const canEdit = canManageClients(data.viewer.role);
  const isOwner = data.viewer.role === "owner";

  return (
    <div className="grid max-w-3xl gap-5">
      {created ? (
        <p role="status" className="flex items-center gap-2 rounded-panel border border-success/30 bg-success-soft px-4 py-3 text-sm text-success">
          <Check className="size-4" />
          Client created. Add their social handles next.
        </p>
      ) : null}

      <Panel>
        <PanelHeader title="Basics" description="Name, posting time zone and the language content is written in." />
        <ClientSettingsForm
          clientId={client.id}
          options={clientFieldOptions()}
          defaults={{ name: client.name, timezone: client.timezone, language: client.language, region: client.region }}
          canEdit={canEdit}
        />
      </Panel>

      <Panel>
        <PanelHeader
          title="Social accounts"
          description="Handles only for now. Connecting accounts for publishing arrives with the calendar in P5."
        />
        <SocialAccountsPanel
          clientId={client.id}
          accounts={accounts.map(({ id, platform, handle, status }) => ({ id, platform, handle, status }))}
          canEdit={canEdit}
        />
      </Panel>

      {isOwner ? (
        <Panel>
          <PanelHeader
            title={client.archivedAt ? "Archived" : "Archive"}
            description={
              client.archivedAt
                ? "This client is hidden from lists. Restore it to work on it again."
                : "Hide this client from every list. Nothing is deleted."
            }
          />
          <div className="p-4">
            <ArchiveClient clientId={client.id} clientName={client.name} archived={!!client.archivedAt} />
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
