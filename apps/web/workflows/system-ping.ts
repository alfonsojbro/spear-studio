import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import type { JobMessage } from "@spear/db/schema";

export type SystemPingParams = JobMessage;

type Env = { DB: D1Database; WORKER_ID?: string };

/**
 * system-ping: proves the Queue -> Workflow -> D1 path. Writes one job_heartbeat row.
 * The insert is idempotent on the Workflow instance id, so a retried step never writes twice.
 */
export class SystemPingWorkflow extends WorkflowEntrypoint<Env, SystemPingParams> {
  override async run(event: Readonly<WorkflowEvent<SystemPingParams>>, step: WorkflowStep) {
    const { agencyId, requestedBy, requestedAt } = event.payload;
    const instanceId = event.instanceId;

    const ranAt = await step.do(
      "write heartbeat",
      { retries: { limit: 5, delay: "2 seconds", backoff: "exponential" }, timeout: "30 seconds" },
      async () => {
        const now = new Date().toISOString();
        await this.env.DB.prepare(
          `insert into job_heartbeat (id, agency_id, job_name, instance_id, requested_by, requested_at, ran_at, worker_id)
           values (?, ?, 'system.ping', ?, ?, ?, ?, ?)
           on conflict (instance_id) do nothing`,
        )
          .bind(crypto.randomUUID(), agencyId, instanceId, requestedBy, requestedAt, now, this.env.WORKER_ID ?? "jobs-worker")
          .run();
        return now;
      },
    );

    console.log(JSON.stringify({ level: "info", msg: "system.ping done", instanceId, agencyId, ranAt }));
    return { ranAt };
  }
}
