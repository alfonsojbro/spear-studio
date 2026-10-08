import { HeaderSkeleton, RosterSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="grid gap-6">
      <HeaderSkeleton />
      <RosterSkeleton rows={5} />
    </div>
  );
}
