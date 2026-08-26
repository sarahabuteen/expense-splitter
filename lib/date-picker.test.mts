import { strict as assert } from "node:assert";
import { test } from "node:test";

/**
 * Mirrors the date helpers in components/ui/date-picker.tsx.
 *
 * The regression: a date-range filter passes "" for "no date chosen", which
 * produced an Invalid Date whose NaN month made monthGrid call Array(NaN) and
 * throw RangeError: Invalid array length — crashing the page on open.
 */
function startOfMonth(iso: string): Date {
  const d = new Date(`${iso}T00:00:00Z`);
  const base = Number.isNaN(d.getTime()) ? new Date() : d;
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1));
}

function monthGrid(month: Date): (string | null)[] {
  const year = month.getUTCFullYear();
  const m = month.getUTCMonth();
  if (!Number.isFinite(year) || !Number.isFinite(m)) return [];
  const first = new Date(Date.UTC(year, m, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year, m + 1, 0)).getUTCDate();
  return [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: count }, (_, i) =>
      new Date(Date.UTC(year, m, i + 1)).toISOString().slice(0, 10),
    ),
  ];
}

test("an unset date falls back to the current month instead of crashing", () => {
  for (const bad of ["", "not-a-date", "2024-13-45"]) {
    const cursor = startOfMonth(bad);
    assert.ok(!Number.isNaN(cursor.getTime()), `${bad} produced an Invalid Date`);
    assert.doesNotThrow(() => monthGrid(cursor), `${bad} threw`);
    assert.ok(monthGrid(cursor).length >= 28);
  }
});

test("a real month still builds correctly", () => {
  // March 2024: starts on a Friday, 31 days -> 4 leading blanks.
  const grid = monthGrid(startOfMonth("2024-03-15"));
  assert.equal(grid.filter((d) => d === null).length, 4);
  assert.equal(grid.filter(Boolean).length, 31);
  assert.equal(grid[4], "2024-03-01");
  assert.equal(grid.at(-1), "2024-03-31");
});

test("month lengths and leap years are handled", () => {
  assert.equal(monthGrid(startOfMonth("2024-02-01")).filter(Boolean).length, 29);
  assert.equal(monthGrid(startOfMonth("2023-02-01")).filter(Boolean).length, 28);
});
