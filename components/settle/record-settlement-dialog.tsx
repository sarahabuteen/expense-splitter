"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError, groupsApi } from "@/lib/client/api";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { CurrencySymbol } from "@/components/ui/currency-symbol";
import { DatePicker } from "@/components/ui/date-picker";
import { formatMoney } from "@/lib/format";
import { parseAmount } from "@/lib/splits";
import type { PlannedPayment } from "@/lib/types";

/**
 * Recording that a payment happened.
 *
 * A modal is right HERE, unlike expense entry: this is a deliberate,
 * infrequent act about money that has already moved, and it deserves a beat of
 * attention rather than being fired off inline.
 *
 * The suggested amount is pre-filled but editable, because partial payments are
 * normal — and the remainder is shown live, so nobody has to work out what is
 * still outstanding after paying a round number.
 *
 * UI ONLY: submitting does nothing yet.
 */
export function RecordSettlementDialog({
  payment,
  groupId,
  currency,
  viewerName,
  onClose,
}: {
  payment: PlannedPayment | null;
  groupId: string;
  currency: string;
  viewerName?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Initialised from props, not synced in an effect: callers remount this with
  // a `key` per payment, which is React's own answer to "reset state when the
  // input changes" — and the compiler lint rejects setState during an effect.
  const [amountText, setAmountText] = useState(() =>
    payment ? majorString(payment.amountMinor, currency) : "",
  );
  const [date, setDate] = useState(today);

  const entered = payment ? (parseAmount(amountText, currency) ?? 0) : 0;
  const remaining = (payment?.amountMinor ?? 0) - entered;
  const overpay = remaining < 0;

  return (
    <Dialog
      open={Boolean(payment)}
      onClose={onClose}
      title="Record a payment"
      description="Log money that has already changed hands."
      width="26rem"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="record-settlement-form"
            variant="primary"
            disabled={entered <= 0 || overpay || pending}
            aria-busy={pending}
          >
            {pending ? "Recording…" : "Record payment"}
          </Button>
        </>
      }
    >
      {payment ? (
        <form
          id="record-settlement-form"
          onSubmit={async (event) => {
            event.preventDefault();
            setPending(true);
            setError(null);
            try {
              await groupsApi.createSettlement(groupId, {
                fromMember: payment.fromId,
                toMember: payment.toId,
                amountMinor: entered,
                currency,
                date,
              });
              onClose();
              // Balances, the plan and the timeline all live in Server
              // Components, so they have to re-read together.
              router.refresh();
            } catch (err) {
              setError(
                err instanceof ApiError
                  ? err.requiresAuth
                    ? "Sign in to record payments in a group of your own."
                    : err.message
                  : "Something went wrong.",
              );
              setPending(false);
            }
          }}
        >
          {/* Who paid whom, stated plainly — the thing most easily got backwards. */}
          <div className="mx-6 flex items-center gap-3 rounded-md border border-border bg-bg-primary px-3.5 py-3">
            <Avatar name={payment.from} color={payment.fromColor} size="sm" />
            <span className="text-sm font-medium">
              {payment.from === viewerName ? "You" : payment.from}
            </span>
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="size-4 shrink-0 text-text-tertiary"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
            <Avatar name={payment.to} color={payment.toColor} size="sm" />
            <span className="text-sm font-medium">
              {payment.to === viewerName ? "You" : payment.to}
            </span>
          </div>

          {error ? (
            <p
              role="alert"
              className="mx-6 mt-4 rounded-md border border-owe/30 bg-owe-subtle px-3 py-2 text-sm text-owe"
            >
              {error}
            </p>
          ) : null}

          <div className="flex flex-col gap-4 px-6 pt-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="record-amount" className="text-sm font-medium">
                Amount
              </label>
              <div className="flex h-10 items-stretch overflow-hidden rounded-md border border-border bg-bg-primary transition-colors focus-within:border-accent">
                <span className="grid w-11 shrink-0 place-items-center border-e border-border bg-bg-tertiary font-mono text-sm text-text-secondary">
                  <CurrencySymbol code={currency} />
                </span>
                <input
                  id="record-amount"
                  value={amountText}
                  onChange={(e) => setAmountText(e.target.value)}
                  inputMode="decimal"
                  aria-describedby="record-remaining"
                  className="tabular h-full w-full bg-transparent px-3 font-mono text-base outline-none"
                />
              </div>

              {/* The remainder, live — so a round-number payment doesn't leave
                  anyone guessing what is still outstanding. */}
              <p
                id="record-remaining"
                className={`text-xs ${overpay ? "font-medium text-owe" : "text-text-secondary"}`}
              >
                {overpay
                  ? `That's ${formatMoney(-remaining, currency)} more than ${payment.from === viewerName ? "you owe" : "is owed"}.`
                  : remaining === 0
                    ? "This settles it completely."
                    : `${formatMoney(remaining, currency)} still outstanding after this.`}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="record-date" className="text-sm font-medium">
                When
              </label>
              <DatePicker id="record-date" value={date} max={today()} onChange={setDate} />
            </div>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function majorString(minor: number, currency: string): string {
  const decimals = currency.toUpperCase() === "JPY" ? 0 : 2;
  return (minor / 10 ** decimals).toFixed(decimals);
}
