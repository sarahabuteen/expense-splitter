"use client";

import { useState } from "react";

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
export function ActivityRowItem({
  row,
  groupCurrency,
}: {
  row: ActivityRow;
  groupCurrency: string;
}) {
  const [open, setOpen] = useState(false);
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
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
                <span>
                  Category <span className="text-text-primary">{row.category}</span>
                </span>
                <span>
                  Split{" "}
                  <span className="capitalize text-text-primary">
                    {row.splitType === "equal" ? "equally" : row.splitType}
                  </span>
                </span>
                <span>
                  Date <span className="text-text-primary">{row.fullDate}</span>
                </span>
              </div>

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
            </>
          ) : (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
              <span>
                From <span className="text-text-primary">{row.from}</span>
              </span>
              <span>
                To <span className="text-text-primary">{row.to}</span>
              </span>
              <span>
                Date <span className="text-text-primary">{row.fullDate}</span>
              </span>
              {converted ? (
                <span>
                  Converted{" "}
                  <span className="tabular font-mono text-text-primary">
                    {formatMoney(row.convertedMinor, groupCurrency)}
                  </span>
                </span>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </li>
  );
}
