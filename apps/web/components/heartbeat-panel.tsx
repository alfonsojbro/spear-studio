"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowCounterClockwise, Check, Lightning, Warning } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type Heartbeat = { ranAt: string; requestedAt: string; workerId: string; instanceId: string } | null;

type Phase = { kind: "idle" } | { kind: "waiting"; since: string } | { kind: "done" } | { kind: "timeout" } | { kind: "error"; message: string };

const POLL_MS = 1000;
const TIMEOUT_MS = 20_000;

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "medium" }).format(new Date(iso));
}

function secondsBetween(a: string, b: string) {
  return Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / 1000);
}

export function HeartbeatPanel({ initial }: { initial: Heartbeat }) {
  const [heartbeat, setHeartbeat] = useState<Heartbeat>(initial);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function poll(since: string, startedAt: number) {
    try {
      const res = await fetch("/api/jobs/ping", { cache: "no-store" });
      if (res.ok) {
        const body = (await res.json()) as { heartbeat: Heartbeat };
        if (body.heartbeat && body.heartbeat.requestedAt >= since) {
          setHeartbeat(body.heartbeat);
          setPhase({ kind: "done" });
          return;
        }
      }
    } catch {
      // Network blip: keep polling until the timeout.
    }
    if (Date.now() - startedAt > TIMEOUT_MS) {
      setPhase({ kind: "timeout" });
      return;
    }
    timer.current = setTimeout(() => void poll(since, startedAt), POLL_MS);
  }

  async function run() {
    setPhase({ kind: "waiting", since: "" });
    try {
      const res = await fetch("/api/jobs/ping", { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as { requestedAt?: string; error?: string };
      if (!res.ok || !body.requestedAt) {
        setPhase({ kind: "error", message: body.error ?? `Request failed (${res.status}).` });
        return;
      }
      setPhase({ kind: "waiting", since: body.requestedAt });
      void poll(body.requestedAt, Date.now());
    } catch {
      setPhase({ kind: "error", message: "Could not reach the server." });
    }
  }

  const waiting = phase.kind === "waiting";

  return (
    <div className="grid gap-4 p-4">
      <dl className="grid gap-3 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-foreground">Last heartbeat</dt>
          <dd className="mt-0.5 text-sm">
            {heartbeat ? <span className="num">{formatTime(heartbeat.ranAt)}</span> : <span className="text-muted-foreground">None yet</span>}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Queue to done</dt>
          <dd className="mt-0.5 text-sm">
            {heartbeat ? (
              <span className="num">{secondsBetween(heartbeat.requestedAt, heartbeat.ranAt).toFixed(1)} s</span>
            ) : (
              <span className="text-muted-foreground">No data</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Worker</dt>
          <dd className="mt-0.5 text-sm">
            {heartbeat ? <span className="num">{heartbeat.workerId}</span> : <span className="text-muted-foreground">No data</span>}
          </dd>
        </div>
      </dl>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" onClick={() => void run()} disabled={waiting}>
          {phase.kind === "timeout" || phase.kind === "error" ? <ArrowCounterClockwise /> : <Lightning />}
          {waiting ? "Waiting for the worker" : "Run ping"}
        </Button>
        <span aria-live="polite" className="text-[13px]">
          {phase.kind === "waiting" ? <Badge tone="warning">Queued</Badge> : null}
          {phase.kind === "done" ? (
            <span className="flex items-center gap-1.5 text-success">
              <Check className="size-3.5" />
              Heartbeat received through the queue and workflow.
            </span>
          ) : null}
          {phase.kind === "timeout" ? (
            <span className="flex items-center gap-1.5 text-danger">
              <Warning className="size-3.5" />
              No heartbeat after 20 seconds. Check that the jobs worker is running.
            </span>
          ) : null}
          {phase.kind === "error" ? (
            <span className="flex items-center gap-1.5 text-danger">
              <Warning className="size-3.5" />
              {phase.message}
            </span>
          ) : null}
        </span>
      </div>
    </div>
  );
}
