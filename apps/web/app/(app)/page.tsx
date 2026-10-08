import type { Metadata } from "next";
import { canManageClients } from "@spear/core";
import { SquaresFour } from "@/components/icons";
import { ClientRoster } from "@/components/client-roster";
import { EmptyState } from "@/components/empty-state";
import { NewClientDialog } from "@/components/new-client-dialog";
import { PageHeader } from "@/components/page-header";
import { getData } from "@/lib/data/server";
import { clientFieldOptions } from "./_lib/client-options";

export const metadata: Metadata = { title: "Overview" };

function Stat({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <div className="bg-surface px-4 py-3.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="num mt-1 text-2xl font-medium tracking-tight">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{note}</p>
    </div>
  );
}

export default async function OverviewPage() {
  const data = await getData();
  const overview = await data.overview.getOverview();
  const canCreate = canManageClients(data.viewer.role);
  const firstName = data.viewer.name?.split(" ")[0];
  const today = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={today}
        title={firstName ? `Good to see you, ${firstName}` : "Overview"}
        description="Every client at a glance. Columns fill in as each module ships."
        actions={canCreate ? <NewClientDialog options={clientFieldOptions()} /> : null}
      />

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-panel border bg-border md:grid-cols-4">
        <Stat label="Active clients" value={overview.totals.clients} note="Excludes archived" />
        <Stat label="Social accounts" value={overview.totals.accounts} note="Added by handle" />
        <Stat label="Waiting for approval" value={overview.totals.pendingApprovals} note="Review ships in P4" />
        <Stat label="Scheduled this week" value={overview.totals.scheduledThisWeek} note="Calendar ships in P5" />
      </div>

      {overview.clients.length === 0 ? (
        <EmptyState
          icon={SquaresFour}
          title={canCreate ? "Add your first client" : "No clients to show"}
          action={canCreate ? <NewClientDialog options={clientFieldOptions()} /> : null}
        >
          {canCreate
            ? "Each client gets its own workspace: research, footage, drafts, approvals and the calendar stay separate from every other client."
            : "You see clients once an owner adds you to one. Ask an owner at Spear Media."}
        </EmptyState>
      ) : (
        <section aria-labelledby="roster-title" className="grid gap-3">
          <div className="flex items-baseline justify-between">
            <h2 id="roster-title" className="text-sm font-semibold">
              Clients
            </h2>
            {overview.clients.some((c) => c.isSample) ? (
              <p className="text-xs text-muted-foreground">Sample clients are local demo data.</p>
            ) : null}
          </div>
          <ClientRoster rows={overview.clients} />
        </section>
      )}
    </div>
  );
}
