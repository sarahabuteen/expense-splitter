import { formatMoney } from "@/lib/format";
import type { TransferChange } from "@/lib/analytics";

/**
 * Making the optimisation tangible — the differentiator's own words.
 *
 * A dumbbell: the form for before → after per item. Two shades of one hue
 * would fail the normal-vision gate (accent-on-accent measured ΔE 13.0), so
 * this is the emphasis form instead — the "before" end is the de-emphasis
 * gray and the accent carries the "after". The point is the reduction, not the
 * two states as equal series.
 *
 * Rendered server-side: it is a static comparison with nothing to interact
 * with, so it ships no JavaScript.
 */
export function SimplificationChart({
  changes,
  directCount,
  simplifiedCount,
  savedMinor,
  currency,
}: {
  changes: TransferChange[];
  directCount: number;
  simplifiedCount: number;
  /** Total value moved under the direct plan, for context. */
  savedMinor: number;
  currency: string;
}) {
  if (changes.length === 0 || directCount === 0) return null;

  const peak = Math.max(...changes.map((c) => c.before), 1);
  const removed = directCount - simplifiedCount;

  return (
    <figure className="overflow-hidden rounded-lg border border-border bg-surface">
      <figcaption className="border-b border-border bg-bg-tertiary/40 px-6 py-4">
        <h2 className="text-sm font-semibold">What simplifying saves</h2>
        <p className="mt-0.5 text-xs text-text-secondary">
          Transfers each person makes or receives, before and after.
        </p>
      </figcaption>

      <div className="p-6">
        {/* The headline, as a figure rather than a chart — one number is not a
            one-bar bar chart. */}
        <p className="flex flex-wrap items-baseline gap-x-2.5">
          <span className="tabular font-mono text-2xl font-semibold text-accent">
            {directCount} → {simplifiedCount}
          </span>
          <span className="text-xs text-text-secondary">
            {removed === 0
              ? "already the fewest possible"
              : `${removed} fewer transfer${removed === 1 ? "" : "s"}, same ${formatMoney(savedMinor, currency)} settled`}
          </span>
        </p>

        <ul className="mt-5 flex flex-col gap-3">
          {changes.map((change) => (
            <li key={change.name} className="flex items-center gap-3">
              <span className="w-24 shrink-0 truncate text-xs">{change.name}</span>

              <span className="relative h-4 flex-1">
                {/* The scale is inset by the dot radius at both ends, so a
                    value of 0 or of the maximum still draws a whole dot. */}
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 my-auto h-0.5 rounded-full bg-chart-grid"
                  style={{
                    left: `calc(5px + (100% - 10px) * ${Math.min(change.before, change.after) / peak})`,
                    width: `calc((100% - 10px) * ${Math.abs(change.before - change.after) / peak})`,
                  }}
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 my-auto size-2.5 -translate-x-1/2 rounded-full bg-chart-other ring-2 ring-surface"
                  style={{ left: `calc(5px + (100% - 10px) * ${change.before / peak})` }}
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 my-auto size-2.5 -translate-x-1/2 rounded-full bg-accent ring-2 ring-surface"
                  style={{ left: `calc(5px + (100% - 10px) * ${change.after / peak})` }}
                />
              </span>

              {/* Direct labels rather than an axis — with at most a handful of
                  whole numbers, an axis is more furniture than help. */}
              <span className="tabular w-14 shrink-0 text-end font-mono text-xs">
                <span className="text-text-tertiary">{change.before}</span>
                <span aria-hidden="true" className="mx-1 text-border">→</span>
                <span className="font-medium">{change.after}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-border-subtle pt-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2.5 rounded-full bg-chart-other" />
            <span className="text-text-secondary">Before</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2.5 rounded-full bg-accent" />
            <span className="text-text-secondary">After simplifying</span>
          </span>
        </div>
      </div>
    </figure>
  );
}
