import { cn } from "@/components/ui/cn";

/** Monogram for a client. Neutral by design: the accent colour is reserved for actions and state. */
export function ClientAvatar({ name, className }: { name: string; className?: string }) {
  const initials =
    name
      .split(/[\s&]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?";
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-5 shrink-0 place-items-center rounded-[5px] border bg-surface-2 text-[9px] font-semibold tracking-wide text-muted-foreground",
        className,
      )}
    >
      {initials}
    </span>
  );
}
