import { redirect } from "next/navigation";

import { GroupsEmptyState } from "@/components/groups/empty-state";
import { MOCK_GROUPS } from "@/lib/mock/groups";

/**
 * There is no group-list screen: the sidebar IS the group list, and repeating
 * it in the main pane would show the same five rows twice.
 *
 * So /groups is a router — straight into a group when there is one, and the
 * empty state only when there is nothing to go to.
 */
export default function GroupsIndexPage() {
  const groups = MOCK_GROUPS;

  if (groups.length > 0) {
    redirect(`/groups/${groups[0].id}`);
  }

  return (
    <main className="flex w-full max-w-2xl flex-1 items-center px-5 py-10 sm:px-7">
      <div className="w-full">
        <GroupsEmptyState />
      </div>
    </main>
  );
}
