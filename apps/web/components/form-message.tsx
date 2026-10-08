import { Check, Warning } from "@/components/icons";
import type { FormState } from "@/components/form-state";
import { cn } from "@/components/ui/cn";

export function FormMessage({ state, className }: { state: FormState; className?: string }) {
  if (state.status === "idle" || !state.message) return null;
  const ok = state.status === "ok";
  return (
    <p
      role={ok ? "status" : "alert"}
      className={cn(
        "flex items-center gap-1.5 text-[13px]",
        ok ? "text-success" : "text-danger",
        className,
      )}
    >
      {ok ? <Check className="size-3.5" /> : <Warning className="size-3.5" />}
      {state.message}
    </p>
  );
}
