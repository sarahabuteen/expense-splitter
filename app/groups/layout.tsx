import { AppShell } from "@/components/layout/app-shell";
import { getAccount } from "@/lib/server/account";
import { getActor } from "@/lib/supabase/actor";
import { listGroups } from "@/lib/server/groups";

export default async function GroupsLayout({ children }: LayoutProps<"/groups">) {
  const [groups, { userId }, account] = await Promise.all([
    listGroups(),
    getActor(),
    getAccount(),
  ]);
  return (
    <AppShell groups={groups} isGuest={!userId} account={account}>
      {children}
    </AppShell>
  );
}
