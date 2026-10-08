import Link from "next/link";
import type { ClientStatus } from "@/lib/data";
import { CaretRight } from "@/components/icons";
import { ClientAvatar } from "@/components/client-avatar";
import { PlatformIcon } from "@/components/platform";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/cn";

function localTime(tz: string, now: Date) {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(now);
}

function Metric({ value, label, muted }: { value: number | null; label: string; muted?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 md:block md:text-right">
      <span className="text-xs text-muted-foreground md:hidden">{label}</span>
      {value === null ? (
        <span className="text-xs text-muted-foreground">{muted}</span>
      ) : (
        <span className={cn("num text-sm", value === 0 && "text-muted-foreground")}>{value}</span>
      )}
    </div>
  );
}

const cols =
  "md:grid md:grid-cols-[minmax(0,1fr)_96px_80px_80px_112px_16px] md:items-center md:gap-4 xl:grid-cols-[minmax(0,1fr)_150px_110px_88px_88px_120px_16px]";

/** Dense client list: one row per client with per-module status. Stacks into cards at phone width. */
export function ClientRoster({ rows }: { rows: ClientStatus[] }) {
  const now = new Date();
  return (
    <div className="overflow-hidden rounded-panel border bg-surface">
      <div className={cn("hidden border-b bg-surface-2/60 px-4 py-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase", cols)}>
        <span>Client</span>
        <span className="md:hidden xl:block">Local time</span>
        <span>Accounts</span>
        <span className="text-right">To approve</span>
        <span className="text-right">This week</span>
        <span className="text-right">New outliers</span>
        <span />
      </div>
      <ul className="divide-y">
        {rows.map((c) => (
          <li key={c.id}>
            <Link
              href={`/clients/${c.id}/discover`}
              className={cn("group grid gap-3 px-4 py-3 transition-colors hover:bg-hover/60", cols)}
            >
              <div className="flex min-w-0 items-center gap-3">
                <ClientAvatar name={c.name} className="size-8 rounded-control text-[11px]" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{c.name}</span>
                    {c.isSample ? <Badge tone="outline">Sample</Badge> : null}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {typeof c.brandKit.niche === "string" ? `${c.brandKit.niche} · ` : ""}
                    {c.language.toUpperCase()} · {c.region}
                  </p>
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-2 md:hidden xl:block">
                <span className="text-xs text-muted-foreground md:hidden">Local time</span>
                <span className="text-[13px]">
                  <span className="num">{localTime(c.timezone, now)}</span>
                  <span className="ml-1.5 text-xs text-muted-foreground">{c.timezone.split("/").pop()?.replaceAll("_", " ")}</span>
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 md:justify-start">
                <span className="text-xs text-muted-foreground md:hidden">Accounts</span>
                {c.accountCount === 0 ? (
                  <span className="text-xs text-muted-foreground">None added</span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      {c.platforms.map((p) => (
                        <PlatformIcon key={p} platform={p} className="size-3.5" />
                      ))}
                    </span>
                    <span className="num text-sm">{c.accountCount}</span>
                  </span>
                )}
              </div>
              <Metric value={c.pendingApprovals} label="To approve" />
              <Metric value={c.scheduledThisWeek} label="Scheduled this week" />
              <Metric value={c.newOutliers} label="New outliers" muted="Not tracked yet" />
              <CaretRight className="hidden size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 md:block" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
