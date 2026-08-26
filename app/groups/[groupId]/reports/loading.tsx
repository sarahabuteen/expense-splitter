import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function LoadingReports() {
  return (
    <main id="main" className="w-full flex-1 px-5 py-8 sm:px-7 sm:py-10" aria-busy="true">
      <span className="sr-only" role="status">
        Loading reports…
      </span>
      <Skeleton className="h-2.5 w-44" />
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-3 h-3.5 w-80 max-w-full" />
        </div>
        <Skeleton className="h-9 w-56 rounded-md" />
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <div className="flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} lines={0} />
          ))}
        </div>
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <SkeletonCard lines={5} />
          <SkeletonCard lines={5} />
        </div>
      </div>
    </main>
  );
}
