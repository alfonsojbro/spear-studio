import { FormPanelSkeleton, HeaderSkeleton, RosterSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="grid max-w-3xl gap-6">
      <HeaderSkeleton />
      <FormPanelSkeleton fields={2} />
      <RosterSkeleton rows={3} />
    </div>
  );
}
