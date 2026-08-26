"use client";

import { useState } from "react";

import { CategoryIcon } from "@/components/ui/category-icon";
import { categoryStyle } from "@/lib/categories";
import { formatMoney } from "@/lib/format";
import type { CategoryTotal } from "@/lib/filters";

/**
 * Spending by category — totals and percentages, per Core #8.
 *
 * A single stacked bar rather than a donut: this sits on a screen about who
 * owes what, and a chart competing with the balances would pull attention from
 * the numbers that matter. Collapsed by default; the full figures are a click
 * away for anyone who wants them.
 */
export function CategoryBreakdown({
  totals,
  currency,
}: {
  /** Aggregated on the server — this component only draws it. */
  totals: CategoryTotal[];
  currency: string;
}) {
  const [open, setOpen] = useState(false);

  if (totals.length === 0) return null;

  const grand = totals.reduce((sum, t) => sum + t.totalMinor, 0);

  return (
    <div className="rounded-lg border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-bg-tertiary/40"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">Spending by category</span>
          <span className="tabular mt-1 block font-mono text-xs text-text-secondary">
            {formatMoney(grand, currency)} across {totals.length}{" "}
            {totals.length === 1 ? "category" : "categories"}
          </span>
        </span>

        {/* Proportions at a glance, even while collapsed. */}
        <span
          aria-hidden="true"
          className="hidden h-2 w-40 shrink-0 overflow-hidden rounded-full bg-bg-tertiary sm:flex"
        >
          {totals.map((t) => (
            <span
              key={t.category}
              style={{ width: `${t.percentage}%` }}
              className={categoryStyle(t.category).fg.replace("text-", "bg-")}
            />
          ))}
        </span>

        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={`size-4 shrink-0 text-text-tertiary transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <ul className="border-t border-border-subtle px-4 py-3">
          {totals.map((t) => (
            <li key={t.category} className="flex items-center gap-3 py-1.5">
              <CategoryIcon category={t.category} size="sm" />
              <span className="min-w-0 flex-1 truncate text-xs">
                {t.category}
                <span className="ms-1.5 text-text-tertiary">
                  {t.count} {t.count === 1 ? "expense" : "expenses"}
                </span>
              </span>
              <span className="tabular w-12 shrink-0 text-end font-mono text-xs text-text-secondary">
                {t.percentage.toFixed(0)}%
              </span>
              <span className="tabular w-24 shrink-0 text-end font-mono text-xs font-medium">
                {formatMoney(t.totalMinor, currency)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
