import type { Metadata } from "next";

import { GroupScreen } from "@/components/groups/group-screen";
import { getGroupName } from "@/lib/server/groups";

export async function generateMetadata({
  params,
}: PageProps<"/groups/[groupId]">): Promise<Metadata> {
  const { groupId } = await params;
  // Just the name: generateMetadata runs alongside the page, and loading the
  // whole group twice for a <title> is the kind of waste #15 is about.
  const name = await getGroupName(groupId);
  return { title: name ? `${name} \u00b7 Expense Splitter` : "Group \u00b7 Expense Splitter" };
}

export default async function GroupPage({
  params,
  searchParams,
}: PageProps<"/groups/[groupId]">) {
  const { groupId } = await params;
  // A guest hitting this URL for the demo landing group is sent to /guest by
  // proxy.ts, so it never renders here.
  return <GroupScreen groupId={groupId} query={await searchParams} />;
}
