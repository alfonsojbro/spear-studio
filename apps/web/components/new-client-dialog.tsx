"use client";

import { useActionState, useState } from "react";
import { createClientAction } from "@/app/(app)/clients/actions";
import { Plus } from "@/components/icons";
import { ClientFields, type ClientFieldOptions } from "@/components/client-fields";
import { FormMessage } from "@/components/form-message";
import { idleState } from "@/components/form-state";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const NEW_CLIENT_DEFAULTS = { name: "", timezone: "America/Managua", language: "es", region: "NI" };

export function NewClientDialog({
  options,
  variant = "primary",
}: {
  options: ClientFieldOptions;
  variant?: "primary" | "secondary";
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createClientAction, idleState);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant}>
          <Plus />
          New client
        </Button>
      </DialogTrigger>
      <DialogContent title="New client" description="You can add social handles and brand details on the next screen.">
        <form key={state.at ?? 0} action={action} className="grid gap-5" noValidate>
          <ClientFields
            idPrefix="new-client"
            options={options}
            defaults={{ ...NEW_CLIENT_DEFAULTS, ...state.values }}
            errors={state.fieldErrors}
          />
          <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <FormMessage state={state} />
            <div className="flex justify-end gap-2 sm:ml-auto">
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <SubmitButton pendingLabel="Creating">Create client</SubmitButton>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
