import { desc, eq } from "drizzle-orm";
import { isAgencyStaff } from "@spear/core";
import { jobHeartbeat, type JobHeartbeat, type JobMessage } from "@spear/db";
import { ForbiddenError } from "./errors";
import type { DataContext } from "./scope";

function assertStaff(ctx: DataContext): void {
  if (!isAgencyStaff(ctx.viewer.role)) throw new ForbiddenError("Only agency staff can run system jobs.");
}

/** Puts a system.ping on the jobs queue. The jobs worker turns it into a Workflow run. */
export async function requestPing(ctx: DataContext): Promise<{ requestedAt: string }> {
  assertStaff(ctx);
  if (!ctx.jobsQueue) throw new Error("JOBS_QUEUE binding is missing. Check wrangler.jsonc.");
  const message: JobMessage = {
    type: "system.ping",
    agencyId: ctx.viewer.agencyId,
    requestedBy: ctx.viewer.memberId,
    requestedAt: new Date().toISOString(),
  };
  await ctx.jobsQueue.send(message);
  return { requestedAt: message.requestedAt };
}

/** Latest heartbeat for the viewer's agency, or null when none ran yet. */
export async function getLastHeartbeat(ctx: DataContext): Promise<JobHeartbeat | null> {
  assertStaff(ctx);
  const row = await ctx.db.query.jobHeartbeat.findFirst({
    where: eq(jobHeartbeat.agencyId, ctx.viewer.agencyId),
    orderBy: desc(jobHeartbeat.ranAt),
  });
  return row ?? null;
}
