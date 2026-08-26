import { SkeletonCard, SkeletonPageHeader, SkeletonRows } from "@/components/ui/skeleton";

export default function LoadingSettle() {
  return (
    <main id="main" className="w-full flex-1 px-5 py-8 sm:px-7 sm:py-10" aria-busy="true">
      <span className="sr-only" role="status">
        Loading settle up…
      </span>
      <SkeletonPageHeader />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_var(--container-detail)]">
        <SkeletonRows rows={4} />
        <aside aria-label="Group totals" className="flex flex-col gap-4">
          <SkeletonCard lines={1} />
          <SkeletonCard lines={4} />
        </aside>
      </div>
    </main>
  );
}
