"use client";

import { useState } from "react";

import { ChartFrame, Legend } from "./chart-frame";
import { assignCategoryColors, labelFor, OTHER_LABEL, OTHER_SLOT } from "@/lib/chart-colors";
import { formatMoney } from "@/lib/format";
import type { MemberContribution } from "@/lib/analytics";

/**
 * Who paid for what — part-to-whole per member, so a horizontal stacked bar.
 * Horizontal because member names are long, and a rotated axis label is a
 * tax on the reader.
 *
 * Segments carry a 2px surface gap so adjacent fills never touch, which is
 * what keeps two similar hues separable at a glance.
 */
export function MemberContributionChart({
  contributions,
  categories,
  currency,
}: {
  contributions: MemberContribution[];
  /**
   * EVERY category the group has, not just the filtered ones. Slots are
   * assigned from this list so narrowing the date range cannot repaint the
   * categories that survive the filter.
   */
  categories: string[];
  currency: string;
}) {
  const [active, setActive] = useState<string | null>(null);
  const colors = assignCategoryColors(categories);

  const peak = Math.max(...contributions.map((c) => c.totalMinor), 1);
  if (contributions.every((c) => c.totalMinor === 0)) return null;

  // The legend lists what is actually on screen, while the colours come from
  // the full list — present categories keep their slot either way.
  const present = new Set(contributions.flatMap((c) => c.segments.map((s) => s.category)));
  const legendItems = [
    ...colors.named
      .filter((category) => present.has(category))
      .map((category) => ({
        label: category,
        className: colors.slotFor(category),
      })),
    ...([...present].some((c) => !colors.named.includes(c))
      ? [{ label: OTHER_LABEL, className: OTHER_SLOT }]
      : []),
  ];

  return (
    <ChartFrame
      title="Who paid for what"
      subtitle={`Each member's spending, split by category, in ${currency}`}
      legend={<Legend items={legendItems} />}
      table={
        <table className="w-full text-xs">
          <thead>
            <tr className="text-text-tertiary">
              <th scope="col" className="pb-1 text-start font-medium">Member</th>
              <th scope="col" className="pb-1 text-start font-medium">Category</th>
              <th scope="col" className="pb-1 text-end font-medium">Paid</th>
            </tr>
          </thead>
          <tbody>
            {contributions.flatMap((c) =>
              c.segments.map((segment) => (
                <tr key={`${c.memberId}-${segment.category}`} className="border-t border-border-subtle">
                  <th scope="row" className="py-1.5 text-start font-normal">{c.name}</th>
                  <td className="py-1.5">{segment.category}</td>
                  <td className="tabular py-1.5 text-end font-mono">
                    {formatMoney(segment.totalMinor, currency)}
                  </td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      }
    >
      <ul className="flex flex-col gap-4">
        {contributions.map((contribution) => (
          <li key={contribution.memberId}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-xs font-medium">{contribution.name}</span>
              {/* Direct label on every bar — mandatory here, since several
                  series fall below 3:1 against the surface. */}
              <span className="tabular shrink-0 font-mono text-xs">
                {formatMoney(contribution.totalMinor, currency)}
              </span>
            </div>

            <div
              className="mt-1.5 flex h-4 gap-0.5 overflow-hidden rounded"
              style={{ width: `${Math.max((contribution.totalMinor / peak) * 100, 1)}%` }}
            >
              {contribution.segments.map((segment) => {
                const key = `${contribution.memberId}-${segment.category}`;
                return (
                  <span
                    key={key}
                    onMouseEnter={() => setActive(key)}
                    onMouseLeave={() => setActive(null)}
                    title={`${labelFor(segment.category, colors)} · ${formatMoney(segment.totalMinor, currency)}`}
                    style={{
                      // min-w keeps a rounding-sized segment from vanishing
                      // under the 2px gap; the table view carries its value.
                      width: `${(segment.totalMinor / contribution.totalMinor) * 100}%`,
                    }}
                    className={`h-full min-w-0.5 rounded-[2px] transition-opacity ${colors.slotFor(segment.category)} ${
                      active && active !== key ? "opacity-45" : ""
                    }`}
                  />
                );
              })}
            </div>

            {active?.startsWith(contribution.memberId) ? (
              <p role="status" className="mt-1.5 text-[0.625rem] text-text-secondary">
                {(() => {
                  const segment = contribution.segments.find(
                    (s) => `${contribution.memberId}-${s.category}` === active,
                  );
                  return segment
                    ? `${segment.category} · ${formatMoney(segment.totalMinor, currency)}`
                    : "";
                })()}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </ChartFrame>
  );
}
