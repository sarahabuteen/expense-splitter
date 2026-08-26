import type { ActivityRow } from "./types";

/**
 * Filtering the group timeline.
 *
 * Pure and combinable: every active filter must pass, so "Food & Drink in
 * January paid by Alex" narrows rather than widens — which is what Core #8
 * means by combined filters working together.
 */
export type Filters = {
  /** Matches an expense description, or either name on a settlement. */
  query: string;
  /** Empty means every category. */
  categories: string[];
  /** Paid by OR included in the split — the spec's definition of involvement. */
  memberId: string | null;
  from: string | null;
  to: string | null;
};

export const NO_FILTERS: Filters = {
  query: "",
  categories: [],
  memberId: null,
  from: null,
  to: null,
};

export function hasActiveFilters(filters: Filters): boolean {
  return (
    filters.query.trim() !== "" ||
    filters.categories.length > 0 ||
    filters.memberId !== null ||
    filters.from !== null ||
    filters.to !== null
  );
}

export function countActiveFilters(filters: Filters): number {
  return (
    (filters.query.trim() ? 1 : 0) +
    (filters.categories.length > 0 ? 1 : 0) +
    (filters.memberId ? 1 : 0) +
    (filters.from || filters.to ? 1 : 0)
  );
}

export function applyFilters(rows: ActivityRow[], filters: Filters): ActivityRow[] {
  const query = filters.query.trim().toLowerCase();

  return rows.filter((row) => {
    // ISO dates compare correctly as strings, so no parsing is needed.
    if (filters.from && row.date < filters.from) return false;
    if (filters.to && row.date > filters.to) return false;

    if (filters.categories.length > 0) {
      // A settlement has no category, so any category filter excludes it —
      // it is not "uncategorised spending", it is not spending at all.
      if (row.kind !== "expense") return false;
      if (!filters.categories.includes(row.category)) return false;
    }

    if (filters.memberId) {
      const involved =
        row.kind === "expense"
          ? row.payerId === filters.memberId ||
            row.splits.some((s) => s.memberId === filters.memberId)
          : row.fromId === filters.memberId || row.toId === filters.memberId;
      if (!involved) return false;
    }

    if (query) {
      const haystack =
        row.kind === "expense"
          ? `${row.title} ${row.category} ${row.payer}`
          : `${row.from} ${row.to}`;
      if (!haystack.toLowerCase().includes(query)) return false;
    }

    return true;
  });
}

export type CategoryTotal = {
  category: string;
  totalMinor: number;
  /** 0–100, of the filtered expense total. */
  percentage: number;
  count: number;
};

/**
 * Spending by category, in the group's currency.
 *
 * Settlements are excluded: moving money between members is not spending, and
 * counting it would double the group's total.
 */
export function categoryTotals(rows: ActivityRow[]): CategoryTotal[] {
  const totals = new Map<string, { totalMinor: number; count: number }>();

  for (const row of rows) {
    if (row.kind !== "expense") continue;
    const existing = totals.get(row.category) ?? { totalMinor: 0, count: 0 };
    totals.set(row.category, {
      totalMinor: existing.totalMinor + row.convertedMinor,
      count: existing.count + 1,
    });
  }

  const grand = [...totals.values()].reduce((sum, t) => sum + t.totalMinor, 0);

  return [...totals.entries()]
    .map(([category, t]) => ({
      category,
      totalMinor: t.totalMinor,
      count: t.count,
      percentage: grand === 0 ? 0 : (t.totalMinor / grand) * 100,
    }))
    .sort((a, b) => b.totalMinor - a.totalMinor);
}
