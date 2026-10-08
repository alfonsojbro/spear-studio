import type { ComponentProps } from "react";
import { CaretDown } from "@/components/icons";
import { cn } from "./cn";

export const controlClass =
  "h-9 w-full min-w-0 rounded-control border border-input bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors hover:border-muted-foreground/40 focus-visible:border-brand focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50 aria-invalid:border-danger";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(controlClass, className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className={cn("relative", className)}>
      <select className={cn(controlClass, "appearance-none pr-8")} {...props}>
        {children}
      </select>
      <CaretDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}
