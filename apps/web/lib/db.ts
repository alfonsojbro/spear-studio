import "server-only";
import { cache } from "react";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDatabase, type Database, type JobMessage } from "@spear/db";

/**
 * The only place that touches the D1 binding. Import it only from lib/data/*
 * and lib/identity.ts. Routes, actions and components use getData() instead.
 */
export const getDb = cache(async (): Promise<Database> => {
  const { env } = await getCloudflareContext({ async: true });
  return createDatabase(env.DB);
});

/** Producer for the `jobs` queue. Only lib/data/server.ts passes it to the data layer. */
export async function getJobsQueue(): Promise<Queue<JobMessage> | undefined> {
  const { env } = await getCloudflareContext({ async: true });
  // Undefined when a dev server was started before the binding existed.
  return env.JOBS_QUEUE as Queue<JobMessage> | undefined;
}
