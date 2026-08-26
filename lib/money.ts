/**
 * Money is always an integer count of minor units in a stated currency.
 *
 * Never a float: 0.1 + 0.2 !== 0.3, and a cent of drift in a ledger is a bug
 * users notice. "Minor units" means cents for USD and yen for JPY — JPY has no
 * decimal places, so its minor and major units are the same number.
 */

const CURRENCY_DECIMALS: Record<string, number> = {
  USD: 2, EUR: 2, GBP: 2, CAD: 2, AUD: 2, CHF: 2, CNY: 2, INR: 2, MXN: 2,
  JPY: 0,
};

export const SUPPORTED_CURRENCIES = Object.keys(CURRENCY_DECIMALS);

export function decimalsFor(currency: string): number {
  return CURRENCY_DECIMALS[currency.toUpperCase()] ?? 2;
}

/** "12.34" USD -> 1234. Throws rather than silently truncating bad input. */
export function toMinor(amount: number | string, currency: string): number {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(value)) throw new Error(`Not a number: ${amount}`);

  const factor = 10 ** decimalsFor(currency);
  const scaled = Math.round(value * factor);

  // Guard against input carrying more precision than the currency allows.
  if (Math.abs(value * factor - scaled) > 1e-6) {
    throw new Error(`${amount} has more precision than ${currency} allows`);
  }
  return scaled;
}

/** 1234 USD-minor -> 12.34. For display and API boundaries only. */
export function fromMinor(minor: number, currency: string): number {
  return minor / 10 ** decimalsFor(currency);
}

/**
 * Splits `total` into parts proportional to `weights`, using the largest
 * remainder method so the parts ALWAYS sum back to exactly `total`.
 *
 * Naive rounding of each share independently is what produces "$33.33 x 3 =
 * $99.99" — a penny that silently vanishes from the ledger. Here the leftover
 * units are handed out one at a time to the largest fractional remainders.
 *
 * `priorityIndex` wins ties, which is how the project's leftover-cent rule is
 * implemented: pass the payer's index and the payer absorbs the odd cent.
 * The rule must be deterministic, or the same expense re-saved could shuffle
 * whose share is a penny larger.
 */
export function allocate(
  total: number,
  weights: readonly number[],
  priorityIndex = 0,
): number[] {
  if (weights.length === 0) return [];
  if (weights.some((w) => w < 0)) throw new Error("Weights cannot be negative");

  const totalWeight = weights.reduce((a, b) => a + b, 0);

  // No weight to distribute by: give everything to the priority holder.
  if (totalWeight === 0) {
    return weights.map((_, i) => (i === priorityIndex ? total : 0));
  }

  const exact = weights.map((w) => (total * w) / totalWeight);
  const floors = exact.map(Math.floor);
  let remaining = total - floors.reduce((a, b) => a + b, 0);

  const order = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => {
      if (b.remainder !== a.remainder) return b.remainder - a.remainder;
      if (a.index === priorityIndex) return -1;
      if (b.index === priorityIndex) return 1;
      return a.index - b.index;
    });

  const result = [...floors];
  for (const { index } of order) {
    if (remaining <= 0) break;
    result[index] += 1;
    remaining -= 1;
  }
  return result;
}

/**
 * Converts once, at write time, and rounds once. The result is stored so
 * balance views are pure integer sums that can never disagree with the
 * timeline. Re-deriving conversions at read time is what makes totals stop
 * matching the sum of their parts.
 */
export function convertMinor(
  amountMinor: number,
  from: string,
  to: string,
  rate: number,
): number {
  if (from.toUpperCase() === to.toUpperCase()) return amountMinor;
  const major = fromMinor(amountMinor, from) * rate;
  return Math.round(major * 10 ** decimalsFor(to));
}
