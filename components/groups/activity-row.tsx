"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError, groupsApi } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { TrashIcon } from "@/components/ui/trash-icon";

import { Avatar } from "@/components/ui/avatar";
import { CategoryIcon } from "@/components/ui/category-icon";
import { formatMoney } from "@/lib/format";
import type { ActivityRow } from "@/lib/types";

/**
 * One timeline entry, expanding in place to show how it was split.
 *
 * The row itself is the button — clicking anywhere on it opens the detail, and
 * `aria-expanded` means a screen reader knows it can. Dates are relative with
 * the full date on hover and in the accessible name, per the UI patterns.
 *
 * The relative string is computed on the server and passed down: deriving it
 * here from a live clock would differ between the server render and hydration.
 */
/** Labelled facts: the label sits above its value, so "From Anas" cannot be
 *  misread as a sentence and the values line up in a row. */
function Facts({
  items,
}: {
  items: { label: string; value: string; mono?: boolean }[];
}) {
  return (
    <dl className="flex flex-wrap gap-x-8 gap-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-[0.625rem] font-medium uppercase tracking-wider text-text-tertiary">
            {item.label}
          </dt>
          <dd
            className={`mt-0.5 text-xs capitalize text-text-primary ${
              item.mono ? "tabular font-mono normal-case" : ""
            }`}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function ActivityRowItem({
  row,
  groupId,
  groupCurrency,
  canEdit,
}: {
  row: ActivityRow;
  groupId: string;
  groupCurrency: string;
  /** False for demo groups, which nobody may write to. */
  canEdit: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    // An expense deletion needs confirming — it destroys a record of something
    // that happened. Undoing a settlement does not: the row just says money
    // moved, so removing it is exact and nothing real needs reversing.
    if (
      row.kind === "expense" &&
      !window.confirm(`Delete "${row.title}"? Everyone's balance will change.`)
    ) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      if (row.kind === "expense") {
        await groupsApi.deleteExpense(groupId, row.id);
      } else {
        await groupsApi.deleteSettlement(groupId, row.id);
      }
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.requiresAuth
            ? "Sign in to change this group."
            : err.message
          : "Something went wrong.",
      );
      setPending(false);
    }
  }
  const settlement = row.kind === "settlement";
  const converted = row.currency !== groupCurrency;

  return (
    <li
      className={`border-b border-border-subtle last:border-b-0 ${
        settlement ? "bg-owed-subtle/40" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex w-full items-center gap-3.5 px-4 py-3 text-start transition-colors ${
          settlement ? "hover:bg-owed-subtle/60" : "hover:bg-bg-tertiary/50"
        }`}
      >
        <CategoryIcon
          category={row.kind === "expense" ? row.category : undefined}
          settlement={settlement}
        />

        <span className="min-w-0 flex-1">
          {row.kind === "expense" ? (
            <span className="block truncate text-sm font-medium">{row.title}</span>
          ) : (
            <span className="block truncate text-sm">
              <span className="font-medium">{row.from}</span>
              <span className="text-text-secondary"> paid </span>
              <span className="font-medium">{row.to}</span>
            </span>
          )}

          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-secondary">
            {row.kind === "expense" ? (
              <>
                <Avatar name={row.payer} color={row.payerColor} size="sm" />
                <span>{row.payer}</span>
              </>
            ) : (
              <span className="rounded-sm bg-owed-subtle px-1.5 py-0.5 font-medium text-owed">
                Settlement
              </span>
            )}
            <span aria-hidden="true" className="text-border">·</span>
            {/* Relative, with the full date on hover and in the title. */}
            <time dateTime={row.date} title={row.fullDate}>
              {row.relativeDate}
            </time>
            {row.kind === "expense" && row.splitType !== "equal" ? (
              <span className="rounded-sm bg-bg-tertiary px-1.5 py-0.5 capitalize text-text-tertiary">
                {row.splitType}
              </span>
            ) : null}
          </span>
        </span>

        <span className="shrink-0 text-end">
          <span
            className={`tabular block font-mono text-sm font-medium ${
              settlement ? "text-owed" : ""
            }`}
          >
            {formatMoney(row.amountMinor, row.currency)}
          </span>
          {converted ? (
            <span className="tabular block font-mono text-xs text-text-secondary">
              {formatMoney(row.convertedMinor, groupCurrency)}
            </span>
          ) : null}
        </span>

        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={`size-4 shrink-0 text-text-tertiary transition-transform ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div className="border-t border-border-subtle bg-bg-primary/60 px-4 py-3">
          {row.kind === "expense" ? (
            <>
              <Facts
                items={[
                  { label: "Category", value: row.category },
                  {
                    label: "Split",
                    value: row.splitType === "equal" ? "Equally" : row.splitType,
                  },
                  { label: "Date", value: row.fullDate },
                ]}
              />

              <ul className="mt-3 flex flex-col gap-1.5">
                {row.splits.map((split) => (
                  <li key={split.memberId} className="flex items-center gap-2.5">
                    <Avatar name={split.name} color={split.color} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-xs">
                      {split.name}
                      {split.isPayer ? (
                        <span className="ms-1.5 text-text-secondary">paid</span>
                      ) : null}
                    </span>
                    <span className="tabular font-mono text-xs">
                      {formatMoney(split.amountMinor, row.currency)}
                    </span>
                  </li>
                ))}
              </ul>

              {canEdit ? (
                <div className="mt-3 flex items-center gap-2 border-t border-border-subtle pt-3">
                  <Button
                    type="button"
                    variant="danger"
                    disabled={pending}
                    onClick={remove}
                    className="h-8 px-3 text-xs"
                  >
                    <TrashIcon />
                    {pending ? "Deleting…" : "Delete"}
                  </Button>
                  {error ? (
                    <span role="alert" className="text-xs font-medium text-owe">
                      {error}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : (
            <>
              {/* The payment as a picture, matching how the record dialog
                  states it — a run of "From x  To y" is the one thing people
                  read backwards. */}
              <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface px-3.5 py-3">
                <Avatar name={row.from} color={row.fromColor} size="sm" />
                <span className="text-sm font-medium">{row.from}</span>
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
                <Avatar name={row.to} color={row.toColor} size="sm" />
                <span className="text-sm font-medium">{row.to}</span>
                <span className="tabular ms-auto font-mono text-sm font-semibold text-owed">
                  {formatMoney(row.amountMinor, row.currency)}
                </span>
              </div>

              <div className="mt-3">
                <Facts
                  items={[
                    { label: "Recorded", value: row.fullDate },
                    ...(converted
                      ? [
                          {
                            label: `Converted to ${groupCurrency}`,
                            value: formatMoney(row.convertedMinor, groupCurrency),
                            mono: true,
                          },
                        ]
                      : []),
                  ]}
                />
              </div>

              {canEdit ? (
                <div className="mt-3 flex items-center gap-2 border-t border-border-subtle pt-3">
                  <Button
                    type="button"
                    variant="danger"
                    disabled={pending}
                    onClick={remove}
                    className="h-8 px-3 text-xs"
                  >
                    <TrashIcon />
                    {pending ? "Undoing…" : "Undo this payment"}
                  </Button>
                  {error ? (
                    <span role="alert" className="text-xs font-medium text-owe">
                      {error}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </li>
  );
}
