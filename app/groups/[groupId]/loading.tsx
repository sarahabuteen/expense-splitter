import {
  Skeleton,
  SkeletonCard,
  SkeletonPageHeader,
  SkeletonRows,
} from "@/components/ui/skeleton";

export default function LoadingGroup() {
  return (
    <main id="main" className="w-full flex-1 px-5 py-8 sm:px-7 sm:py-10" aria-busy="true">
      <span className="sr-only" role="status">
        Loading group…
      </span>
      <SkeletonPageHeader />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_var(--container-detail)]">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-[4.5rem] w-full rounded-lg" />
          <div>
            <Skeleton className="h-8 w-24" />
            <SkeletonRows className="mt-4" rows={6} />
          </div>
        </div>
        <aside aria-label="Your balance and settlements" className="flex flex-col gap-4">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={3} />
        </aside>
      </div>
    </main>
  );
}
