import { strict as assert } from "node:assert";
import { test } from "node:test";

import { bookExpense } from "./booking";
import { computeSplits } from "./splits";

function book(amountMinor: number, currency: string, groupCurrency: string, rate: number, n = 4) {
  const participants = Array.from({ length: n }, (_, i) => `m${i}`);
  const splits = computeSplits({
    splitType: "equal", totalMinor: amountMinor, currency, participants, payerIndex: 0,
  });
  return bookExpense({
    amountMinor, currency, groupCurrency, exchangeRate: rate, splits, payerIndex: 0,
  });
}

test("converted shares always sum to the converted total", () => {
  for (const [amount, cur, rate, n] of [
    [84_000, "JPY", 0.0067, 4],
    [120_000, "JPY", 0.0067, 4],
    [9600, "EUR", 1.09, 4],
    [23650, "USD", 1, 4],
    [100_01, "USD", 1, 3],
    [4850, "JPY", 0.0067, 4],
  ] as const) {
    const booked = book(amount, cur, "USD", rate, n);
    const sum = booked.splits.reduce((a, s) => a + s.convertedAmountMinor, 0);
    assert.equal(
      sum,
      booked.convertedAmountMinor,
      `${amount} ${cur} @${rate}: parts ${sum} != whole ${booked.convertedAmountMinor}`,
    );
  }
});

test("original shares are untouched by conversion", () => {
  const booked = book(84_000, "JPY", "USD", 0.0067, 4);
  assert.deepEqual(booked.splits.map((s) => s.amountMinor), [21000, 21000, 21000, 21000]);
  // ¥84,000 * 0.0067 = $562.80
  assert.equal(booked.convertedAmountMinor, 56280);
});

test("same-currency booking is a pass-through", () => {
  const booked = book(100_00, "USD", "USD", 1, 3);
  assert.equal(booked.convertedAmountMinor, 100_00);
  assert.deepEqual(booked.splits.map((s) => s.convertedAmountMinor), [3334, 3333, 3333]);
});

test("a three-decimal currency converts into a two-decimal one and still reconciles", () => {
  const booked = book(10_000, "JOD", "USD", 1.41, 3);
  const sum = booked.splits.reduce((a, s) => a + s.convertedAmountMinor, 0);
  assert.equal(sum, booked.convertedAmountMinor);
});
