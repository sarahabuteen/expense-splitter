import assert from "node:assert/strict";
import { test } from "node:test";

import {
  memberContributions,
  spendingOverTime,
  transferComparison,
} from "./analytics";
import type { ActivityRow, GroupMember } from "./types";

function expense(
  id: string,
  date: string,
  convertedMinor: number,
  payerId: string,
  category = "Food & Drink",
): ActivityRow {
  return {
    kind: "expense",
    id,
    title: id,
    category,
    payer: payerId,
    payerColor: "indigo",
    date,
    amountMinor: convertedMinor,
    currency: "USD",
    splitType: "equal",
    splits: [],
    payerId,
    convertedMinor,
    relativeDate: "",
    fullDate: "",
  } as ActivityRow;
}

const MEMBERS: GroupMember[] = [
  { id: "m1", name: "Alex", color: "indigo" },
  { id: "m2", name: "Jordan", color: "teal" },
] as GroupMember[];

test("spendingOverTime fills months with no expenses", () => {
  const points = spendingOverTime([
    expense("a", "2026-01-04", 1000, "m1"),
    expense("b", "2026-04-19", 2000, "m1"),
  ]);

  // A dropped middle month would make a three-month gap look continuous.
  assert.deepEqual(
    points.map((p) => p.month),
    ["2026-01", "2026-02", "2026-03", "2026-04"],
  );
  assert.deepEqual(
    points.map((p) => p.totalMinor),
    [1000, 0, 0, 2000],
  );
});

test("spendingOverTime sums within a month and ignores settlements", () => {
  const settlement = { kind: "settlement", date: "2026-01-10" } as ActivityRow;
  const points = spendingOverTime([
    expense("a", "2026-01-04", 1000, "m1"),
    expense("b", "2026-01-28", 250, "m2"),
    settlement,
  ]);

  assert.equal(points.length, 1);
  assert.equal(points[0].totalMinor, 1250);
});

test("spendingOverTime on no expenses is empty, not a bare axis", () => {
  assert.deepEqual(spendingOverTime([]), []);
});

test("memberContributions credits the payer, by category", () => {
  const result = memberContributions(
    [
      expense("a", "2026-01-04", 1000, "m1", "Food & Drink"),
      expense("b", "2026-01-05", 400, "m1", "Transport"),
      expense("c", "2026-01-06", 300, "m1", "Food & Drink"),
      expense("d", "2026-01-07", 900, "m2", "Transport"),
    ],
    MEMBERS,
  );

  assert.deepEqual(result[0], {
    memberId: "m1",
    name: "Alex",
    totalMinor: 1700,
    segments: [
      { category: "Food & Drink", totalMinor: 1300 },
      { category: "Transport", totalMinor: 400 },
    ],
  });
  assert.equal(result[1].totalMinor, 900);
});

test("memberContributions keeps a member who never paid", () => {
  const result = memberContributions([expense("a", "2026-01-04", 100, "m1")], MEMBERS);

  const jordan = result.find((r) => r.memberId === "m2");
  assert.deepEqual(jordan, {
    memberId: "m2",
    name: "Jordan",
    totalMinor: 0,
    segments: [],
  });
});

test("transferComparison counts both ends of each transfer", () => {
  const members = [...MEMBERS, { id: "m3", name: "Sam", color: "amber" }] as GroupMember[];

  const changes = transferComparison(
    members,
    // A circular flow: everyone pays and is paid.
    [
      { fromId: "m1", toId: "m2" },
      { fromId: "m2", toId: "m3" },
      { fromId: "m3", toId: "m1" },
    ],
    [{ fromId: "m1", toId: "m3" }],
  );

  assert.deepEqual(changes, [
    { name: "Alex", before: 2, after: 1 },
    { name: "Jordan", before: 2, after: 0 },
    { name: "Sam", before: 2, after: 1 },
  ]);
});

test("transferComparison drops members with nothing to settle either way", () => {
  const changes = transferComparison(MEMBERS, [], []);
  assert.deepEqual(changes, []);
});
