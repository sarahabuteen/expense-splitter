import "server-only";

import { createGuestClient } from "@/lib/supabase/server";

/**
 * The demo group a guest lands on, exposed at /guest so nobody has to look at
 * a UUID before they have even signed up.
 *
 * Same ordering as listGroups, so "the first demo group" means the same thing
 * in the sidebar, in the /groups redirect and here.
 *
 * Cached for the life of the process: the demo data is seeded, not written at
 * runtime, and proxy.ts consults this on group URLs. A failed lookup is not
 * cached, so a blip does not disable /guest until the next deploy.
 */
let cached: Promise<string | null> | null = null;

export function getGuestLandingGroupId(): Promise<string | null> {
  cached ??= load().catch((error) => {
    cached = null;
    throw error;
  });
  return cached;
}

async function load(): Promise<string | null> {
  const { data, error } = await createGuestClient()
    .from("groups")
    .select("id")
    .eq("is_demo", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data?.id as string | undefined) ?? null;
}
