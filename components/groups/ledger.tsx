"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ActivityList } from "./activity-list";
import { Button, ButtonLink } from "@/components/ui/button";
import { CategoryBreakdown } from "@/components/expenses/category-breakdown";
import { ExpenseFilters } from "@/components/expenses/expense-filters";
import {
  NO_FILTERS,
  countActiveFilters,
  hasActiveFilters,
  toSearchParams,
  type CategoryTotal,
  type Filters,
} from "@/lib/filters";
import type { EditableExpense } from "@/components/expenses/expense-composer";
import type { ActivityRow } from "@/lib/types";
import type { GroupPage } from "@/lib/server/group-page";

/**
 * The activity column: filters, breakdown, and the timeline itself.
 *
 * Presentation only. The rows arrive already filtered, already paged and the
 * totals already aggregated; changing a filter writes it to the URL and the
 * server re-renders. That keeps the arithmetic in one place and makes a
 * filtered view shareable.
 *
 * "Load more" is a link, not a fetch: the page size lives in the URL, so a
 * deep-scrolled ledger survives a reload and the server stays the only thing
 * that decides which rows exist.
 */
/** How many more rows "Load more" asks for. */
const PAGE_STEP = 25;

export function Ledger({
  group,
  rows,
  totals,
  filters,
  usedCategories,
  editingId,
  onEdit,
}: {
  group: GroupPage;
  rows: ActivityRow[];
  totals: CategoryTotal[];
  filters: Filters;
  usedCategories: string[];
  editingId: string | null;
  onEdit: (expense: EditableExpense) => void;
}) {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(() => hasActiveFilters(filters));

  function setFilters(next: Filters) {
    const query = toSearchParams(next);
    router.replace(`/groups/${group.id}${query ? `?${query}` : ""}`, { scroll: false });
  }

  const active = countActiveFilters(filters);
  // Counted by the database across every matching row — `rows` is one page, so
  // counting it here would describe the page and call it the group.
  const expenses = group.matchExpenseCount;
  const settlements = group.matchSettlementCount;

  function moreHref() {
    const params = new URLSearchParams(toSearchParams(filters));
    params.set("show", String(rows.length + PAGE_STEP));
    return `/groups/${group.id}?${params.toString()}`;
  }

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
            <span className="ms-0.5 grid size-5 place-items-center rounded-full bg-accent-solid text-[0.625rem] font-semibold text-accent-foreground">
              {active}
            </span>
          ) : null}
        </Button>

        {hasActiveFilters(filters) ? (
          <p className="tabular text-xs text-text-secondary">
            {rows.length} of {group.totalEntries} shown
          </p>
        ) : null}
      </div>

      {showFilters ? (
        <div id="ledger-filters" className="mt-3">
          <ExpenseFilters
            filters={filters}
            onChange={setFilters}
            members={group.members}
            categories={usedCategories}
          />
        </div>
      ) : null}

      {rows.length > 0 ? (
        <div className="mt-3">
          <CategoryBreakdown totals={totals} currency={group.currency} />
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
              There are {group.totalEntries} entries in this group. Try
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
            editingId={editingId}
            onEdit={onEdit}
          />
        )}
      </div>

      {group.hasMore ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <ButtonLink href={moreHref()} variant="secondary">
            Load more
          </ButtonLink>
          <p className="tabular text-xs text-text-secondary">
            Showing {rows.length} of {group.matchCount}
          </p>
        </div>
      ) : null}
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
