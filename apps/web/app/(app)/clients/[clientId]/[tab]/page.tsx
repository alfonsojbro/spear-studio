import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findClientTab } from "@/components/client-tabs-config";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { getData } from "@/lib/data/server";
import { orNotFound } from "../../../_lib/not-found";

type Params = Promise<{ clientId: string; tab: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { tab } = await params;
  return { title: findClientTab(tab)?.label ?? "Not found" };
}

export default async function ClientTabPage({ params }: { params: Params }) {
  const { clientId, tab: slug } = await params;
  const tab = findClientTab(slug);
  if (!tab) notFound();
  // Re-check access here too: pages must not rely on the layout alone.
  const data = await getData();
  await orNotFound(data.clients.getClient(clientId));

  return (
    <EmptyState
      icon={tab.Icon}
      title={tab.title}
      aside={
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge tone="brand">{tab.phase}</Badge>
          {tab.next}
        </div>
      }
    >
      {tab.body}
    </EmptyState>
  );
}
