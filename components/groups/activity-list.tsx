import { Avatar } from "@/components/ui/avatar";
import { CategoryIcon } from "@/components/ui/category-icon";
import { formatMoney } from "@/lib/format";
import type { ActivityRow } from "@/lib/mock/activity";

/**
 * The group timeline: expenses and settlements interleaved, newest first.
 *
 * Settlements are visually distinct — different icon, a tinted row and a
 * positive-coloured amount — because "money actually moved" is a different
 * kind of event from "money was spent".
 */
export function ActivityList({ rows }: { rows: ActivityRow[] }) {
  return (
    <ul className="overflow-hidden rounded-lg border border-border bg-surface">
      {rows.map((row) =>
        row.kind === "expense" ? (
          <ExpenseRow key={row.id} row={row} />
        ) : (
          <SettlementRow key={row.id} row={row} />
        ),
      )}
    </ul>
  );
}

function Row({
  tinted,
  children,
}: {
  tinted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li
      className={`flex items-center gap-3.5 border-b border-border-subtle px-4 py-3 transition-colors last:border-b-0 ${
        tinted ? "bg-owed-subtle/40" : "hover:bg-bg-tertiary/50"
      }`}
    >
      {children}
    </li>
  );
}

function ExpenseRow({ row }: { row: Extract<ActivityRow, { kind: "expense" }> }) {
  return (
    <Row>
      <CategoryIcon category={row.category} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">{row.title}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-secondary">
          <Avatar name={row.payer} color={row.payerColor} size="sm" />
          <span>{row.payer}</span>
          <span aria-hidden="true" className="text-border">·</span>
          <time dateTime={row.date}>{longDate(row.date)}</time>
          {/* Only shown when it isn't the default equal split — the common
              case shouldn't carry a badge. */}
          {row.splitType !== "equal" ? (
            <span className="rounded-sm bg-bg-tertiary px-1.5 py-0.5 capitalize text-text-tertiary">
              {row.splitType}
            </span>
          ) : null}
        </p>
      </div>

      <p className="tabular shrink-0 font-mono text-sm font-medium text-text-primary">
        {formatMoney(row.amountMinor, row.currency)}
      </p>
      <Chevron />
    </Row>
  );
}

function SettlementRow({ row }: { row: Extract<ActivityRow, { kind: "settlement" }> }) {
  return (
    <Row tinted>
      <CategoryIcon settlement />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-text-primary">
          <span className="font-medium">{row.from}</span>
          <span className="text-text-secondary"> paid </span>
          <span className="font-medium">{row.to}</span>
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-secondary">
          <span className="rounded-sm bg-owed-subtle px-1.5 py-0.5 font-medium text-owed">
            Settlement
          </span>
          <span aria-hidden="true" className="text-border">·</span>
          <time dateTime={row.date}>{longDate(row.date)}</time>
        </p>
      </div>

      <p className="tabular shrink-0 font-mono text-sm font-medium text-owed">
        {formatMoney(row.amountMinor, row.currency)}
      </p>
      <Chevron />
    </Row>
  );
}

function Chevron() {
  return (
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/** Fixed locale: the app formats dates consistently rather than per-visitor. */
function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
