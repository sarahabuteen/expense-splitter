import { ActivityRowItem } from "./activity-row";
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
  groupCurrency,
}: {
  rows: ActivityRow[];
  groupCurrency: string;
}) {
  return (
    <ul className="overflow-hidden rounded-lg border border-border bg-surface">
      {rows.map((row) => (
        <ActivityRowItem key={row.id} row={row} groupCurrency={groupCurrency} />
      ))}
    </ul>
  );
}
