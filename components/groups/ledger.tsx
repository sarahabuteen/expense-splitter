"use client";

import { useMemo, useState } from "react";

import { ActivityList } from "./activity-list";
import { Button } from "@/components/ui/button";
import { CategoryBreakdown } from "@/components/expenses/category-breakdown";
import { ExpenseFilters } from "@/components/expenses/expense-filters";
import {
  NO_FILTERS,
  applyFilters,
  countActiveFilters,
  hasActiveFilters,
  type Filters,
} from "@/lib/filters";
import type { GroupDetail } from "@/lib/types";

/**
 * The activity column: filters, breakdown, and the timeline itself.
 *
 * Filtering happens here rather than on the server because the group's whole
 * timeline is already loaded — a round-trip per keystroke would be slower and
 * would buy nothing.
 */
export function Ledger({ group }: { group: GroupDetail }) {
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  const rows = useMemo(
    () => applyFilters(group.activity, filters),
    [group.activity, filters],
  );

  // Only categories this group actually uses — offering all nine when three
  // are in play is a longer list that answers fewer questions.
  const categories = useMemo(
    () =>
      [
        ...new Set(
          group.activity
            .filter((r) => r.kind === "expense")
            .map((r) => r.category),
        ),
      ].sort(),
    [group.activity],
  );

  const active = countActiveFilters(filters);
  const expenses = rows.filter((r) => r.kind === "expense").length;
  const settlements = rows.length - expenses;

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant={showFilters || active > 0 ? "secondary" : "ghost"}
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          aria-controls="ledger-filters"
          className="h-9 px-3 text-sm"
        >
          <FilterIcon />
          Filters
          {active > 0 ? (
            <span className="ms-0.5 grid size-5 place-items-center rounded-full bg-accent text-[0.625rem] font-semibold text-white">
              {active}
            </span>
          ) : null}
        </Button>

        {hasActiveFilters(filters) ? (
          <p className="tabular text-xs text-text-secondary">
            {rows.length} of {group.activity.length} shown
          </p>
        ) : null}
      </div>

      {showFilters ? (
        <div id="ledger-filters" className="mt-3">
          <ExpenseFilters
            filters={filters}
            onChange={setFilters}
            members={group.members}
            categories={categories}
          />
        </div>
      ) : null}

      {rows.length > 0 ? (
        <div className="mt-3">
          <CategoryBreakdown rows={rows} currency={group.currency} />
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg font-bold tracking-tight">Activity</h2>
        <p className="text-xs text-text-secondary">
          {expenses} expense{expenses === 1 ? "" : "s"}
          <span aria-hidden="true" className="mx-1.5">·</span>
          {settlements} settlement{settlements === 1 ? "" : "s"}
        </p>
      </div>

      <div className="mt-3">
        {rows.length === 0 && hasActiveFilters(filters) ? (
          // A filtered-to-nothing result is a different state from an empty
          // group, and needs a way out rather than the "add your first" nudge.
          <div className="rounded-lg border border-border bg-surface px-6 py-12 text-center">
            <p className="text-sm font-medium">Nothing matches those filters</p>
            <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-text-secondary">
              There are {group.activity.length} entries in this group. Try
              widening the date range or clearing a filter.
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setFilters(NO_FILTERS)}
              className="mt-5"
            >
              Clear all filters
            </Button>
          </div>
        ) : (
          <ActivityList
            rows={rows}
            groupId={group.id}
            groupCurrency={group.currency}
            canEdit={!group.isDemo}
          />
        )}
      </div>
    </section>
  );
}

function FilterIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18M6 12h12M10 18h4" />
    </svg>
  );
}
