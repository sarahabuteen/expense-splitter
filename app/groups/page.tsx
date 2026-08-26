import { redirect } from "next/navigation";

import { GroupsEmptyState } from "@/components/groups/empty-state";
import { listGroups } from "@/lib/server/groups";

/**
 * There is no group-list screen: the sidebar IS the group list. So /groups is a
 * router — into a group when there is one, and the empty state only when there
 * is nothing to go to.
 */
export default async function GroupsIndexPage() {
  const groups = await listGroups();

  if (groups.length > 0) {
    redirect(`/groups/${groups[0].id}`);
  }

  return (
    <main className="w-full flex-1 px-5 py-10 sm:px-7">
      <div className="w-full">
        <GroupsEmptyState />
      </div>
    </main>
  );
}
