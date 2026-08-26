import type { ActivityRow, GroupMember, PlannedPayment, SettlementPlan } from "./types";

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
  // The threshold applies to WHO takes part, not to individual payments.
  //
  // Filtering payments instead silently drops mid-plan residues: in Camping
  // Weekend a 32c remainder fell below it and simply vanished, leaving one
  // member permanently short. Someone whose whole net position is under a
  // currency unit is treated as settled — chasing that is petty — but once
  // someone is in the plan, every payment they need is emitted so the
  // balances actually reach zero.
  const debtors = members
    .filter((m) => m.balanceMinor < -SUGGESTION_THRESHOLD_MINOR)
    .map((m) => ({ member: m, remaining: -m.balanceMinor }))
    .sort((a, b) => b.remaining - a.remaining);

  const creditors = members
    .filter((m) => m.balanceMinor > SUGGESTION_THRESHOLD_MINOR)
    .map((m) => ({ member: m, remaining: m.balanceMinor }))
    .sort((a, b) => b.remaining - a.remaining);

  const payments: PlannedPayment[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.remaining, creditor.remaining);

    if (amount > 0) {
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

/**
 * Who owes whom DIRECTLY, before simplification.
 *
 * Netted per pair: if Alex covered Bo's £30 and Bo covered Alex's £10, the
 * answer is one £20 debt, not two payments.
 *
 * This is the view that can be checked by hand against the ledger. The
 * simplified plan is fewer payments but routes money between people who never
 * shared an expense, which is the single most-complained-about thing about the
 * incumbent — so both are offered rather than only the clever one.
 */
export function pairwiseDebts(
  members: GroupMember[],
  activity: ActivityRow[],
): SettlementPlan {
  const memberOf = new Map(members.map((m) => [m.id, m]));
  // net.get(`${a}|${b}`) = what a owes b, in group-currency minor units.
  const net = new Map<string, number>();

  const owe = (from: string, to: string, amount: number) => {
    if (from === to || amount === 0) return;
    const forward = `${from}|${to}`;
    const backward = `${to}|${from}`;
    const existing = net.get(backward);
    if (existing !== undefined) {
      net.set(backward, existing - amount);
    } else {
      net.set(forward, (net.get(forward) ?? 0) + amount);
    }
  };

  for (const row of activity) {
    if (row.kind === "expense") {
      for (const split of row.splits) {
        if (split.memberId !== row.payerId) {
          owe(split.memberId, row.payerId, split.convertedAmountMinor);
        }
      }
    } else {
      // A settlement is money already moved, so it reduces what was owed.
      owe(row.toId, row.fromId, row.convertedMinor);
    }
  }

  const payments: PlannedPayment[] = [];
  for (const [key, amount] of net) {
    const [a, b] = key.split("|");
    const [fromId, toId, value] =
      amount >= 0 ? [a, b, amount] : [b, a, -amount];
    if (value < SUGGESTION_THRESHOLD_MINOR) continue;

    const from = memberOf.get(fromId);
    const to = memberOf.get(toId);
    if (!from || !to) continue;

    payments.push({
      fromId, from: from.name, fromColor: from.color,
      toId, to: to.name, toColor: to.color,
      amountMinor: value,
    });
  }

  const viewerId = members.find((m) => m.isViewer)?.id;
  const mine = payments.find((p) => p.fromId === viewerId || p.toId === viewerId);

  return {
    yours: mine
      ? { ...mine, viewerRole: mine.fromId === viewerId ? "payer" : "payee" }
      : null,
    others: payments.filter((p) => p !== mine).sort((a, b) => b.amountMinor - a.amountMinor),
  };
}
