import { createRouteClient } from "@/lib/supabase/server";
import { ok } from "@/lib/auth/respond";

export async function POST() {
  const supabase = await createRouteClient();
  await supabase.auth.signOut();
  return ok({ redirectTo: "/" });
}
