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

/**
 * "2 hours ago", "yesterday", "3 months ago".
 *
 * Computed against a passed-in `now` so the caller controls the clock: the
 * ledger renders on the server, and a value derived from a hidden Date.now()
 * would differ between server and client.
 */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(`${iso}T00:00:00Z`);
  const days = Math.floor(
    (Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) -
      Date.UTC(then.getUTCFullYear(), then.getUTCMonth(), then.getUTCDate())) /
      86_400_000,
  );

  if (days < 0) return "in the future";
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 31) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? "last week" : `${weeks} weeks ago`;
  }
  if (days < 365) {
    const months = Math.max(1, Math.round(days / 30));
    return months === 1 ? "last month" : `${months} months ago`;
  }
  const years = Math.max(1, Math.round(days / 365));
  return years === 1 ? "last year" : `${years} years ago`;
}

/** The full date, shown on hover and to assistive tech. */
export function formatFullDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
