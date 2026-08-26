import type { ExpenseInput } from "@/lib/server/expense-write";
import type { SplitType } from "@/lib/splits";

const SPLIT_TYPES: SplitType[] = ["equal", "exact", "percentage", "shares"];

/**
 * Coerces an untrusted body into the shape the write layer expects.
 *
 * Deliberately permissive about *shape* and strict about *meaning*: anything
 * missing becomes a value the write layer will reject with a readable message,
 * rather than throwing an opaque type error here.
 */
export function parseExpenseBody(body: Record<string, unknown>): ExpenseInput {
  const values: Record<string, number> = {};
  if (body.values && typeof body.values === "object") {
    for (const [key, value] of Object.entries(body.values as Record<string, unknown>)) {
      if (typeof value === "number" && Number.isFinite(value)) values[key] = value;
    }
  }

  return {
    description: typeof body.description === "string" ? body.description : "",
    amountMinor:
      typeof body.amountMinor === "number" && Number.isFinite(body.amountMinor)
        ? Math.round(body.amountMinor)
        : 0,
    currency: typeof body.currency === "string" ? body.currency : "",
    date: typeof body.date === "string" ? body.date : "",
    category: typeof body.category === "string" ? body.category : "Other",
    paidBy: typeof body.paidBy === "string" ? body.paidBy : "",
    splitType: SPLIT_TYPES.includes(body.splitType as SplitType)
      ? (body.splitType as SplitType)
      : "equal",
    participants: Array.isArray(body.participants)
      ? body.participants.filter((p): p is string => typeof p === "string")
      : [],
    values,
    exchangeRate:
      typeof body.exchangeRate === "number" && body.exchangeRate > 0
        ? body.exchangeRate
        : undefined,
  };
}
