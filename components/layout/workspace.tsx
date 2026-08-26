import { AppShell } from "./app-shell";
import { getAccount } from "@/lib/server/account";
import { getActor } from "@/lib/supabase/actor";
import { listGroups } from "@/lib/server/groups";

/**
 * The app chrome with its data loaded: sidebar, mobile drawer, guest gate.
 * Shared by the /groups layout and the /guest layout so the demo lands in the
 * same shell rather than a second copy of it.
 */
export async function Workspace({ children }: { children: React.ReactNode }) {
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
