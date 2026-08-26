import { allocate, convertMinor } from "./money";
import type { ComputedSplit } from "./splits";

/**
 * The single home of the rounding policy.
 *
 * An expense is converted to the group's currency ONCE, at write time, and the
 * converted total is then redistributed across members by their
 * original-currency shares (largest remainder, payer prioritised).
 *
 * Converting each share independently is the obvious alternative and it is
 * wrong: the parts drift from the whole, so a group's displayed total stops
 * equalling the sum of its rows. `core-requirements.md` §3 is explicit that
 * shares summing to the total matters more than matching seed data
 * cent-for-cent.
 */
export type BookedExpense = {
  amountMinor: number;
  currency: string;
  convertedAmountMinor: number;
  exchangeRate: number;
  splits: {
    memberId: string;
    amountMinor: number;
    convertedAmountMinor: number;
    percentage?: number;
    shares?: number;
  }[];
};

export function bookExpense(input: {
  amountMinor: number;
  currency: string;
  groupCurrency: string;
  exchangeRate: number;
  splits: ComputedSplit[];
  payerIndex: number;
}): BookedExpense {
  const { amountMinor, currency, groupCurrency, exchangeRate, splits, payerIndex } = input;

  const convertedTotal = convertMinor(amountMinor, currency, groupCurrency, exchangeRate);

  const convertedShares = allocate(
    convertedTotal,
    splits.map((s) => s.amountMinor),
    Math.max(0, payerIndex),
  );

  return {
    amountMinor,
    currency,
    convertedAmountMinor: convertedTotal,
    exchangeRate,
    splits: splits.map((split, index) => ({
      memberId: split.memberId,
      amountMinor: split.amountMinor,
      convertedAmountMinor: convertedShares[index],
      percentage: split.percentage,
      shares: split.shares,
    })),
  };
}
