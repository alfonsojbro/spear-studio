import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { getData } from "@/lib/data/server";
import { getEnv } from "@/lib/env";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const data = await getData();
  const [clients, env] = await Promise.all([data.clients.listClients(), getEnv()]);
  return (
    <AppShell viewer={data.viewer} clients={clients} devIdentity={env.NODE_ENV === "development"}>
      {children}
    </AppShell>
  );
}
