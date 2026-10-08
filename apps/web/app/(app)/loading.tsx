import { HeaderSkeleton, RosterSkeleton, StatsSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="grid gap-6">
      <HeaderSkeleton />
      <StatsSkeleton />
      <RosterSkeleton />
    </div>
  );
}
