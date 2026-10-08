import type { ReactNode } from "react";
import type { ClientSummary, Viewer } from "@/lib/data";
import { MobileNav } from "@/components/mobile-nav";
import { BrandMark, SidebarContent } from "@/components/sidebar";

export function AppShell({
  viewer,
  clients,
  devIdentity,
  children,
}: {
  viewer: Viewer;
  clients: ClientSummary[];
  devIdentity: boolean;
  children: ReactNode;
}) {
  const sidebar = <SidebarContent viewer={viewer} clients={clients} devIdentity={devIdentity} />;
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 hidden h-dvh border-r bg-surface lg:block">{sidebar}</aside>
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b bg-surface/90 px-3 backdrop-blur lg:hidden">
          <MobileNav>{sidebar}</MobileNav>
          <BrandMark />
        </header>
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
