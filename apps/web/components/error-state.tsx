"use client";

import { useEffect } from "react";
import { ArrowCounterClockwise, Warning } from "@/components/icons";
import { Button } from "@/components/ui/button";

/** Body for every error.tsx boundary. Shows the digest so a report can be matched to logs. */
export function ErrorState({
  error,
  reset,
  title = "This page did not load",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div role="alert" className="flex flex-col items-start gap-4 rounded-panel border border-danger/30 bg-danger-soft/40 px-6 py-8">
      <div className="grid size-10 place-items-center rounded-control bg-danger-soft text-danger">
        <Warning className="size-5" />
      </div>
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Something failed on our side. Try again. If it keeps failing, send this code to the team:{" "}
          <span className="num text-foreground">{error.digest ?? "no code"}</span>
        </p>
      </div>
      <Button onClick={reset}>
        <ArrowCounterClockwise />
        Try again
      </Button>
    </div>
  );
}
