"use client";

import { useActionState, useTransition, useState } from "react";
import type { Platform } from "@spear/db/schema";
import { addSocialAccountAction, removeSocialAccountAction } from "@/app/(app)/clients/[clientId]/settings/actions";
import { InstagramLogo, Trash } from "@/components/icons";
import { FormMessage } from "@/components/form-message";
import { idleState, type FormState } from "@/components/form-state";
import { PLATFORM_META, PlatformIcon } from "@/components/platform";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";

export type AccountRow = { id: string; platform: Platform; handle: string; status: string };

const STATUS_LABEL: Record<string, { label: string; tone: "neutral" | "success" | "warning" | "danger" }> = {
  manual: { label: "Handle only", tone: "neutral" },
  connected: { label: "Connected", tone: "success" },
  needs_reconnect: { label: "Reconnect", tone: "warning" },
  disconnected: { label: "Disconnected", tone: "danger" },
};

function RemoveButton({ clientId, account, onDone }: { clientId: string; account: AccountRow; onDone: (s: FormState) => void }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Remove ${account.handle}`}
      disabled={pending}
      onClick={() => start(async () => onDone(await removeSocialAccountAction(clientId, account.id)))}
    >
      <Trash />
    </Button>
  );
}

export function SocialAccountsPanel({
  clientId,
  accounts,
  canEdit,
}: {
  clientId: string;
  accounts: AccountRow[];
  canEdit: boolean;
}) {
  const [state, action] = useActionState(addSocialAccountAction.bind(null, clientId), idleState);
  const [removeState, setRemoveState] = useState<FormState>(idleState);

  return (
    <div>
      {accounts.length === 0 ? (
        <div className="flex items-center gap-3 px-4 py-6 text-sm text-muted-foreground">
          <InstagramLogo className="size-5" />
          No handles yet. Add the client&apos;s Instagram, TikTok and YouTube handles below.
        </div>
      ) : (
        <ul className="divide-y">
          {accounts.map((a) => {
            const status = STATUS_LABEL[a.status] ?? { label: a.status, tone: "neutral" as const };
            return (
              <li key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="grid size-8 place-items-center rounded-control border bg-surface-2">
                  <PlatformIcon platform={a.platform} />
                </span>
                <div className="min-w-0 flex-1">
                  <a
                    href={PLATFORM_META[a.platform].url(a.handle)}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-sm font-medium hover:underline"
                  >
                    @{a.handle}
                  </a>
                  <p className="text-xs text-muted-foreground">{PLATFORM_META[a.platform].label}</p>
                </div>
                <Badge tone={status.tone}>{status.label}</Badge>
                {canEdit ? <RemoveButton clientId={clientId} account={a} onDone={setRemoveState} /> : null}
              </li>
            );
          })}
        </ul>
      )}
      <FormMessage state={removeState} className="px-4 pb-2" />
      {canEdit ? (
        <form key={state.at ?? 0} action={action} className="grid gap-3 border-t p-4 sm:grid-cols-[160px_1fr_auto] sm:items-end" noValidate>
          <Field id="sa-platform" label="Platform" error={state.fieldErrors?.platform}>
            <Select id="sa-platform" name="platform" defaultValue={state.status === "error" ? (state.values?.platform ?? "ig") : "ig"}>
              <option value="ig">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
            </Select>
          </Field>
          <Field id="sa-handle" label="Handle" error={state.fieldErrors?.handle}>
            <Input id="sa-handle" name="handle" defaultValue={state.status === "error" ? state.values?.handle : ""} placeholder="@handle" autoComplete="off" aria-invalid={!!state.fieldErrors?.handle} />
          </Field>
          <SubmitButton variant="secondary" pendingLabel="Adding">
            Add handle
          </SubmitButton>
          <FormMessage state={state} className="sm:col-span-3" />
        </form>
      ) : null}
    </div>
  );
}
