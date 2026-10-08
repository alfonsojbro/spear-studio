import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isAgencyStaff } from "@spear/core";
import { HeartbeatPanel } from "@/components/heartbeat-panel";
import { PageHeader } from "@/components/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { getData } from "@/lib/data/server";

export const metadata: Metadata = { title: "System" };

export default async function SystemPage() {
  const data = await getData();
  // Staff only. Freelancers get the same 404 as a missing page.
  if (!isAgencyStaff(data.viewer.role)) notFound();
  const last = await data.jobs.getLastHeartbeat();

  return (
    <div className="grid max-w-3xl gap-6">
      <PageHeader
        title="System"
        description="Background jobs run on Cloudflare Queues and Workflows. Use the ping to check the whole path end to end."
      />
      <Panel>
        <PanelHeader
          title="Job heartbeat"
          description="Run ping puts a message on the jobs queue. The jobs worker starts a workflow that writes a heartbeat row."
        />
        <HeartbeatPanel
          initial={
            last ? { ranAt: last.ranAt, requestedAt: last.requestedAt, workerId: last.workerId, instanceId: last.instanceId } : null
          }
        />
      </Panel>
    </div>
  );
}
