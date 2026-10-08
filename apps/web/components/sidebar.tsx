import Link from "next/link";
import { canManageTeam, isAgencyStaff, roleLabel } from "@spear/core";
import type { ClientSummary, Viewer } from "@/lib/data";
import { House, Pulse, SquaresFour, UsersThree } from "@/components/icons";
import { ClientAvatar } from "@/components/client-avatar";
import { NavLink } from "@/components/nav-link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";

export function BrandMark() {
  return (
    <Link href="/" className="flex items-center gap-2 px-2.5 text-sm font-semibold tracking-tight">
      <span aria-hidden className="grid size-5 place-items-center rounded-[5px] bg-brand">
        <span className="h-2.5 w-1 -skew-x-12 rounded-[1px] bg-brand-foreground" />
      </span>
      Spear Studio
    </Link>
  );
}

export function SidebarContent({
  viewer,
  clients,
  devIdentity,
}: {
  viewer: Viewer;
  clients: ClientSummary[];
  devIdentity: boolean;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center px-3">
        <BrandMark />
      </div>

      <nav aria-label="Main" className="grid gap-0.5 px-3">
        <NavLink href="/" exact>
          <House />
          Overview
        </NavLink>
        <NavLink href="/clients" exact>
          <SquaresFour />
          Clients
        </NavLink>
        {canManageTeam(viewer.role) ? (
          <NavLink href="/settings/team">
            <UsersThree />
            Team
          </NavLink>
        ) : null}
        {isAgencyStaff(viewer.role) ? (
          <NavLink href="/settings/system">
            <Pulse />
            System
          </NavLink>
        ) : null}
      </nav>

      <div className="mt-6 flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between px-5 pb-1.5">
          <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Clients</span>
          <span className="num text-[11px] text-muted-foreground">{clients.length}</span>
        </div>
        <nav aria-label="Clients" className="grid min-h-0 gap-0.5 overflow-y-auto px-3 pb-3">
          {clients.length === 0 ? (
            <p className="px-2.5 py-1 text-[13px] text-muted-foreground">No clients yet.</p>
          ) : (
            clients.map((c) => (
              <NavLink key={c.id} href={`/clients/${c.id}/discover`} match={`/clients/${c.id}`}>
                <ClientAvatar name={c.name} />
                <span className="truncate">{c.name}</span>
              </NavLink>
            ))
          )}
        </nav>
      </div>

      <div className="border-t p-3">
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium">{viewer.name ?? viewer.email}</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">{roleLabel(viewer.role)}</span>
              {devIdentity ? <Badge tone="warning">Dev login</Badge> : null}
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
