"use client";

import { ActivityRowItem } from "./activity-row";
import { EmptyLedgerIllustration } from "@/components/ui/empty-illustration";
import type { ActivityRow } from "@/lib/types";

/**
 * The group timeline: expenses and settlements interleaved, newest first.
 *
 * Settlements are visually distinct — different icon, a tinted row, a
 * positive-coloured amount — because "money actually moved" is a different
 * kind of event from "money was spent".
 */
export function ActivityList({
  rows,
  groupId,
  groupCurrency,
  canEdit,
}: {
  rows: ActivityRow[];
  groupId: string;
  groupCurrency: string;
  canEdit: boolean;
}) {
  if (rows.length === 0) {
    // Sits inside the same bordered container the rows would fill, so the
    // page keeps its shape instead of collapsing into a different layout.
    return (
      <div className="rounded-lg border border-border bg-surface px-6 py-12 text-center">
        <EmptyLedgerIllustration className="mx-auto w-full max-w-[15rem]" />
        <p className="mt-5 text-sm font-medium">Nothing here yet</p>
        <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-text-secondary">
          Add an expense above and it will appear here, with everyone&rsquo;s
          share worked out.
        </p>
      </div>
    );
  }

  return (
    <ul className="overflow-hidden rounded-lg border border-border bg-surface">
      {rows.map((row) => (
        <ActivityRowItem
          key={row.id}
          row={row}
          groupId={groupId}
          groupCurrency={groupCurrency}
          canEdit={canEdit}
        />
      ))}
    </ul>
  );
}
