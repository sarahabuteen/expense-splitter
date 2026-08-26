"use client";

import { useRouter } from "next/navigation";

import { Avatar } from "@/components/ui/avatar";
import { CategoryIcon } from "@/components/ui/category-icon";
import { formatMoney, formatSignedMoney } from "@/lib/format";
import { toSearchParams, type CategoryTotal, type Filters } from "@/lib/filters";
import type { MemberReport } from "@/lib/csv";
import { MemberContributionChart } from "@/components/charts/member-contribution";
import { SpendingOverTime } from "@/components/charts/spending-over-time";
import type { MemberContribution, MonthPoint } from "@/lib/analytics";
import type { GroupMember } from "@/lib/types";

/** The ranges the spec names, plus a cleared state. */
const RANGES = [
  { label: "All time", from: null, to: null },
  { label: "This month", months: 0 },
  { label: "Last month", months: 1 },
  { label: "Last 3 months", months: 3 },
] as const;

/**
 * Reports and export.
 *
 * On its own route rather than inside the ledger: the ledger column answers
 * "what happened", and this answers "how does it add up" — different questions,
 * and mixing them pushed the timeline down the page for something people look
 * at occasionally.
 *
 * The date range writes to the URL, so a report is shareable and the export
 * links in the page header always match what is on screen.
 *
 * Laid out as the same two-column grid the dashboard and settle pages use: the
 * per-member table flexes and the smaller panels sit in a fixed rail, so the
 * page fills the pane instead of leaving a gap down one side.
 */
export function GroupReports({
  groupId,
  members,
  reports,
  totals,
  currency,
  filters,
  expenseCount,
  trend,
  contributions,
  categories,
}: {
  groupId: string;
  members: GroupMember[];
  /** Both aggregated on the server. */
  reports: MemberReport[];
  totals: CategoryTotal[];
  currency: string;
  filters: Filters;
  expenseCount: number;
  trend: MonthPoint[];
  contributions: MemberContribution[];
  /** The group's whole category list, so chart colours survive filtering. */
  categories: string[];
}) {
  const router = useRouter();
  const colorOf = new Map(members.map((m) => [m.name, m.color]));
  const grand = totals.reduce((sum, t) => sum + t.totalMinor, 0);
  const topContributor = reports[0];

  function setRange(range: (typeof RANGES)[number]) {
    const next: Filters = { ...filters, from: null, to: null };
    if ("months" in range) {
      const now = new Date();
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - range.months, 1));
      next.from = start.toISOString().slice(0, 10);
      if (range.months > 0) {
        const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - range.months + 1, 0));
        next.to = end.toISOString().slice(0, 10);
      }
    }
    const params = toSearchParams(next);
    router.replace(`/groups/${groupId}/reports${params ? `?${params}` : ""}`, {
      scroll: false,
    });
  }

  const activeRange =
    !filters.from && !filters.to
      ? "All time"
      : RANGES.find((r) => {
          if (!("months" in r)) return false;
          const now = new Date();
          const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - r.months, 1));
          return filters.from === start.toISOString().slice(0, 10);
        })?.label ?? "Custom";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-1.5">
        {RANGES.map((range) => (
          <button
            key={range.label}
            type="button"
            aria-pressed={activeRange === range.label}
            onClick={() => setRange(range)}
            className={`h-8 rounded-full border px-3 text-xs transition-colors ${
              activeRange === range.label
                ? "border-accent bg-accent-subtle font-medium text-text-primary"
                : "border-border text-text-secondary hover:border-accent hover:text-text-primary"
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {expenseCount === 0 ? (
        <Panel title="Nothing in this range">
          <p className="text-sm text-text-secondary">
            No expenses fall inside the dates you picked. Try a wider range.
          </p>
        </Panel>
      ) : (
        <>
          {/* A row of headline figures. Filling the width with several small
              facts reads better than one table stretched across it — the
              columns of a wide table drift apart until they stop scanning. */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Total spent" value={formatMoney(grand, currency)} mono />
            <Stat label="Expenses" value={String(expenseCount)} mono />
            <Stat
              label="Biggest category"
              value={totals[0]?.category ?? "—"}
              note={totals[0] ? `${totals[0].percentage.toFixed(0)}% of spending` : undefined}
            />
            <Stat
              label="Carried most"
              value={topContributor?.name.split(" ")[0] ?? "—"}
              note={
                topContributor
                  ? `${formatMoney(topContributor.paidMinor, currency)} paid`
                  : undefined
              }
            />
          </div>

          {/* Charts before the tables: the shapes answer "how has this gone"
              at a glance, and the tables below answer it exactly. Two equal
              columns so neither is stretched across the pane. */}
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <SpendingOverTime points={trend} currency={currency} />
            <MemberContributionChart
              contributions={contributions}
              categories={categories}
              currency={currency}
            />
          </div>

          {/* Two equal columns: neither panel gets stretched thin. */}
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <Panel
              title="Per member"
              note="What each person put in, against what they consumed."
            >
              <table className="w-full text-xs">
                <caption className="sr-only">
                  What each member paid, their share, and the difference
                </caption>
                <thead>
                  <tr className="text-text-tertiary">
                    <th scope="col" className="pb-2 text-start font-medium">Member</th>
                    <th scope="col" className="pb-2 text-end font-medium">Paid</th>
                    <th scope="col" className="pb-2 text-end font-medium">Share</th>
                    <th scope="col" className="pb-2 text-end font-medium">Diff.</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.name} className="border-t border-border-subtle">
                      <th scope="row" className="py-2.5 text-start font-normal">
                        <span className="flex items-center gap-2">
                          <Avatar
                            name={report.name}
                            color={colorOf.get(report.name) ?? "indigo"}
                            size="xs"
                          />
                          <span className="truncate">{report.name}</span>
                        </span>
                      </th>
                      <td className="tabular py-2.5 text-end font-mono">
                        {formatMoney(report.paidMinor, currency)}
                      </td>
                      <td className="tabular py-2.5 text-end font-mono text-text-secondary">
                        {formatMoney(report.shareMinor, currency)}
                      </td>
                      <td
                        className={`tabular py-2.5 text-end font-mono ${
                          report.differenceMinor > 0
                            ? "text-owed"
                            : report.differenceMinor < 0
                              ? "text-owe"
                              : "text-text-secondary"
                        }`}
                      >
                        {formatSignedMoney(report.differenceMinor, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-[0.625rem] leading-relaxed text-text-tertiary">
                Ignores settlements, so it describes spending habits rather than
                who currently owes what.
              </p>
            </Panel>

            <Panel title="By category" note="Where the money went.">
              <ul className="flex flex-col gap-3">
                {totals.map((total) => (
                  <li key={total.category} className="flex flex-col gap-1.5">
                    <span className="flex items-center gap-2.5">
                      <CategoryIcon category={total.category} size="sm" />
                      <span className="min-w-0 flex-1 truncate text-xs">
                        {total.category}
                      </span>
                      <span className="tabular shrink-0 font-mono text-xs font-medium">
                        {formatMoney(total.totalMinor, currency)}
                      </span>
                    </span>
                    {/* A bar per row uses the width for something legible,
                        rather than leaving a stretch of empty cell. */}
                    <span
                      aria-hidden="true"
                      className="ms-[1.875rem] block h-1.5 overflow-hidden rounded-full bg-bg-tertiary"
                    >
                      <span
                        style={{ width: `${total.percentage}%` }}
                        className="block h-full rounded-full bg-accent"
                      />
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  note,
  mono,
}: {
  label: string;
  value: string;
  note?: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs text-text-secondary">{label}</p>
      <p
        className={`mt-1.5 truncate text-lg font-semibold leading-none ${
          mono ? "tabular font-mono" : ""
        }`}
      >
        {value}
      </p>
      {note ? (
        <p className="mt-1.5 truncate text-xs text-text-tertiary">{note}</p>
      ) : null}
    </div>
  );
}


function Panel({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="border-b border-border bg-bg-tertiary/40 px-6 py-4">
        <h2 className="text-sm font-semibold">{title}</h2>
        {note ? (
          <p className="mt-0.5 text-xs text-text-secondary">{note}</p>
        ) : null}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

