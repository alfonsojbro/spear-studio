/**
 * Jobs worker entry (wrangler.jobs.jsonc). Consumes the `jobs` queue and starts
 * one Workflow instance per message. The web app (OpenNext worker) only produces.
 */
import type { JobMessage } from "@spear/db/schema";
import type { SystemPingParams } from "../workflows/system-ping";

export { SystemPingWorkflow } from "../workflows/system-ping";

type Env = {
  DB: D1Database;
  SYSTEM_PING: Workflow<SystemPingParams>;
  WORKER_ID?: string;
};

function log(level: "info" | "error", msg: string, extra: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ level, msg, ...extra }));
}

export default {
  async queue(batch: MessageBatch<JobMessage>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      const body = message.body;
      try {
        if (body?.type !== "system.ping") {
          log("error", "unknown job type, dropping", { id: message.id, type: (body as { type?: unknown })?.type });
          message.ack();
          continue;
        }
        // Instance id = queue message id: a redelivered message maps to the same instance.
        const instance = await env.SYSTEM_PING.create({ id: `ping-${message.id}`, params: body });
        log("info", "workflow started", { id: message.id, instance: instance.id });
        message.ack();
      } catch (error) {
        const text = error instanceof Error ? error.message : String(error);
        if (/already exists/i.test(text)) {
          message.ack();
          continue;
        }
        log("error", "enqueue workflow failed, will retry", { id: message.id, error: text });
        message.retry({ delaySeconds: 5 });
      }
    }
  },

  // Health check for `wrangler dev` / uptime monitors.
  async fetch(): Promise<Response> {
    return new Response("spear-jobs ok\n");
  },
} satisfies ExportedHandler<Env, JobMessage>;
