"use client";

import { useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RecordSettlementDialog } from "./record-settlement-dialog";
import { SUGGESTION_THRESHOLD_MINOR } from "@/lib/balances";
import { formatMoney } from "@/lib/format";
import type { GroupDetail, PlannedPayment } from "@/lib/types";

/**
 * The settle-up view.
 *
 * Simplified is the default, with the raw pairwise debts one tap away.
 *
 * I built this the other way round first — direct by default, on the argument
 * that a verifiable view earns more trust. Testing against the seeded data
 * showed why that is wrong: in a nearly-settled group the direct view asks
 * three people whose NET BALANCE IS ZERO to pay each other in a circle. Core #6
 * says suggestions come from current balances, and asking a settled person to
 * send money contradicts that.
 *
 * So the actionable plan leads, and the original debts stay available and
 * explained — which is what the incumbent gets wrong: it hides simplification
 * rather than showing its working.
 */
export function SettlePlan({ group }: { group: GroupDetail }) {
  const [simplified, setSimplified] = useState(true);
  const [recording, setRecording] = useState<PlannedPayment | null>(null);

  const plan = simplified ? group.plan : group.directPlan;
  const payments = [...(plan.yours ? [plan.yours] : []), ...plan.others];
  // Counted server-side alongside the plans themselves.
  const { direct: directCount, simplified: simpleCount } = group.planCounts;
  const viewerName = group.viewerName ?? undefined;

  // Settled is about NET balances, not about whether historical pairwise debts
  // still exist: a group whose debts cancel in a circle owes nobody anything.
  if (simpleCount === 0) {
    return <AllSettled group={group} />;
  }

  return (
    <>
      {/* Panel with a titled header bar, matching the settings panels and the
          activity list — the same structure the rest of the app uses. */}
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-bg-tertiary/40 px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold">
              {simplified ? "Suggested payments" : "Original debts"}
            </h2>
            <p className="mt-0.5 text-xs text-text-secondary">
              {payments.length} payment{payments.length === 1 ? "" : "s"} to
              square everyone up
            </p>
          </div>

          {/* Labelled by its benefit, not by its mechanism. */}
          {simpleCount < directCount ? (
            <button
              type="button"
              onClick={() => setSimplified((v) => !v)}
              aria-pressed={simplified}
              className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors ${
                simplified
                  ? "border-border bg-surface text-text-secondary hover:border-accent hover:text-text-primary"
                  : "border-accent bg-accent-subtle font-medium text-text-primary"
              }`}
            >
              {simplified
                ? `See the original ${directCount}`
                : `Back to ${simpleCount} payments`}
            </button>
          ) : null}
        </div>

        <p className="border-b border-border-subtle px-6 py-3 text-xs leading-relaxed text-text-secondary">
          {simplified ? (
            <>
              The same balances settled in fewer steps, so some payments are
              between people who didn&rsquo;t share an expense directly. Everyone
              ends up square either way.
            </>
          ) : (
            <>
              The debts exactly as they arose, expense by expense. Some cancel
              each other out in a circle, which is why the simplified plan needs
              fewer payments, and why someone already square can appear here.
            </>
          )}
        </p>

        <ul>
          {payments.map((payment) => {
            const youPay = payment.from === viewerName;
            const youReceive = payment.to === viewerName;
            const yours = youPay || youReceive;
            // Kept visible rather than dropped: without it the balances never
            // reach zero. Marked so nobody thinks they are being chased for it.
            const residue = payment.amountMinor < SUGGESTION_THRESHOLD_MINOR;

            return (
              <li
                key={`${payment.fromId}-${payment.toId}`}
                // One container with hairline dividers — the same list language
                // as the activity timeline and the member list.
                className={`flex flex-wrap items-center gap-3 border-b border-border-subtle px-6 py-3.5 last:border-b-0 ${
                  yours ? "bg-accent-subtle/40" : ""
                }`}
              >
                <Avatar name={payment.from} color={payment.fromColor} size="sm" />
                <span className="min-w-0 flex-1 text-sm">
                  <span className="font-medium">
                    {youPay ? "You" : payment.from}
                  </span>
                  <span className="text-text-secondary">
                    {youPay ? " pay " : " pays "}
                  </span>
                  <span className="font-medium">
                    {youReceive ? "you" : payment.to}
                  </span>
                </span>

                <span
                  className={`tabular shrink-0 font-mono text-sm font-semibold ${
                    youReceive ? "text-owed" : youPay ? "text-owe" : ""
                  }`}
                >
                  {formatMoney(payment.amountMinor, group.currency)}
                </span>

                {residue ? (
                  <span className="shrink-0 rounded-full bg-bg-tertiary px-2 py-0.5 text-[0.625rem] text-text-tertiary">
                    rounding
                  </span>
                ) : null}

                <Button
                  type="button"
                  variant={yours && !residue ? "primary" : "secondary"}
                  onClick={() => setRecording(payment)}
                  className="h-9 shrink-0 px-3 text-xs"
                >
                  Record
                </Button>
              </li>
            );
          })}
        </ul>
      </div>

      <RecordSettlementDialog
        key={recording ? `${recording.fromId}-${recording.toId}` : "idle"}
        payment={recording}
        groupId={group.id}
        currency={group.currency}
        viewerName={viewerName}
        onClose={() => setRecording(null)}
      />
    </>
  );
}

/**
 * Zero is the point of the whole app, so it gets stated rather than left as an
 * empty list — but quietly. Confetti is the language of a game, not a ledger
 * closing.
 */
function AllSettled({ group }: { group: GroupDetail }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-6 py-12 text-center">
      <span
        aria-hidden="true"
        className="mx-auto grid size-12 place-items-center rounded-full bg-owed-subtle text-owed"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m5 12.5 4.5 4.5L19 7" />
        </svg>
      </span>
      <h2 className="mt-4 text-lg font-bold tracking-tight">All settled up</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-text-secondary">
        Nobody owes anybody anything in {group.name}.
      </p>
      <p className="tabular mx-auto mt-4 font-mono text-sm text-text-secondary">
        {group.expenseCount} expense{group.expenseCount === 1 ? "" : "s"} ·{" "}
        {formatMoney(group.totalMinor, group.currency)} shared between{" "}
        {group.members.length}
      </p>
    </div>
  );
}
