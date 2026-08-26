import { allocate, toMinor } from "./money";
import { formatMoney } from "./format";

/**
 * Turning what the user typed into a set of per-member shares.
 *
 * Every split type funnels into `allocate()`, the one largest-remainder
 * primitive, so shares always sum to exactly the total — whichever way the
 * user chose to divide it.
 */

export type SplitType = "equal" | "exact" | "percentage" | "shares";

export type SplitInput = {
  splitType: SplitType;
  totalMinor: number;
  currency: string;
  /** Member ids taking part, in display order. */
  participants: string[];
  /** Index within `participants` of whoever paid — they absorb the odd unit. */
  payerIndex: number;
  /** Raw values keyed by member id: exact amounts, percentages, or shares. */
  values?: Record<string, number>;
};

export type ComputedSplit = {
  memberId: string;
  amountMinor: number;
  percentage?: number;
  shares?: number;
};

export type SplitError = { field: string; message: string };

/** All errors at once, each tagged with a field so it can be wired to a control. */
export function validateSplits(input: SplitInput): SplitError[] {
  const errors: SplitError[] = [];
  const { splitType, totalMinor, currency, participants, values = {} } = input;

  if (totalMinor <= 0) {
    errors.push({ field: "amount", message: "Enter an amount greater than zero." });
  }
  if (participants.length === 0) {
    errors.push({ field: "participants", message: "Choose at least one person to split with." });
  }
  if (errors.length > 0) return errors;

  if (splitType === "exact") {
    const sum = participants.reduce(
      (total, id) => total + Math.round(values[id] ?? 0),
      0,
    );
    if (sum !== totalMinor) {
      const diff = totalMinor - sum;
      // Quote the shortfall, not just "they don't add up" — the user has to
      // work out the difference otherwise.
      errors.push({
        field: "splits",
        message:
          diff > 0
            ? `That's ${formatMoney(diff, currency)} short of ${formatMoney(totalMinor, currency)}.`
            : `That's ${formatMoney(-diff, currency)} over ${formatMoney(totalMinor, currency)}.`,
      });
    }
  }

  if (splitType === "percentage") {
    const sum = participants.reduce((total, id) => total + (values[id] ?? 0), 0);
    // 33.333333 × 3 must pass, so compare with a tolerance rather than exactly.
    if (Math.abs(sum - 100) > 1e-6) {
      errors.push({
        field: "splits",
        message: `Percentages must add up to 100%. Currently: ${round(sum)}%.`,
      });
    }
  }

  if (splitType === "shares") {
    const sum = participants.reduce((total, id) => total + (values[id] ?? 0), 0);
    if (sum <= 0) {
      errors.push({ field: "splits", message: "Give at least one person a share." });
    }
    if (participants.some((id) => (values[id] ?? 0) < 0)) {
      errors.push({ field: "splits", message: "Shares can't be negative." });
    }
  }

  return errors;
}

export function computeSplits(input: SplitInput): ComputedSplit[] {
  const { splitType, totalMinor, participants, payerIndex, values = {} } = input;
  if (participants.length === 0) return [];

  const priority = Math.max(0, payerIndex);

  if (splitType === "exact") {
    return participants.map((memberId) => ({
      memberId,
      amountMinor: Math.round(values[memberId] ?? 0),
    }));
  }

  const weights =
    splitType === "equal"
      ? participants.map(() => 1)
      : participants.map((id) => values[id] ?? 0);

  const amounts = allocate(totalMinor, weights, priority);

  return participants.map((memberId, index) => ({
    memberId,
    amountMinor: amounts[index],
    ...(splitType === "percentage" ? { percentage: values[memberId] ?? 0 } : {}),
    ...(splitType === "shares" ? { shares: values[memberId] ?? 0 } : {}),
  }));
}

/**
 * Describes an equal split honestly.
 *
 * "$33.33 each" is a comfortable lie when one person actually pays $33.34, and
 * that missing cent is exactly what makes people distrust the total.
 */
export function describeEqualSplit(
  totalMinor: number,
  count: number,
  currency: string,
): string {
  if (count <= 0) return "";
  const parts = allocate(totalMinor, Array(count).fill(1));
  const high = parts[0];
  const low = parts[parts.length - 1];

  if (high === low) {
    return `${formatMoney(high, currency)} each`;
  }
  const highCount = parts.filter((p) => p === high).length;
  return `${formatMoney(high, currency)} for ${highCount}, ${formatMoney(low, currency)} for the rest`;
}

/** Carries numbers across a split-type change instead of clearing them. */
export function splitsToPercentages(
  splits: ComputedSplit[],
  totalMinor: number,
): Record<string, number> {
  if (totalMinor <= 0) return {};
  return Object.fromEntries(
    splits.map((s) => [s.memberId, round((s.amountMinor / totalMinor) * 100)]),
  );
}

export function amountsFromSplits(splits: ComputedSplit[]): Record<string, number> {
  return Object.fromEntries(splits.map((s) => [s.memberId, s.amountMinor]));
}

/** Parses a typed amount, returning null rather than throwing on rubbish. */
export function parseAmount(raw: string, currency: string): number | null {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  try {
    return toMinor(cleaned, currency);
  } catch {
    return null;
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
