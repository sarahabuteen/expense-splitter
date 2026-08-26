"use client";

import { Avatar } from "@/components/ui/avatar";
import { formatMoney } from "@/lib/format";
import type { AvatarColor } from "@/lib/avatar-colors";
import type { ComputedSplit } from "@/lib/splits";
import type { GroupMember } from "@/lib/types";

/** Literal class names — Tailwind cannot see `bg-avatar-${color}`. */
const BAR: Record<AvatarColor, string> = {
  indigo: "bg-avatar-indigo", amber: "bg-avatar-amber", pink: "bg-avatar-pink",
  teal: "bg-avatar-teal", violet: "bg-avatar-violet", orange: "bg-avatar-orange",
  cyan: "bg-avatar-cyan", emerald: "bg-avatar-emerald", rose: "bg-avatar-rose",
  blue: "bg-avatar-blue",
};

/**
 * Who ends up paying what, shown while you type.
 *
 * A proportional bar plus per-person figures: the bar makes an uneven split
 * obvious at a glance, and the figures keep it exact — the patterns require
 * showing the calculated result live, and a money app should never make you
 * take the arithmetic on faith.
 */
export function SplitPreview({
  members,
  splits,
  currency,
  totalMinor,
}: {
  members: GroupMember[];
  splits: ComputedSplit[];
  currency: string;
  totalMinor: number;
}) {
  const included = splits.filter((s) => s.amountMinor > 0);
  if (totalMinor <= 0 || included.length === 0) return null;

  const memberOf = new Map(members.map((m) => [m.id, m]));

  return (
    <div className="flex flex-col gap-2">
      <div
        aria-hidden="true"
        className="flex h-1.5 overflow-hidden rounded-full bg-bg-tertiary"
      >
        {included.map((split) => {
          const member = memberOf.get(split.memberId);
          if (!member) return null;
          return (
            <span
              key={split.memberId}
              style={{ width: `${(split.amountMinor / totalMinor) * 100}%` }}
              className={BAR[member.color]}
            />
          );
        })}
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
        {included.map((split) => {
          const member = memberOf.get(split.memberId);
          if (!member) return null;
          return (
            <li key={split.memberId} className="flex items-center gap-1.5">
              <Avatar name={member.name} color={member.color} size="sm" />
              <span className="text-xs text-text-secondary">
                {member.isViewer ? "You" : member.name.split(" ")[0]}
              </span>
              <span className="tabular font-mono text-xs font-medium">
                {formatMoney(split.amountMinor, currency)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
