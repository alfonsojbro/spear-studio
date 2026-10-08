import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { getViewer } from "@/lib/identity";
import { createData, type Data } from "./index";

/** Request-scoped data API for server components, actions and route handlers. Redirects when there is no access. */
export const getData = cache(async (): Promise<Data> => {
  const viewer = await getViewer();
  if (!viewer) redirect("/no-access");
  return createData(await getDb(), viewer);
});
