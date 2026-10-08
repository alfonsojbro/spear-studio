"use client";

import { useState, useTransition } from "react";
import { removeMemberAction, revokeInviteAction, updateMemberRoleAction } from "@/app/(app)/settings/team/actions";
import { Trash, X } from "@/components/icons";
import type { Option } from "@/components/client-fields";
import { FormMessage } from "@/components/form-message";
import { idleState, type FormState } from "@/components/form-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";

export type MemberRow = { id: string; email: string; name: string | null; role: string; clients: string[]; isYou: boolean };
export type InviteRow = { id: string; email: string; roleLabel: string; clientName: string | null; createdAt: string };

export function MemberList({ members, roles }: { members: MemberRow[]; roles: Option[] }) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<FormState>(idleState);
  return (
    <div>
      <ul className="divide-y">
        {members.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:flex-nowrap">
            <div className="min-w-0 basis-full sm:flex-1 sm:basis-auto">
              <p className="flex items-center gap-2 truncate text-sm font-medium">
                {m.name ?? m.email}
                {m.isYou ? <Badge>You</Badge> : null}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {m.name ? m.email : null}
                {m.clients.length > 0 ? `${m.name ? " · " : ""}${m.clients.join(", ")}` : null}
              </p>
            </div>
            <Select
              key={`${m.role}-${state.at ?? 0}`}
              aria-label={`Role for ${m.email}`}
              className="flex-1 sm:w-44 sm:flex-none"
              defaultValue={m.role}
              disabled={pending}
              onChange={(e) => {
                const role = e.target.value;
                start(async () => setState(await updateMemberRoleAction(m.id, role)));
              }}
            >
              {roles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remove ${m.email}`}
              disabled={pending}
              onClick={() => start(async () => setState(await removeMemberAction(m.id)))}
            >
              <Trash />
            </Button>
          </li>
        ))}
      </ul>
      <FormMessage state={state} className="px-4 pb-3" />
    </div>
  );
}

export function InviteList({ invites }: { invites: InviteRow[] }) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<FormState>(idleState);
  if (invites.length === 0) {
    return <p className="px-4 py-5 text-sm text-muted-foreground">No open invites. Invites you save appear here until the person signs in.</p>;
  }
  return (
    <div>
      <ul className="divide-y">
        {invites.map((i) => (
          <li key={i.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{i.email}</p>
              <p className="truncate text-xs text-muted-foreground">
                {i.roleLabel}
                {i.clientName ? ` · ${i.clientName}` : ""} · invited <span className="num">{i.createdAt.slice(0, 10)}</span>
              </p>
            </div>
            <Badge tone="warning">Pending</Badge>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Revoke invite for ${i.email}`}
              disabled={pending}
              onClick={() => start(async () => setState(await revokeInviteAction(i.id)))}
            >
              <X />
            </Button>
          </li>
        ))}
      </ul>
      <FormMessage state={state} className="px-4 pb-3" />
    </div>
  );
}
