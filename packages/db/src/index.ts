import { drizzle, type AnyD1Database, type DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";

export * from "./schema";
export { schema };

/** Drizzle over D1, plus `$client` (the raw binding) for the rare raw batch. */
export type Database = DrizzleD1Database<typeof schema> & { $client: AnyD1Database };

/** Wraps a D1 binding. Only apps/web/lib/db.ts and tests call this. */
export function createDatabase(d1: AnyD1Database): Database {
  return drizzle(d1, { schema });
}
