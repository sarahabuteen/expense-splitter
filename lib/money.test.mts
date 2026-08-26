import { strict as assert } from "node:assert";
import { test } from "node:test";

import { allocate, convertMinor, decimalsFor, fromMinor, toMinor } from "./money";

test("minor units round-trip per currency", () => {
  assert.equal(toMinor(12.34, "USD"), 1234);
  assert.equal(toMinor("0.01", "USD"), 1);
  assert.equal(toMinor(4850, "JPY"), 4850, "JPY has no decimal places");
  assert.equal(fromMinor(1234, "USD"), 12.34);
  assert.equal(fromMinor(4850, "JPY"), 4850);
  assert.equal(decimalsFor("jpy"), 0, "currency codes are case-insensitive");
});

test("rejects precision the currency cannot hold", () => {
  assert.throws(() => toMinor(1.005, "USD"));
  assert.throws(() => toMinor(10.5, "JPY"));
  assert.throws(() => toMinor("abc", "USD"));
});

test("allocate always sums to the total", () => {
  for (const total of [100_00, 24_50, 142_37, 34_99, 1, 0, 7]) {
    for (const n of [1, 2, 3, 4, 5, 7, 20]) {
      const parts = allocate(total, Array(n).fill(1));
      assert.equal(parts.reduce((a, b) => a + b, 0), total, `${total} / ${n}`);
    }
  }
});

// The four rounding cases data/README.md calls out by name.
test("documented fixture edge cases", () => {
  assert.deepEqual(allocate(24_50, Array(4).fill(1)), [613, 613, 612, 612]);
  assert.deepEqual(allocate(142_37, Array(3).fill(1)), [4746, 4746, 4745]);
  assert.deepEqual(allocate(34_99, Array(5).fill(1)), [700, 700, 700, 700, 699]);
  assert.deepEqual(allocate(4850, Array(4).fill(1)), [1213, 1213, 1212, 1212], "JPY");
});

test("the spec's $100 / 3 example", () => {
  assert.deepEqual(allocate(100_00, Array(3).fill(1)), [3334, 3333, 3333]);
});

test("the payer absorbs the leftover cent, deterministically", () => {
  assert.deepEqual(allocate(100_00, Array(3).fill(1), 2), [3333, 3333, 3334]);
  // Same inputs must always give the same answer — re-saving an expense
  // must never shuffle whose share is a penny larger.
  for (let i = 0; i < 50; i++) {
    assert.deepEqual(allocate(100_01, Array(4).fill(1), 1), allocate(100_01, Array(4).fill(1), 1));
  }
});

test("weighted allocation: shares and percentages", () => {
  // Izakaya 2:2:1:1 — Alex and Jordan each pay 2/6
  assert.deepEqual(allocate(600, [2, 2, 1, 1]), [200, 200, 100, 100]);
  // Sushi 30/20/30/20
  assert.deepEqual(allocate(100_00, [30, 20, 30, 20]), [3000, 2000, 3000, 2000]);
  // A zero weight gets nothing (Jake drove, so his share of gas is $0)
  assert.deepEqual(allocate(40_00, [0, 1, 1, 1, 1]), [0, 1000, 1000, 1000, 1000]);
});

test("degenerate weights fall back to the priority holder", () => {
  assert.deepEqual(allocate(500, [0, 0, 0], 1), [0, 500, 0]);
  assert.deepEqual(allocate(0, [1, 1]), [0, 0]);
  assert.throws(() => allocate(100, [1, -1]));
});

test("conversion rounds once, at the target currency's precision", () => {
  // Fixture: ¥84,000 hotel at 0.0067 -> $562.80
  assert.equal(convertMinor(84_000, "JPY", "USD", 0.0067), 56280);
  // Same currency is a no-op, never a float round-trip
  assert.equal(convertMinor(1234, "USD", "USD", 1), 1234);
  // USD -> JPY lands on whole yen
  assert.equal(convertMinor(10_00, "USD", "JPY", 149.5), 1495);
});
