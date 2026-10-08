"use client";

import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { List } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, SheetContent } from "@/components/ui/dialog";

/** Phone-width navigation: the sidebar inside a sheet. Closes on navigation. */
export function MobileNav({ children }: { children: ReactNode }) {
  const [openAt, setOpenAt] = useState<string | null>(null);
  const pathname = usePathname();
  const open = openAt === pathname;
  return (
    <Dialog open={open} onOpenChange={(next) => setOpenAt(next ? pathname : null)}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open navigation">
          <List />
        </Button>
      </DialogTrigger>
      <SheetContent title="Navigation">{children}</SheetContent>
    </Dialog>
  );
}
