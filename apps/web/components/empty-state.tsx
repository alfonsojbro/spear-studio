import type { ReactNode } from "react";
import type { Icon } from "@/components/icons";
import { cn } from "@/components/ui/cn";

export function EmptyState({
  icon: IconCmp,
  title,
  children,
  action,
  aside,
  className,
}: {
  icon: Icon;
  title: string;
  children: ReactNode;
  action?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-start gap-4 rounded-panel border border-dashed px-6 py-10 sm:px-10", className)}>
      <div className="grid size-10 place-items-center rounded-control border bg-surface-2 text-muted-foreground">
        <IconCmp className="size-5" />
      </div>
      <div className="max-w-prose">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <div className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{children}</div>
      </div>
      {action}
      {aside}
    </div>
  );
}
