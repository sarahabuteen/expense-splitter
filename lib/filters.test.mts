import { strict as assert } from "node:assert";
import { test } from "node:test";

import { applyFilters, categoryTotals, countActiveFilters, NO_FILTERS } from "./filters";
import type { ActivityRow } from "./types";

const expense = (
  id: string,
  title: string,
  category: string,
  date: string,
  payerId: string,
  memberIds: string[],
  convertedMinor = 1000,
): ActivityRow => ({
  kind: "expense", id, title, category, payer: payerId, payerColor: "indigo",
  payerId, date, amountMinor: convertedMinor, currency: "USD",
  splitType: "equal", convertedMinor, relativeDate: "", fullDate: "",
  splits: memberIds.map((memberId) => ({
    memberId, name: memberId, color: "indigo" as const,
    amountMinor: 0, convertedAmountMinor: 0,
    percentage: null, shares: null, isPayer: memberId === payerId,
  })),
});

const settlement = (id: string, date: string, fromId: string, toId: string): ActivityRow => ({
  kind: "settlement", id, from: fromId, fromColor: "indigo", to: toId, toColor: "indigo",
  fromId, toId, date, amountMinor: 500, currency: "USD", convertedMinor: 500,
  relativeDate: "", fullDate: "",
});

const ROWS: ActivityRow[] = [
  expense("e1", "Sushi Dai", "Food & Drink", "2024-01-10", "alex", ["alex", "bo"], 3000),
  expense("e2", "JR Pass", "Transport", "2024-01-20", "bo", ["alex", "bo"], 5000),
  expense("e3", "Ryokan", "Accommodation", "2024-02-05", "alex", ["alex"], 8000),
  expense("e4", "Coffee", "Food & Drink", "2024-02-10", "bo", ["bo"], 1000),
  settlement("s1", "2024-02-12", "bo", "alex"),
];

test("no filters returns everything", () => {
  assert.equal(applyFilters(ROWS, NO_FILTERS).length, 5);
  assert.equal(countActiveFilters(NO_FILTERS), 0);
});

test("category filter, and it excludes settlements", () => {
  const out = applyFilters(ROWS, { ...NO_FILTERS, categories: ["Food & Drink"] });
  assert.deepEqual(out.map((r) => r.id), ["e1", "e4"]);
  // A settlement is not uncategorised spending — it is not spending at all.
  assert.ok(!out.some((r) => r.kind === "settlement"));
});

test("category filter takes several at once", () => {
  const out = applyFilters(ROWS, {
    ...NO_FILTERS,
    categories: ["Food & Drink", "Transport"],
  });
  assert.deepEqual(out.map((r) => r.id), ["e1", "e2", "e4"]);
});

test("date range is inclusive at both ends", () => {
  const out = applyFilters(ROWS, { ...NO_FILTERS, from: "2024-01-20", to: "2024-02-05" });
  assert.deepEqual(out.map((r) => r.id), ["e2", "e3"]);
});

test("member filter matches paid-by OR included-in-the-split", () => {
  // Alex paid e1 and e3, and was included in e2 — and is on the settlement.
  const alex = applyFilters(ROWS, { ...NO_FILTERS, memberId: "alex" });
  assert.deepEqual(alex.map((r) => r.id), ["e1", "e2", "e3", "s1"]);
  assert.ok(!alex.some((r) => r.id === "e4"), "not involved in Coffee at all");
});

test("search covers description, category and payer", () => {
  assert.deepEqual(
    applyFilters(ROWS, { ...NO_FILTERS, query: "sushi" }).map((r) => r.id),
    ["e1"],
  );
  assert.deepEqual(
    applyFilters(ROWS, { ...NO_FILTERS, query: "transport" }).map((r) => r.id),
    ["e2"],
  );
});

test("combined filters narrow rather than widen", () => {
  // The spec's own example: "Food & Drink in January paid by Alex".
  const out = applyFilters(ROWS, {
    query: "",
    categories: ["Food & Drink"],
    memberId: "alex",
    from: "2024-01-01",
    to: "2024-01-31",
  });
  assert.deepEqual(out.map((r) => r.id), ["e1"]);
  assert.equal(countActiveFilters({
    query: "", categories: ["Food & Drink"], memberId: "alex",
    from: "2024-01-01", to: "2024-01-31",
  }), 3);
});

test("category totals carry amounts and percentages, excluding settlements", () => {
  const totals = categoryTotals(ROWS);
  assert.deepEqual(
    totals.map((t) => [t.category, t.totalMinor, t.count]),
    [
      ["Accommodation", 8000, 1],
      ["Food & Drink", 4000, 2],
      ["Transport", 5000, 1],
    ].sort((a, b) => (b[1] as number) - (a[1] as number)),
  );
  const grand = totals.reduce((s, t) => s + t.totalMinor, 0);
  assert.equal(grand, 17000, "the £5 settlement is not counted as spending");
  assert.equal(Math.round(totals.reduce((s, t) => s + t.percentage, 0)), 100);
});
