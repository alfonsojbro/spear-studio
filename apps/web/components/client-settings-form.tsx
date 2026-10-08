"use client";

import { useActionState } from "react";
import { updateClientAction } from "@/app/(app)/clients/[clientId]/settings/actions";
import { ClientFields, type ClientFieldOptions, type ClientFieldValues } from "@/components/client-fields";
import { FormMessage } from "@/components/form-message";
import { idleState } from "@/components/form-state";
import { SubmitButton } from "@/components/submit-button";

export function ClientSettingsForm({
  clientId,
  options,
  defaults,
  canEdit,
}: {
  clientId: string;
  options: ClientFieldOptions;
  defaults: ClientFieldValues;
  canEdit: boolean;
}) {
  const [state, action] = useActionState(updateClientAction.bind(null, clientId), idleState);
  return (
    <form key={state.at ?? 0} action={action} className="grid gap-5 p-4" noValidate>
      <ClientFields idPrefix="client" options={options} defaults={state.status === "error" ? { ...defaults, ...state.values } : defaults} errors={state.fieldErrors} disabled={!canEdit} />
      {canEdit ? (
        <div className="flex items-center justify-end gap-3">
          <FormMessage state={state} className="mr-auto" />
          <SubmitButton>Save changes</SubmitButton>
        </div>
      ) : (
        <p className="text-[13px] text-muted-foreground">Only owners, strategists and account managers can edit client details.</p>
      )}
    </form>
  );
}
