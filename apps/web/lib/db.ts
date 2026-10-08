import "server-only";
import { cache } from "react";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDatabase, type Database } from "@spear/db";

/**
 * The only place that touches the D1 binding. Import it only from lib/data/*
 * and lib/identity.ts. Routes, actions and components use getData() instead.
 */
export const getDb = cache(async (): Promise<Database> => {
  const { env } = await getCloudflareContext({ async: true });
  return createDatabase(env.DB);
});
