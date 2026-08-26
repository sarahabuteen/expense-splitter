import { strict as assert } from "node:assert";
import { test } from "node:test";

import { computeSplits, describeEqualSplit, validateSplits } from "./splits";

const P = ["a", "b", "c"];
const base = { totalMinor: 100_00, currency: "USD", participants: P, payerIndex: 0 };

test("equal split reconciles and the payer absorbs the odd unit", () => {
  const splits = computeSplits({ ...base, splitType: "equal" });
  assert.deepEqual(splits.map((s) => s.amountMinor), [3334, 3333, 3333]);
  const withOther = computeSplits({ ...base, splitType: "equal", payerIndex: 2 });
  assert.deepEqual(withOther.map((s) => s.amountMinor), [3333, 3333, 3334]);
});

test("exact amounts must sum to the total, and the error quotes the gap", () => {
  const short = validateSplits({
    ...base,
    splitType: "exact",
    values: { a: 3000, b: 3000, c: 3000 },
  });
  assert.match(short[0].message, /\$10\.00 short of \$100\.00/);

  const over = validateSplits({
    ...base,
    splitType: "exact",
    values: { a: 5000, b: 5000, c: 5000 },
  });
  assert.match(over[0].message, /\$50\.00 over/);

  assert.deepEqual(
    validateSplits({ ...base, splitType: "exact", values: { a: 5000, b: 3000, c: 2000 } }),
    [],
  );
});

test("percentages must total 100, with a tolerance for repeating thirds", () => {
  const wrong = validateSplits({
    ...base,
    splitType: "percentage",
    values: { a: 50, b: 30, c: 15 },
  });
  assert.match(wrong[0].message, /Currently: 95%/);

  assert.deepEqual(
    validateSplits({
      ...base,
      splitType: "percentage",
      values: { a: 33.333333, b: 33.333333, c: 33.333334 },
    }),
    [],
    "thirds must not be rejected",
  );
});

test("shares divide proportionally", () => {
  // The fixture's izakaya: 2:2:1:1
  const splits = computeSplits({
    splitType: "shares",
    totalMinor: 600,
    currency: "USD",
    participants: ["a", "b", "c", "d"],
    payerIndex: 0,
    values: { a: 2, b: 2, c: 1, d: 1 },
  });
  assert.deepEqual(splits.map((s) => s.amountMinor), [200, 200, 100, 100]);
});

test("a zero share is allowed — the driver pays nothing for petrol", () => {
  const splits = computeSplits({
    splitType: "shares",
    totalMinor: 40_00,
    currency: "USD",
    participants: ["driver", "b", "c", "d"],
    payerIndex: 0,
    values: { driver: 0, b: 1, c: 1, d: 1 },
  });
  assert.deepEqual(splits.map((s) => s.amountMinor), [0, 1334, 1333, 1333]);
});

test("empty and invalid states are caught before anything is computed", () => {
  assert.match(
    validateSplits({ ...base, splitType: "equal", totalMinor: 0 })[0].message,
    /greater than zero/,
  );
  assert.match(
    validateSplits({ ...base, splitType: "equal", participants: [] })[0].message,
    /at least one person/,
  );
  // Both problems at once are both reported, so the form can show each in place.
  assert.equal(
    validateSplits({ ...base, splitType: "equal", totalMinor: 0, participants: [] }).length,
    2,
  );
  assert.match(
    validateSplits({ ...base, splitType: "shares", values: { a: 0, b: 0, c: 0 } })[0].message,
    /at least one person a share/,
  );
});

test("an uneven equal split is described honestly", () => {
  assert.equal(describeEqualSplit(90_00, 3, "USD"), "$30.00 each");
  assert.equal(
    describeEqualSplit(100_00, 3, "USD"),
    "$33.34 for 1, $33.33 for the rest",
    "never claim '$33.33 each' when someone pays a cent more",
  );
  assert.equal(describeEqualSplit(4850, 4, "JPY"), "¥1,213 for 2, ¥1,212 for the rest");
});
