"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/components/form-state";
import { createInviteAction } from "@/app/(app)/settings/team/actions";
import { EnvelopeSimple } from "@/components/icons";
import type { Option } from "@/components/client-fields";
import { FormMessage } from "@/components/form-message";
import { idleState } from "@/components/form-state";
import { SubmitButton } from "@/components/submit-button";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";

type Props = { roles: Option[]; clients: Option[] };

export function InviteForm(props: Props) {
  const [state, action] = useActionState(createInviteAction, idleState);
  // Remount after each submit: a success starts clean, an error keeps the echoed values.
  return <InviteFormBody key={state.at ?? 0} {...props} state={state} action={action} />;
}

function InviteFormBody({
  roles,
  clients,
  state,
  action,
}: Props & { state: FormState; action: (formData: FormData) => void }) {
  const [role, setRole] = useState(state.status === "error" ? (state.values?.role ?? "editor") : "editor");
  const needsClient = role === "freelancer";

  return (
    <form action={action} className="grid gap-4 p-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
        <Field id="invite-email" label="Email" error={state.fieldErrors?.email}>
          <Input
            id="invite-email"
            name="email"
            type="email"
            defaultValue={state.status === "error" ? state.values?.email : ""}
            placeholder="name@spearmedia.com"
            autoComplete="off"
            aria-invalid={!!state.fieldErrors?.email}
          />
        </Field>
        <Field id="invite-role" label="Role" error={state.fieldErrors?.role}>
          <Select id="invite-role" name="role" value={role} onChange={(e) => setRole(e.target.value)}>
            {roles.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {needsClient ? (
        <Field
          id="invite-client"
          label="Client"
          hint="Freelancers only see this one client."
          error={state.fieldErrors?.clientId}
        >
          <Select id="invite-client" name="clientId" defaultValue={state.status === "error" ? (state.values?.clientId ?? "") : ""} aria-invalid={!!state.fieldErrors?.clientId}>
            <option value="" disabled>
              Pick a client
            </option>
            {clients.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          They get access the first time they open Spear Studio with this email.
        </p>
        <SubmitButton pendingLabel="Saving">
          <EnvelopeSimple />
          Save invite
        </SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
