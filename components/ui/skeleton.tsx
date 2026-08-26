/**
 * Loading placeholders.
 *
 * Shaped like the content they stand in for, so the layout does not jump when
 * the real thing arrives — the spec asks for no layout shift during load, and
 * a generic spinner guarantees one.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`skeleton block ${className}`} />;
}

/** A bordered panel of rows, matching the activity list and member lists. */
export function SkeletonRows({
  rows = 5,
  className = "",
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-lg border border-border bg-surface ${className}`}>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-3.5 border-b border-border-subtle px-4 py-3 last:border-b-0"
        >
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <span className="min-w-0 flex-1">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="mt-2 h-2.5 w-1/4" />
          </span>
          <Skeleton className="h-3.5 w-16 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <Skeleton className="h-2.5 w-20" />
      <Skeleton className="mt-3 h-6 w-32" />
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className="mt-3 h-3 w-full" />
      ))}
    </div>
  );
}

/** The page header every group route shares: breadcrumb, title, meta row. */
export function SkeletonPageHeader() {
  return (
    <>
      <Skeleton className="h-2.5 w-40" />
      <Skeleton className="mt-4 h-8 w-64" />
      <Skeleton className="mt-3 h-3.5 w-96 max-w-full" />
      <div className="mt-5 flex flex-wrap items-center gap-x-7 gap-y-3 border-y border-border py-3.5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
    </>
  );
}
