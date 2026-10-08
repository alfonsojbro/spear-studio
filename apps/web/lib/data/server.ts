import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getDb, getJobsQueue } from "@/lib/db";
import { getViewer } from "@/lib/identity";
import { createData, type Data } from "./index";

/** Request-scoped data API, or null when the caller has no access. Route handlers answer 401 on null. */
export const getDataOrNull = cache(async (): Promise<Data | null> => {
  const viewer = await getViewer();
  if (!viewer) return null;
  const [db, jobsQueue] = await Promise.all([getDb(), getJobsQueue()]);
  return createData(db, viewer, { jobsQueue });
});

/** Request-scoped data API for server components and actions. Redirects when there is no access. */
export const getData = cache(async (): Promise<Data> => {
  const data = await getDataOrNull();
  if (!data) redirect("/no-access");
  return data;
});
