"use client";

import { Avatar } from "@/components/ui/avatar";
import { formatMoney } from "@/lib/format";
import { decimalsFor } from "@/lib/currencies";
import type { ComputedSplit, SplitType } from "@/lib/splits";
import type { GroupMember } from "@/lib/types";

const TYPES: { value: SplitType; label: string; hint: string; icon: string }[] = [
  { value: "equal", label: "Equally", hint: "Everyone selected pays the same", icon: "M5 9h14M5 15h14" },
  { value: "exact", label: "Exact amounts", hint: "Type what each person owes", icon: "M6 4v16M18 4v16M4 9h16M4 15h16" },
  { value: "percentage", label: "Percentages", hint: "Divide by percentage", icon: "M19 5 5 19M7.5 8a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3M16.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3" },
  { value: "shares", label: "Shares", hint: "Divide by relative shares", icon: "M12 3a9 9 0 1 0 9 9h-9z M14 3.2A9 9 0 0 1 20.8 10H14z" },
];

/**
 * Choosing who is in, and how the total divides between them.
 *
 * A segmented control rather than a dropdown: there are only four split types
 * and they are the feature, so hiding them behind a menu buries the thing that
 * makes this app more capable than a calculator.
 */
export function SplitEditor({
  members,
  splitType,
  onSplitTypeChange,
  participants,
  onParticipantsChange,
  values,
  onValueChange,
  splits,
  currency,
  totalMinor,
  errorId,
}: {
  members: GroupMember[];
  splitType: SplitType;
  onSplitTypeChange: (next: SplitType) => void;
  participants: string[];
  onParticipantsChange: (next: string[]) => void;
  values: Record<string, number>;
  onValueChange: (memberId: string, value: number) => void;
  splits: ComputedSplit[];
  currency: string;
  totalMinor: number;
  errorId?: string;
}) {
  const shareOf = new Map(splits.map((s) => [s.memberId, s.amountMinor]));
  const active = TYPES.find((t) => t.value === splitType);

  function toggle(memberId: string) {
    onParticipantsChange(
      participants.includes(memberId)
        ? participants.filter((id) => id !== memberId)
        : [...members.map((m) => m.id).filter((id) => participants.includes(id) || id === memberId)],
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/*
        Pills with a visible selected state, matching the payer and category
        controls above. The segmented bar this replaces read as a static
        heading strip — nothing about it said "these are choices".
      */}
      <div role="radiogroup" aria-label="How to split" className="flex flex-wrap gap-1.5">
        {TYPES.map((type) => {
          const selected = splitType === type.value;
          return (
            <button
              key={type.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSplitTypeChange(type.value)}
              className={`inline-flex h-8 items-center gap-1.5 rounded-full border pe-3 ps-2.5 text-xs transition-colors ${
                selected
                  ? "border-accent bg-accent-subtle font-medium text-text-primary"
                  : "border-border text-text-secondary hover:border-accent hover:text-text-primary"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className={`size-3.5 ${selected ? "text-accent" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={type.icon} />
              </svg>
              {type.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-text-secondary">{active?.hint}</p>

      <ul aria-describedby={errorId} className="flex flex-col gap-1">
        {members.map((member) => {
          const included = participants.includes(member.id);
          const share = shareOf.get(member.id) ?? 0;

          return (
            <li key={member.id}>
              <div
                className={`flex items-center gap-3 rounded-md border px-3 py-2 transition-colors ${
                  included ? "border-border bg-bg-primary" : "border-transparent opacity-55"
                }`}
              >
                {/* A real checkbox: 44px target, keyboard-operable, announces
                    its own state without extra ARIA. */}
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 py-1">
                  <input
                    type="checkbox"
                    checked={included}
                    onChange={() => toggle(member.id)}
                    className="size-4 shrink-0"
                  />
                  <Avatar name={member.name} color={member.color} size="sm" />
                  <span className="truncate text-sm">
                    {member.name}
                    {member.isViewer ? (
                      <span className="ms-1.5 text-xs text-text-secondary">you</span>
                    ) : null}
                  </span>
                </label>

                {included && splitType !== "equal" ? (
                  <label className="flex shrink-0 items-center gap-1.5">
                    <span className="sr-only">
                      {splitType === "exact"
                        ? `Amount for ${member.name}`
                        : splitType === "percentage"
                          ? `Percentage for ${member.name}`
                          : `Shares for ${member.name}`}
                    </span>
                    <input
                      inputMode="decimal"
                      value={displayValue(splitType, values[member.id], currency)}
                      onChange={(e) =>
                        onValueChange(member.id, parseValue(splitType, e.target.value, currency))
                      }
                      className="tabular h-8 w-20 rounded border border-border bg-surface px-2 text-end font-mono text-sm"
                    />
                    {splitType === "percentage" ? (
                      <span className="text-xs text-text-secondary">%</span>
                    ) : null}
                  </label>
                ) : null}

                {included ? (
                  <span className="tabular w-20 shrink-0 text-end font-mono text-sm text-text-secondary">
                    {formatMoney(share, currency)}
                  </span>
                ) : (
                  <span className="w-20 shrink-0 text-end text-xs text-text-secondary">
                    not included
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* role="status": ticking a checkbox announces that one box, not what it
          did to the group, and "who is in this split" is what you are actually
          tracking while you tick. */}
      <p role="status" className="text-xs text-text-secondary">
        {participants.length} of {members.length} members selected
        {totalMinor > 0 ? (
          <>
            <span aria-hidden="true" className="mx-1.5 text-border">|</span>
            splitting {formatMoney(totalMinor, currency)}
          </>
        ) : null}
      </p>
    </div>
  );
}

function displayValue(type: SplitType, value: number | undefined, currency: string): string {
  if (value === undefined) return "";
  if (type === "exact") return (value / 10 ** decimalsFor(currency)).toFixed(decimalsFor(currency));
  return String(value);
}

function parseValue(type: SplitType, raw: string, currency: string): number {
  const n = Number(raw.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n)) return 0;
  return type === "exact" ? Math.round(n * 10 ** decimalsFor(currency)) : n;
}
