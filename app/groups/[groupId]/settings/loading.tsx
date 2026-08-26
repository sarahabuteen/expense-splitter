import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function LoadingSettings() {
  return (
    <main id="main" className="w-full flex-1 px-5 py-10 sm:px-7 sm:py-12" aria-busy="true">
      <span className="sr-only" role="status">
        Loading settings…
      </span>
      <Skeleton className="h-2.5 w-48" />
      <Skeleton className="mt-4 h-8 w-52" />
      <Skeleton className="mt-3 h-3.5 w-72 max-w-full" />

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-2">
        <SkeletonCard lines={5} />
        <SkeletonCard lines={4} />
      </div>
    </main>
  );
}
