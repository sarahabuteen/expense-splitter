import type { GroupMember, PlannedPayment, SettlementPlan } from "./types";

/**
 * Two distinct thresholds, deliberately.
 *
 * A balance within one minor unit of zero is rounding residue, not a debt, so
 * it counts as settled. Suggestions are suppressed much higher: chasing anyone
 * for less than a whole unit of currency feels petty, and the UI patterns say
 * so outright.
 */
export const SETTLED_THRESHOLD_MINOR = 1;
export const SUGGESTION_THRESHOLD_MINOR = 100;

export function isSettled(balanceMinor: number): boolean {
  return Math.abs(balanceMinor) <= SETTLED_THRESHOLD_MINOR;
}

/**
 * Greedy debt simplification: repeatedly match the largest debtor with the
 * largest creditor.
 *
 * The general problem (fewest transactions to settle N people) is NP-hard, but
 * greedy is correct — every balance reaches zero — and never needs more than
 * n-1 payments, which is good enough for real group sizes. Documented as greedy
 * rather than optimal on purpose.
 *
 * Operates on integer minor units, so the payments always reconcile exactly.
 *
 * Returns the viewer's own payment already separated and its direction already
 * resolved, so no consumer has to work out which side they are on — that is
 * the kind of derivation that goes wrong quietly.
 */
export function simplifyDebts(members: GroupMember[]): SettlementPlan {
  const debtors = members
    .filter((m) => m.balanceMinor < -SETTLED_THRESHOLD_MINOR)
    .map((m) => ({ member: m, remaining: -m.balanceMinor }))
    .sort((a, b) => b.remaining - a.remaining);

  const creditors = members
    .filter((m) => m.balanceMinor > SETTLED_THRESHOLD_MINOR)
    .map((m) => ({ member: m, remaining: m.balanceMinor }))
    .sort((a, b) => b.remaining - a.remaining);

  const payments: PlannedPayment[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.remaining, creditor.remaining);

    if (amount >= SUGGESTION_THRESHOLD_MINOR) {
      payments.push({
        fromId: debtor.member.id,
        from: debtor.member.name,
        fromColor: debtor.member.color,
        toId: creditor.member.id,
        to: creditor.member.name,
        toColor: creditor.member.color,
        amountMinor: amount,
      });
    }

    debtor.remaining -= amount;
    creditor.remaining -= amount;
    if (debtor.remaining <= SETTLED_THRESHOLD_MINOR) i += 1;
    if (creditor.remaining <= SETTLED_THRESHOLD_MINOR) j += 1;
  }

  const viewerId = members.find((m) => m.isViewer)?.id;
  const mine = payments.find((p) => p.fromId === viewerId || p.toId === viewerId);

  return {
    yours: mine
      ? { ...mine, viewerRole: mine.fromId === viewerId ? "payer" : "payee" }
      : null,
    others: payments
      .filter((p) => p !== mine)
      .sort((a, b) => b.amountMinor - a.amountMinor),
  };
}
