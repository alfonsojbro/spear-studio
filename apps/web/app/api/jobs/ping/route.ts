import { NextResponse, type NextRequest } from "next/server";
import { ForbiddenError, UnavailableError, type Data } from "@/lib/data";
import { getDataOrNull } from "@/lib/data/server";

// Identity is re-checked on every call (no middleware). Staff only; enforced in lib/data/jobs.ts.

function heartbeatJson(row: Awaited<ReturnType<Data["jobs"]["getLastHeartbeat"]>>) {
  return row ? { ranAt: row.ranAt, requestedAt: row.requestedAt, workerId: row.workerId, instanceId: row.instanceId } : null;
}

async function withData(handler: (data: Data) => Promise<NextResponse>): Promise<NextResponse> {
  const data = await getDataOrNull();
  if (!data) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    return await handler(data);
  } catch (error) {
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    if (error instanceof UnavailableError) return NextResponse.json({ error: error.message }, { status: 503 });
    throw error;
  }
}

/** Last heartbeat for the caller's agency. */
export async function GET() {
  return withData(async (data) =>
    NextResponse.json({ heartbeat: heartbeatJson(await data.jobs.getLastHeartbeat()) }, { headers: { "cache-control": "no-store" } }),
  );
}

/** Enqueue a system.ping. Same-origin only (CSRF guard on top of Access). */
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "cross-origin request refused" }, { status: 403 });
  }
  return withData(async (data) => {
    const { requestedAt } = await data.jobs.requestPing();
    return NextResponse.json({ requestedAt }, { status: 202 });
  });
}
