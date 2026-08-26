import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { GroupScreen } from "@/components/groups/group-screen";
import { getGuestLandingGroupId } from "@/lib/server/guest";
import { getActor } from "@/lib/supabase/actor";

export const metadata: Metadata = { title: "Demo · Expense Splitter" };

/**
 * The demo group under a URL a visitor can read, instead of the UUID it is
 * actually keyed by. Signing in makes this route meaningless, so it hands a
 * signed-in user back to their own groups.
 */
export default async function GuestPage({ searchParams }: PageProps<"/guest">) {
  const { userId } = await getActor();
  if (userId) redirect("/groups");

  const groupId = await getGuestLandingGroupId();
  if (!groupId) redirect("/groups");

  return <GroupScreen groupId={groupId} query={await searchParams} />;
}
