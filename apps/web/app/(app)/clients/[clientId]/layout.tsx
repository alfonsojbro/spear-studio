import type { ReactNode } from "react";
import { ClientAvatar } from "@/components/client-avatar";
import { ClientTabs } from "@/components/client-tabs";
import { Clock } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { getData } from "@/lib/data/server";
import { LANGUAGES, REGIONS } from "@/lib/data";
import { orNotFound } from "../../_lib/not-found";

export default async function ClientLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const data = await getData();
  const client = await orNotFound(data.clients.getClient(clientId));
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: client.timezone,
    hour: "numeric",
    minute: "2-digit",
    weekday: "short",
  }).format(new Date());
  const language = LANGUAGES.find((l) => l.value === client.language)?.label ?? client.language;
  const region = REGIONS.find((r) => r.value === client.region)?.label ?? client.region;

  return (
    <div className="grid gap-5">
      <header className="flex items-start gap-3">
        <ClientAvatar name={client.name} className="size-10 rounded-control text-xs" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-semibold tracking-tight">{client.name}</h1>
            {client.isSample ? <Badge tone="outline">Sample</Badge> : null}
            {client.archivedAt ? <Badge tone="warning">Archived</Badge> : null}
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              <span className="num">{time}</span> local
            </span>
            <span>{language}</span>
            <span>{region}</span>
          </p>
        </div>
      </header>
      <ClientTabs clientId={client.id} />
      <div>{children}</div>
    </div>
  );
}
