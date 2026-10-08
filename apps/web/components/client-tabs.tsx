"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { CLIENT_TABS, SETTINGS_TAB } from "@/components/client-tabs-config";
import { cn } from "@/components/ui/cn";

export function ClientTabs({ clientId }: { clientId: string }) {
  const segment = useSelectedLayoutSegment();
  const tabs = [...CLIENT_TABS, SETTINGS_TAB];
  return (
    <nav aria-label="Client workspace" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
      <ul className="flex min-w-max gap-1 border-b">
        {tabs.map(({ slug, label, Icon }) => {
          const active = segment === slug;
          return (
            <li key={slug}>
              <Link
                href={`/clients/${clientId}/${slug}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative -mb-px flex h-10 items-center gap-1.5 border-b-2 border-transparent px-2.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground [&_svg]:size-4",
                  active && "border-brand font-medium text-foreground",
                )}
              >
                <Icon />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
