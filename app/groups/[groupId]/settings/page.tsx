import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumb } from "@/components/layout/breadcrumb";
import { GroupSettings } from "@/components/groups/group-settings";
import { getGroup, getGroupName } from "@/lib/server/groups";

export async function generateMetadata({
  params,
}: PageProps<"/groups/[groupId]/settings">): Promise<Metadata> {
  const { groupId } = await params;
  // Only the name — metadata is its own render pass, so a full group load here
  // would double the work behind every page view.
  const name = await getGroupName(groupId);
  return {
    title: name
      ? `${name} settings · Expense Splitter`
      : "Group settings · Expense Splitter",
  };
}

export default async function GroupSettingsPage({
  params,
}: PageProps<"/groups/[groupId]/settings">) {
  const { groupId } = await params;
  const group = await getGroup(groupId);
  if (!group) notFound();

  return (
    <main id="main" className="w-full flex-1 px-5 py-10 sm:px-7 sm:py-12">
      <Breadcrumb
        trail={[
          { label: "Groups", href: "/groups" },
          { label: group.name, href: `/groups/${group.id}` },
          { label: "Settings" },
        ]}
      />

      <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-text-primary">
        Group settings
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        Details, members, and deleting {group.name}.
      </p>

      <div className="mt-8">
        <GroupSettings group={group} />
      </div>
    </main>
  );
}
