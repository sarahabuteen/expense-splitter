import type { Metadata } from "next";
import { Button, ButtonLink } from "@/components/ui/button";
import { notFound } from "next/navigation";

import { GroupWorkspace } from "@/components/groups/group-workspace";
import { AvatarStack } from "@/components/ui/avatar";
import { BalanceRail } from "@/components/groups/balance-rail";
import { formatMoney } from "@/lib/format";
import { applyFilters, categoryTotals, parseFilters } from "@/lib/filters";
import { getGroup } from "@/lib/server/groups";

export async function generateMetadata({
  params,
}: PageProps<"/groups/[groupId]">): Promise<Metadata> {
  const { groupId } = await params;
  const group = await getGroup(groupId);
  return {
    title: group ? `${group.name} · Expense Splitter` : "Group · Expense Splitter",
  };
}

export default async function GroupPage({
  params,
  searchParams,
}: PageProps<"/groups/[groupId]">) {
  const { groupId } = await params;
  const group = await getGroup(groupId);
  if (!group) notFound();

  // Filtering and aggregation run HERE, on the server. The client is handed
  // finished rows and totals; it does not compute either.
  const filters = parseFilters(await searchParams);
  const rows = applyFilters(group.activity, filters);
  const totals = categoryTotals(rows);
  const usedCategories = [
    ...new Set(
      group.activity.filter((r) => r.kind === "expense").map((r) => r.category),
    ),
  ].sort();

  // No max-width and no mx-auto: the sidebar already narrows the pane, so any
  // further cap just reintroduces dead space. The activity column flexes and
  // the detail rail is fixed, so the two of them fill whatever is left.
  return (
    <main className="w-full flex-1 px-5 py-8 sm:px-7 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">
            {group.name}
          </h1>
          <p className="mt-1.5 text-sm text-text-secondary">{group.description}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ButtonLink href={`/groups/${group.id}/settle`}>
            <SettleIcon />
            Settle up
          </ButtonLink>
          <Button type="button" variant="primary">
            <PlusIcon />
            Add expense
          </Button>
          <ButtonLink href={`/groups/${group.id}/settings`} size="icon">
            <span className="sr-only">Group settings</span>
            <GearIcon />
          </ButtonLink>
        </div>
      </div>

      {/* One meta line: totals at a glance, then out of the way. */}
      <div className="mt-5 flex flex-wrap items-center gap-x-7 gap-y-3 border-y border-border py-3.5 text-sm">
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="grid size-7 place-items-center rounded-md bg-bg-tertiary text-text-secondary"
          >
            <ReceiptIcon />
          </span>
          <span className="tabular font-mono font-semibold text-text-primary">
            {formatMoney(group.totalMinor, group.currency)}
          </span>
          <span className="text-xs text-text-secondary">total spent</span>
        </span>
        <span className="flex items-baseline gap-2">
          <span className="tabular font-mono font-semibold text-text-primary">
            {group.expenseCount}
          </span>
          <span className="text-xs text-text-secondary">expenses</span>
        </span>
        <span className="flex items-center gap-2.5">
          <AvatarStack members={group.members} />
          <span className="text-xs text-text-secondary">
            {group.members.length} members
          </span>
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_var(--container-detail)]">
        <GroupWorkspace
          group={group}
          rows={rows}
          totals={totals}
          filters={filters}
          usedCategories={usedCategories}
        />

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <BalanceRail group={group} />
        </aside>
      </div>
    </main>
  );
}

function iconProps(size = "size-4") {
  return {
    viewBox: "0 0 24 24",
    className: size,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
}

function SettleIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M4 8h12l-3-3M20 16H8l3 3" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg {...iconProps()} strokeWidth={2.2}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}


function ReceiptIcon() {
  return (
    <svg {...iconProps("size-4")}>
      <path d="M5 3v18l2.5-1.5L10 21l2-1.5L14 21l2.5-1.5L19 21V3zM9 8h6M9 12h6" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" />
    </svg>
  );
}
