import { FormPanelSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="grid max-w-3xl gap-5">
      <FormPanelSkeleton />
      <FormPanelSkeleton fields={2} />
    </div>
  );
}
