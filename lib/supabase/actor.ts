import "server-only";

import { createRouteClient } from "./server";

/**
 * Two ways to identify the caller, with different costs and guarantees.
 *
 * `getActor` verifies the JWT locally — cheap, no round-trip — and is right for
 * reads. `requireUser` round-trips to the Auth server, which is what mutations
 * must use: a revoked session would still pass local verification until the
 * token expires.
 */

export type Actor = { userId: string } | { userId: null };

export async function getActor(): Promise<Actor> {
  const supabase = await createRouteClient();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  return { userId: typeof sub === "string" ? sub : null };
}

export async function requireUser(): Promise<{ userId: string }> {
  const supabase = await createRouteClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("UNAUTHENTICATED");
  return { userId: data.user.id };
}
