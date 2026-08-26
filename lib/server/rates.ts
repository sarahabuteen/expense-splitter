import "server-only";

import { currencyFor } from "@/lib/currencies";

/**
 * Exchange rates, cached per base currency.
 *
 * Rates do not move by the minute, and the free tier is finite, so a fetched
 * set is reused for six hours. The cache is a module-level Map: it lives per
 * serverless instance, which is the right scope — worst case a cold start
 * re-fetches.
 *
 * The rate is stored ON the expense at write time, so historical balances stay
 * stable even when rates move afterwards. This is only ever consulted when
 * booking something new.
 */

type Entry = { rates: Record<string, number>; fetchedAt: number };

const TTL_MS = 6 * 60 * 60 * 1000;
const cache = new Map<string, Entry>();

export class RateError extends Error {}

export async function getRate(from: string, to: string): Promise<number> {
  const base = from.toUpperCase();
  const quote = to.toUpperCase();
  if (base === quote) return 1;

  if (!currencyFor(base) || !currencyFor(quote)) {
    throw new RateError("That currency isn't supported.");
  }

  const cached = cache.get(base);
  const fresh = cached && Date.now() - cached.fetchedAt < TTL_MS;

  if (fresh) {
    const rate = cached.rates[quote];
    if (rate) return rate;
  }

  const key = process.env.EXCHANGE_RATE_API_KEY;
  if (!key) {
    // A stale rate beats refusing the expense; no rate at all is fatal, because
    // guessing one would silently corrupt the group's balances.
    if (cached?.rates[quote]) return cached.rates[quote];
    throw new RateError("Exchange rates aren't configured.");
  }

  try {
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${key}/latest/${base}`,
      { cache: "no-store" },
    );
    const body = await response.json();

    if (body.result !== "success" || !body.conversion_rates) {
      throw new RateError(body["error-type"] ?? "Rate lookup failed.");
    }

    cache.set(base, { rates: body.conversion_rates, fetchedAt: Date.now() });

    const rate = body.conversion_rates[quote];
    if (!rate) throw new RateError(`No ${base} to ${quote} rate available.`);
    return rate;
  } catch (error) {
    if (cached?.rates[quote]) return cached.rates[quote];
    throw error instanceof RateError
      ? error
      : new RateError("Couldn't reach the exchange-rate service.");
  }
}
