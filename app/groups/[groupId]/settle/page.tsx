import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumb } from "@/components/layout/breadcrumb";
import { SettlePlan } from "@/components/settle/settle-plan";
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
    <main className="w-full max-w-3xl flex-1 px-5 py-10 sm:px-7 sm:py-12">
      <Breadcrumb
        trail={[
          { label: "Groups", href: "/groups" },
          { label: group.name, href: `/groups/${group.id}` },
          { label: "Settle up" },
        ]}
      />

      <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Settle up</h1>
      <p className="mt-2 text-sm text-text-secondary">
        Every figure here comes from the expenses in this group — open any of
        them to see how it was worked out.
      </p>

      <div className="mt-8">
        <SettlePlan group={group} />
      </div>
    </main>
  );
}
