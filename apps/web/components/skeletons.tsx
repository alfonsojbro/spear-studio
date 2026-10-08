import { Skeleton } from "@/components/ui/skeleton";

export function HeaderSkeleton() {
  return (
    <div className="grid gap-2">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-6 w-56" />
      <Skeleton className="h-4 w-80 max-w-full" />
    </div>
  );
}

export function RosterSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-panel border bg-surface" aria-busy aria-label="Loading clients">
      <div className="h-8 border-b bg-surface-2/60" />
      <div className="divide-y">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="size-8" />
            <div className="grid flex-1 gap-1.5">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="hidden h-3.5 w-16 md:block" />
            <Skeleton className="hidden h-3.5 w-16 md:block" />
            <Skeleton className="hidden h-3.5 w-10 md:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-panel border bg-border md:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="grid gap-2 bg-surface px-4 py-3.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-10" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      ))}
    </div>
  );
}

export function FormPanelSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="rounded-panel border bg-surface">
      <div className="border-b px-4 py-3">
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-2">
        {Array.from({ length: fields }, (_, i) => (
          <div key={i} className="grid gap-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
