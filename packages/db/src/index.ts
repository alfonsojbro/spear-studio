import { drizzle, type AnyD1Database, type DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";

export * from "./schema";
export { schema };

export type Database = DrizzleD1Database<typeof schema>;

/** Wraps a D1 binding. Only apps/web/lib/db.ts and tests call this. */
export function createDatabase(d1: AnyD1Database): Database {
  return drizzle(d1, { schema });
}
