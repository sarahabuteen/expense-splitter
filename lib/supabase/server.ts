import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * The browser never talks to Supabase directly — there is no browser client
 * anywhere in this app, auth included. Every query goes through a route handler
 * or Server Component using one of the three clients below.
 *
 * RLS is the authorization boundary in all three cases. A handler that forgets
 * an ownership filter still leaks nothing, because Postgres refuses the rows.
 */

function env(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

/**
 * Acts AS the signed-in user, reading the session from cookies. This is the
 * default client for anything a user does.
 */
export async function createRouteClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient(
    env("SUPABASE_URL"),
    env("SUPABASE_PUBLISHABLE_KEY"),
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components cannot set cookies. Safe to ignore: proxy.ts
            // refreshes the session on every request.
          }
        },
      },
    },
  );
}

/**
 * Carries no session, so it reads exactly what the `anon` role may read —
 * which is the demo groups, and nothing else. This is guest mode; it needs no
 * special-casing beyond using this client.
 */
export function createGuestClient(): SupabaseClient {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_PUBLISHABLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Bypasses RLS entirely. Reserved for seeding demo data, which no role is
 * allowed to write. Never use this to serve a user request.
 */
export function createAdminClient(): SupabaseClient {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
