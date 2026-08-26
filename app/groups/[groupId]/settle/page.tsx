import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumb } from "@/components/layout/breadcrumb";
import { SettlePlan } from "@/components/settle/settle-plan";
import { SettleRail } from "@/components/settle/settle-rail";
import { getGroup } from "@/lib/server/groups";

export async function generateMetadata({
  params,
}: PageProps<"/groups/[groupId]/settle">): Promise<Metadata> {
  const { groupId } = await params;
  const group = await getGroup(groupId);
  return {
    title: group ? `Settle up · ${group.name}` : "Settle up · Expense Splitter",
  };
}

export default async function SettlePage({
  params,
}: PageProps<"/groups/[groupId]/settle">) {
  const { groupId } = await params;
  const group = await getGroup(groupId);
  if (!group) notFound();

  return (
    <main className="w-full flex-1 px-5 py-8 sm:px-7 sm:py-10">
      <Breadcrumb
        trail={[
          { label: "Groups", href: "/groups" },
          { label: group.name, href: `/groups/${group.id}` },
          { label: "Settle up" },
        ]}
      />

      <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Settle up</h1>
      <p className="mt-1.5 text-sm text-text-secondary">
        Every figure comes from the expenses in {group.name} — open any of them
        to see how it was worked out.
      </p>

      {/* The same meta line the dashboard uses, so the two pages read as one
          product rather than two. */}
      <div className="mt-5 flex flex-wrap items-center gap-x-7 gap-y-3 border-y border-border py-3.5 text-sm">
        <span className="flex items-baseline gap-2">
          <span className="tabular font-mono font-semibold">
            {group.planCounts.simplified}
          </span>
          <span className="text-xs text-text-secondary">payments to make</span>
        </span>
        <span className="flex items-baseline gap-2">
          <span className="tabular font-mono font-semibold">
            {group.members.length}
          </span>
          <span className="text-xs text-text-secondary">
            people, settling in {group.currency}
          </span>
        </span>
      </div>

      {/* The same two-column grid as the dashboard: the plan flexes, the rail
          is fixed, and together they fill the pane instead of leaving a gap. */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_var(--container-detail)]">
        <div>
          <SettlePlan group={group} />
        </div>
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <SettleRail group={group} />
        </aside>
      </div>
    </main>
  );
}
