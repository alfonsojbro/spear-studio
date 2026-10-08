"use client";

import { useState, useTransition } from "react";
import { setArchivedAction } from "@/app/(app)/clients/[clientId]/settings/actions";
import { Archive, ArrowCounterClockwise } from "@/components/icons";
import { FormMessage } from "@/components/form-message";
import { idleState, type FormState } from "@/components/form-state";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export function ArchiveClient({ clientId, clientName, archived }: { clientId: string; clientName: string; archived: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [state, setState] = useState<FormState>(idleState);

  if (archived) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={pending} onClick={() => start(async () => setState(await setArchivedAction(clientId, false)))}>
          <ArrowCounterClockwise />
          Restore client
        </Button>
        <FormMessage state={state} />
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="danger">
            <Archive />
            Archive client
          </Button>
        </DialogTrigger>
        <DialogContent
          title={`Archive ${clientName}?`}
          description="The client leaves every list. Nothing is deleted, and an owner can restore it from the Clients page."
        >
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              variant="danger"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const result = await setArchivedAction(clientId, true);
                  setState(result);
                  setOpen(false);
                })
              }
            >
              {pending ? "Archiving" : "Archive"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <FormMessage state={state} />
    </div>
  );
}
