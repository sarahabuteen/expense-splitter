import { redirect } from "next/navigation";

import { GroupsEmptyState } from "@/components/groups/empty-state";
import { listGroups } from "@/lib/server/groups";
import { getActor } from "@/lib/supabase/actor";

/**
 * There is no group-list screen: the sidebar IS the group list. So /groups is a
 * router — into a group when there is one, and the empty state only when there
 * is nothing to go to.
 */
export default async function GroupsIndexPage() {
  const [groups, { userId }] = await Promise.all([listGroups(), getActor()]);

  if (groups.length > 0) {
    // A guest is only ever looking at the demo, so send them to its readable
    // URL rather than to the id it happens to be stored under.
    redirect(userId ? `/groups/${groups[0].id}` : "/guest");
  }

  return (
    <main id="main" className="w-full flex-1 px-5 py-10 sm:px-7">
      <div className="w-full">
        <GroupsEmptyState />
      </div>
    </main>
  );
}
