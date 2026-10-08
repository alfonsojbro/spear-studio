import { listClients, type ClientSummary } from "./clients";
import type { DataContext } from "./scope";

export type ClientStatus = ClientSummary & {
  /** Filled by P4 (review). Always 0 until then. */
  pendingApprovals: number;
  /** Filled by P5 (schedule). Always 0 until then. */
  scheduledThisWeek: number;
  /** Filled by P1 (discover). null means "not tracked yet". */
  newOutliers: number | null;
};

export type Overview = {
  clients: ClientStatus[];
  totals: { clients: number; accounts: number; pendingApprovals: number; scheduledThisWeek: number };
};

export async function getOverview(ctx: DataContext): Promise<Overview> {
  const clients = (await listClients(ctx)).map((c) => ({
    ...c,
    pendingApprovals: 0,
    scheduledThisWeek: 0,
    newOutliers: null,
  }));
  return {
    clients,
    totals: {
      clients: clients.length,
      accounts: clients.reduce((sum, c) => sum + c.accountCount, 0),
      pendingApprovals: 0,
      scheduledThisWeek: 0,
    },
  };
}
