import { decimalsFor, localeFor } from "./currencies";
import { fromMinor } from "./money";

/**
 * Currency formatting deliberately ignores the browser's locale — see
 * lib/currencies.ts for why each currency is pinned to a specific one.
 */
const cache = new Map<string, Intl.NumberFormat>();

function formatter(currency: string): Intl.NumberFormat {
  const code = currency.toUpperCase();
  const cached = cache.get(code);
  if (cached) return cached;

  const created = new Intl.NumberFormat(localeFor(code), {
    style: "currency",
    currency: code,
    minimumFractionDigits: decimalsFor(code),
    maximumFractionDigits: decimalsFor(code),
  });
  cache.set(code, created);
  return created;
}

/** Amounts are never truncated or approximated — this is a financial app. */
export function formatMoney(minor: number, currency: string): string {
  return formatter(currency).format(fromMinor(minor, currency));
}

/**
 * Uses U+2212 MINUS rather than a hyphen: it is the same width as the digits in
 * a tabular font, so negative amounts stay aligned in a column.
 */
export function formatSignedMoney(minor: number, currency: string): string {
  const formatted = formatMoney(Math.abs(minor), currency);
  if (minor === 0) return formatted;
  return `${minor > 0 ? "+" : "−"}${formatted}`;
}

/** Initials for an avatar. Two letters at most; falls back to one. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
