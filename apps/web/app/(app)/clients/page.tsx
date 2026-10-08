import type { Metadata } from "next";
import { canManageClients } from "@spear/core";
import { Archive, SquaresFour } from "@/components/icons";
import { ClientRoster } from "@/components/client-roster";
import { EmptyState } from "@/components/empty-state";
import { NewClientDialog } from "@/components/new-client-dialog";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { getData } from "@/lib/data/server";
import { clientFieldOptions } from "../_lib/client-options";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage() {
  const data = await getData();
  const all = await data.clients.listClients({ includeArchived: true });
  const active = all.filter((c) => !c.archivedAt);
  const archived = all.filter((c) => c.archivedAt);
  const canCreate = canManageClients(data.viewer.role);
  const asRows = (list: typeof all) =>
    list.map((c) => ({ ...c, pendingApprovals: 0, scheduledThisWeek: 0, newOutliers: null }));

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Clients"
        description={
          data.viewer.clientIds === "all"
            ? "Every client of Spear Media. Each one is a separate workspace."
            : "The clients you are assigned to."
        }
        actions={canCreate ? <NewClientDialog options={clientFieldOptions()} /> : null}
      />
      {active.length === 0 ? (
        <EmptyState
          icon={SquaresFour}
          title={canCreate ? "No clients yet" : "No clients assigned"}
          action={canCreate ? <NewClientDialog options={clientFieldOptions()} variant="secondary" /> : null}
        >
          {canCreate
            ? "Create a client with its name, time zone and content language. Add social handles right after."
            : "An owner assigns you to clients. Until then this list stays empty."}
        </EmptyState>
      ) : (
        <ClientRoster rows={asRows(active)} />
      )}
      {archived.length > 0 ? (
        <section className="grid gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Archive className="size-4" />
            Archived
            <Badge>{archived.length}</Badge>
          </h2>
          <div className="opacity-70">
            <ClientRoster rows={asRows(archived)} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
