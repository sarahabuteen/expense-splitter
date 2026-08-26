"use client";

import { useState } from "react";

import { RecordSettlementDialog } from "@/components/settle/record-settlement-dialog";
import { Avatar } from "@/components/ui/avatar";
import { Button, ButtonLink } from "@/components/ui/button";
import { formatMoney, formatSignedMoney } from "@/lib/format";
import { isSettled } from "@/lib/balances";
import type { GroupDetail, PlannedPayment } from "@/lib/types";

/** The detail pane: where you stand, what to pay, and everyone's position. */
export function BalanceRail({ group }: { group: GroupDetail }) {
  const settled = isSettled(group.yourBalanceMinor);
  const owed = group.yourBalanceMinor > 0;
  // Both already resolved server-side by simplifyDebts, keyed on member ids.
  const { yours, others } = group.plan;
  const owedToViewer = yours?.viewerRole === "payee";
  // With nothing logged there is no balance to state and nothing to settle.
  // Showing "$0.00 you are owed" and an empty suggestions card is noise.
  const hasActivity = group.expenseCount > 0;
  const soloMember = group.members.length < 2;
  const [recording, setRecording] = useState<PlannedPayment | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {hasActivity ? (
      <Card>
        <div className="flex items-start gap-3.5">
          <span
            aria-hidden="true"
            className={`grid size-10 shrink-0 place-items-center rounded-md ${
              settled
                ? "bg-bg-tertiary text-text-secondary"
                : owed
                  ? "bg-owed-subtle text-owed"
                  : "bg-owe-subtle text-owe"
            }`}
          >
            <DirectionIcon up={!owed} />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-text-secondary">
              {settled ? "All settled up" : owed ? "You are owed" : "You owe"}
            </p>
            <p
              className={`tabular mt-1 font-mono text-xl font-semibold leading-none ${
                settled ? "text-text-primary" : owed ? "text-owed" : "text-owe"
              }`}
            >
              {formatMoney(Math.abs(group.yourBalanceMinor), group.currency)}
            </p>
            <p className="mt-2 text-xs text-text-secondary">
              {settled
                ? "Nobody owes anybody anything."
                : owed
                  ? "others owe you across this group"
                  : "you owe others across this group"}
            </p>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4">
          <div>
            <dt className="text-xs text-text-secondary">You paid</dt>
            <dd className="tabular mt-1 font-mono text-sm font-medium text-text-primary">
              {formatMoney(group.viewerPaidMinor, group.currency)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-text-secondary">Your share</dt>
            <dd className="tabular mt-1 font-mono text-sm font-medium text-text-primary">
              {formatMoney(group.viewerShareMinor, group.currency)}
            </dd>
          </div>
        </dl>
      </Card>
      ) : null}

      {hasActivity ? (
      <Card>
        <h2 className="text-sm font-semibold text-text-primary">Suggested settlements</h2>
        <p className="mt-1 text-xs text-text-secondary">
          {!yours && others.length === 0
            ? "Nobody owes anybody anything."
            : "A minimal set of payments to square everyone up."}
        </p>

        {yours ? (
          <div className="mt-4 flex items-center gap-3">
            <Avatar
              name={owedToViewer ? yours.from : yours.to}
              color={owedToViewer ? yours.fromColor : yours.toColor}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-text-primary">
                {owedToViewer ? `${yours.from} owes you` : `You owe ${yours.to}`}
              </p>
              <p
                className={`tabular mt-0.5 font-mono text-sm font-medium ${
                  owedToViewer ? "text-owed" : "text-owe"
                }`}
              >
                {formatSignedMoney(
                  owedToViewer ? yours.amountMinor : -yours.amountMinor,
                  group.currency,
                )}
              </p>
            </div>
            <Button
              type="button"
              onClick={() => setRecording(yours)}
              className="h-8 shrink-0 px-3 text-xs"
            >
              Record
            </Button>
          </div>
        ) : null}

        {others.length > 0 ? (
          <div className="mt-5 border-t border-border pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              Others in this group
            </h3>
            <ul className="mt-3 flex flex-col gap-3">
              {others.map((p) => (
                <li key={`${p.fromId}-${p.toId}`}>
                  <div className="flex items-center gap-2 text-sm text-text-primary">
                    <Avatar name={p.from} color={p.fromColor} size="sm" />
                    <span className="truncate">{p.from}</span>
                    <ArrowIcon />
                    <Avatar name={p.to} color={p.toColor} size="sm" />
                    <span className="truncate">{p.to}</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-3">
                    <span className="tabular font-mono text-sm text-text-primary">
                      {formatMoney(p.amountMinor, group.currency)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setRecording(p)}
                      className="h-7 px-2 text-xs"
                    >
                      Record
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>
      ) : null}

      <Card>
        <h2 className="text-sm font-semibold text-text-primary">Member balances</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {group.members.map((m) => {
            const memberSettled = isSettled(m.balanceMinor);
            return (
              <li key={m.id} className="flex items-center gap-2.5">
                <Avatar name={m.name} color={m.color} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm text-text-primary">
                  {m.name}
                </span>
                <span
                  className={`tabular shrink-0 font-mono text-sm ${
                    memberSettled
                      ? "text-text-secondary"
                      : m.balanceMinor > 0
                        ? "text-owed"
                        : "text-owe"
                  }`}
                >
                  {memberSettled
                    ? formatMoney(0, group.currency)
                    : formatSignedMoney(m.balanceMinor, group.currency)}
                </span>
              </li>
            );
          })}
        </ul>

        {soloMember ? (
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-xs leading-relaxed text-text-secondary">
              It&rsquo;s just you in here so far. Add the people you&rsquo;re
              sharing costs with — a name is all you need.
            </p>
            <ButtonLink
              href={`/groups/${group.id}/settings`}
              variant="primary"
              className="mt-3 h-9 w-full text-xs"
            >
              Add people
            </ButtonLink>
          </div>
        ) : null}
      </Card>

      <RecordSettlementDialog
        key={recording ? `${recording.fromId}-${recording.toId}` : "idle"}
        payment={recording}
        currency={group.currency}
        viewerName={group.members.find((m) => m.isViewer)?.name}
        onClose={() => setRecording(null)}
      />
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-5">{children}</section>
  );
}

function DirectionIcon({ up }: { up: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {up ? <path d="M7 17 17 7M9 7h8v8" /> : <path d="M17 7 7 17M15 17H7V9" />}
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-3.5 shrink-0 text-text-tertiary"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
