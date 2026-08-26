import type { ReactNode } from "react";

/**
 * Shared chart chrome: title, subtitle, and the figure/caption pairing.
 *
 * A chart is a figure, so it gets <figure> and <figcaption> — the caption is
 * what a screen reader announces before the marks, which are decorative.
 */
export function ChartFrame({
  title,
  subtitle,
  legend,
  children,
  table,
}: {
  title: string;
  subtitle?: string;
  legend?: ReactNode;
  children: ReactNode;
  /** The same numbers as text. Required whenever a series fails contrast. */
  table: ReactNode;
}) {
  return (
    <figure className="overflow-hidden rounded-lg border border-border bg-surface">
      <figcaption className="border-b border-border bg-bg-tertiary/40 px-6 py-4">
        <h2 className="text-sm font-semibold">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-text-secondary">{subtitle}</p>
        ) : null}
      </figcaption>

      <div className="p-6">
        {legend ? <div className="mb-4">{legend}</div> : null}
        {children}
        <details className="mt-5 border-t border-border-subtle pt-3">
          {/* A text alternative, not a nicety: several series sit below 3:1
              against the surface, which obligates a table view. */}
          <summary className="cursor-pointer text-xs text-text-secondary hover:text-text-primary">
            View as a table
          </summary>
          <div className="mt-3">{table}</div>
        </details>
      </div>
    </figure>
  );
}

export function Legend({
  items,
}: {
  items: { label: string; className: string }[];
}) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5 text-xs">
          <span
            aria-hidden="true"
            className={`size-2.5 shrink-0 rounded-sm ${item.className}`}
          />
          <span className="text-text-secondary">{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
