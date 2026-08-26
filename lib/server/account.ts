import "server-only";

import { createRouteClient } from "@/lib/supabase/server";
import { getActor } from "@/lib/supabase/actor";

export type Account = { name: string; email: string };

/**
 * Who is signed in, for display in the sidebar.
 *
 * Returns null for a guest, which is what the nav uses to decide between an
 * account row and a sign-up invitation.
 */
export async function getAccount(): Promise<Account | null> {
  const { userId } = await getActor();
  if (!userId) return null;

  const db = await createRouteClient();
  const [{ data: profile }, { data: auth }] = await Promise.all([
    db.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
    db.auth.getUser(),
  ]);

  const email = auth.user?.email ?? "";
  return {
    // Falls back to the email's local part rather than showing a blank row.
    name: (profile?.display_name as string | null)?.trim() || email.split("@")[0] || "You",
    email,
  };
}
