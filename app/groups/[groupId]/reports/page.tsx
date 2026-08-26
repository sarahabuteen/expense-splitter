import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumb } from "@/components/layout/breadcrumb";
import { ExportLinks } from "@/components/groups/export-links";
import { GroupReports } from "@/components/groups/group-reports";
import { applyFilters, categoryTotals, parseFilters } from "@/lib/filters";
import { getGroup } from "@/lib/server/groups";
import { memberReports } from "@/lib/csv";

export async function generateMetadata({
  params,
}: PageProps<"/groups/[groupId]/reports">): Promise<Metadata> {
  const { groupId } = await params;
  const group = await getGroup(groupId);
  return {
    title: group ? `Reports · ${group.name}` : "Reports · Expense Splitter",
  };
}

export default async function ReportsPage({
  params,
  searchParams,
}: PageProps<"/groups/[groupId]/reports">) {
  const { groupId } = await params;
  const group = await getGroup(groupId);
  if (!group) notFound();

  // Aggregated on the server, like every other total in the app.
  const filters = parseFilters(await searchParams);
  const rows = applyFilters(group.activity, filters);
  const reports = memberReports(rows, group.members);
  const totals = categoryTotals(rows);
  const expenseCount = rows.filter((r) => r.kind === "expense").length;

  return (
    <main className="w-full flex-1 px-5 py-8 sm:px-7 sm:py-10">
      <Breadcrumb
        trail={[
          { label: "Groups", href: "/groups" },
          { label: group.name, href: `/groups/${group.id}` },
          { label: "Reports" },
        ]}
      />

      <div className="mt-4 flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight">Reports</h1>
          <p className="mt-1.5 text-sm text-text-secondary">
            How spending in {group.name} adds up, and a copy of it to take away.
          </p>
        </div>
        <ExportLinks groupId={group.id} filters={filters} />
      </div>

      <div className="mt-6">
        <GroupReports
          groupId={group.id}
          members={group.members}
          reports={reports}
          totals={totals}
          currency={group.currency}
          filters={filters}
          expenseCount={expenseCount}
        />
      </div>
    </main>
  );
}
