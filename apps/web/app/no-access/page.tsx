import type { Metadata } from "next";
import { getAuthenticatedEmail, getViewer } from "@/lib/identity";
import { redirect } from "next/navigation";
import { LockSimple } from "@/components/icons";

export const metadata: Metadata = { title: "No access" };

export default async function NoAccessPage() {
  if (await getViewer()) redirect("/");
  const email = await getAuthenticatedEmail();
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="flex max-w-sm flex-col items-start gap-4">
        <div className="grid size-10 place-items-center rounded-control border bg-surface-2 text-muted-foreground">
          <LockSimple className="size-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">You do not have access yet</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {email ? (
              <>
                You are signed in as <span className="font-medium text-foreground">{email}</span>, but this email has no
                Spear Studio membership or open invite.
              </>
            ) : (
              <>We could not confirm who you are. Open Spear Studio through the company sign-in link.</>
            )}{" "}
            Ask an owner at Spear Media to invite you from Team settings.
          </p>
        </div>
      </div>
    </main>
  );
}
