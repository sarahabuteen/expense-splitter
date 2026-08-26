import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ActivityFeed } from "@/components/groups/activity-feed";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { getFeed } from "@/lib/server/activity";
import { getGroup, getGroupName } from "@/lib/server/groups";

export async function generateMetadata({
  params,
}: PageProps<"/groups/[groupId]/activity">): Promise<Metadata> {
  const { groupId } = await params;
  // Only the name — metadata is its own render pass, so a full group load here
  // would double the work behind every page view.
  const name = await getGroupName(groupId);
  return { title: name ? `Activity · ${name}` : "Activity · Expense Splitter" };
}

/**
 * Stretch #12: the group's history.
 *
 * Its own route rather than a panel on the dashboard. The ledger answers
 * "what does this group owe" and is a list of things that still exist; this
 * answers "what has been going on", including the edits and deletions the
 * ledger cannot show. Mixing them would push the balances down the page for
 * something people read occasionally.
 */
export default async function ActivityPage({
  params,
}: PageProps<"/groups/[groupId]/activity">) {
  const { groupId } = await params;
  const [group, feed] = await Promise.all([getGroup(groupId), getFeed(groupId)]);
  if (!group || !feed) notFound();

  return (
    <main id="main" className="w-full flex-1 px-5 py-8 sm:px-7 sm:py-10">
      <Breadcrumb
        trail={[
          { label: "Groups", href: "/groups" },
          { label: group.name, href: `/groups/${group.id}` },
          { label: "Activity" },
        ]}
      />

      <div className="mt-4 flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight">Activity</h1>
          <p className="mt-1.5 text-sm text-text-secondary">
            Everything that has happened in {group.name}, newest first.
          </p>
        </div>
        <p className="tabular shrink-0 rounded-full border border-border px-3 py-1 font-mono text-xs text-text-secondary">
          {feed.total} {feed.total === 1 ? "entry" : "entries"}
        </p>
      </div>

      <div className="mt-6">
        <ActivityFeed
          groupId={group.id}
          initial={feed}
          members={group.members}
        />
      </div>
    </main>
  );
}
