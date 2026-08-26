import { NextResponse } from "next/server";

import { createRouteClient } from "@/lib/supabase/server";

/**
 * Exchanges the code from an emailed link (password reset, and email
 * confirmation if it is ever turned back on) for a session cookie.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/groups";

  // Only same-origin paths. Without this, a crafted link in a trusted-looking
  // email could turn this route into an open redirect.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/groups";

  if (!code) {
    return NextResponse.redirect(new URL("/sign-in?error=link", url.origin));
  }

  const supabase = await createRouteClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/sign-in?error=link", url.origin));
  }
  return NextResponse.redirect(new URL(safeNext, url.origin));
}
