import { redirect } from "next/navigation";

export default async function ClientIndex({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  // The layout already checked access; an unknown id 404s there first.
  redirect(`/clients/${clientId}/discover`);
}
