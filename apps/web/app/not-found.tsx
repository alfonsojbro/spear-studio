import Link from "next/link";
import { Compass } from "@/components/icons";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-[70dvh] place-items-center px-4">
      <div className="flex max-w-sm flex-col items-start gap-4">
        <div className="grid size-10 place-items-center rounded-control border bg-surface-2 text-muted-foreground">
          <Compass className="size-5" />
        </div>
        <div>
          <p className="num text-xs text-muted-foreground">404</p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight">This page does not exist</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The link may be wrong, or the page belongs to a client you do not have access to.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/">Go to overview</Link>
        </Button>
      </div>
    </main>
  );
}
