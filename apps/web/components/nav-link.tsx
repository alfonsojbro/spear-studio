"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/components/ui/cn";

/** Sidebar link with active state. `exact` for "/" so it does not match every route. */
export function NavLink({
  href,
  match,
  exact,
  children,
  className,
}: {
  href: string;
  match?: string;
  exact?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const base = match ?? href;
  const active = exact ? pathname === base : pathname === base || pathname.startsWith(`${base}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex h-8 items-center gap-2.5 rounded-control px-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-hover hover:text-foreground [&_svg]:size-4 [&_svg]:shrink-0",
        active && "bg-surface-2 font-medium text-foreground",
        className,
      )}
    >
      {children}
    </Link>
  );
}
