"use client";

import { useState, useTransition } from "react";
import {
  grantClientAccessAction,
  removeMemberAction,
  revokeClientAccessAction,
  revokeInviteAction,
  updateMemberRoleAction,
} from "@/app/(app)/settings/team/actions";
import { Plus, Trash, X } from "@/components/icons";
import type { Option } from "@/components/client-fields";
import { FormMessage } from "@/components/form-message";
import { idleState, type FormState } from "@/components/form-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";

export type MemberRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isStaff: boolean;
  clients: { id: string; name: string; roleLabel: string }[];
  isYou: boolean;
};
export type InviteRow = { id: string; email: string; roleLabel: string; clientName: string | null; createdAt: string };

function ClientAccess({
  member,
  allClients,
  pending,
  run,
}: {
  member: MemberRow;
  allClients: Option[];
  pending: boolean;
  run: (fn: () => Promise<FormState>) => void;
}) {
  const [choice, setChoice] = useState("");
  const available = allClients.filter((c) => !member.clients.some((g) => g.id === c.value));
  return (
    <div className="flex basis-full flex-wrap items-center gap-1.5 pt-1">
      <span className="text-xs text-muted-foreground">Client access:</span>
      {member.clients.length === 0 ? <span className="text-xs text-muted-foreground">none</span> : null}
      {member.clients.map((c) => (
        <span key={c.id} className="inline-flex items-center gap-1 rounded-full border bg-surface-2 py-0.5 pr-1 pl-2 text-xs">
          {c.name}
          <span className="text-muted-foreground">· {c.roleLabel}</span>
          <button
            type="button"
            aria-label={`Remove ${member.email} from ${c.name}`}
            disabled={pending}
            onClick={() => run(() => revokeClientAccessAction(member.id, c.id))}
            className="grid size-4 place-items-center rounded-full text-muted-foreground hover:bg-hover hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      {available.length > 0 ? (
        <span className="inline-flex items-center gap-1">
          <Select
            aria-label={`Add client access for ${member.email}`}
            className="w-44"
            value={choice}
            onChange={(e) => setChoice(e.target.value)}
            disabled={pending}
          >
            <option value="">Add a client</option>
            {available.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
          <Button
            size="icon"
            variant="secondary"
            aria-label="Grant access"
            disabled={pending || !choice}
            onClick={() => {
              const clientId = choice;
              setChoice("");
              run(() => grantClientAccessAction(member.id, clientId));
            }}
          >
            <Plus />
          </Button>
        </span>
      ) : null}
    </div>
  );
}

export function MemberList({ members, roles, clients }: { members: MemberRow[]; roles: Option[]; clients: Option[] }) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<FormState>(idleState);
  const run = (fn: () => Promise<FormState>) => start(async () => setState(await fn()));
  return (
    <div>
      <ul className="divide-y">
        {members.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
            <div className="min-w-0 basis-full sm:flex-1 sm:basis-auto">
              <p className="flex items-center gap-2 truncate text-sm font-medium">
                {m.name ?? m.email}
                {m.isYou ? <Badge>You</Badge> : null}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {m.name ? m.email : null}
                {m.isStaff ? `${m.name ? " · " : ""}Sees every client` : null}
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
            {m.isStaff ? null : <ClientAccess member={m} allClients={clients} pending={pending} run={run} />}
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
