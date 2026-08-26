import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getGuestLandingGroupId } from "@/lib/server/guest";

/**
 * Next.js 16 renamed the `middleware` file convention to `proxy`; the export
 * must be named `proxy` (or be the default). See
 * node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
 *
 * This refreshes the Supabase session on every request. Without it, Server
 * Components — which cannot set cookies — would leave a refreshed token
 * stranded, and a signed-in user would silently drop to anonymous.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Touching the session is what triggers the refresh; do not remove.
  const { data } = await supabase.auth.getClaims();
  const signedIn = typeof data?.claims?.sub === "string";

  // The demo group a guest lands on has a readable home at /guest. Redirecting
  // here rather than from the page keeps it a real 307: by the time a Server
  // Component could call redirect(), the shell has already been streamed and
  // Next has to fall back to a <meta refresh>, which the visitor sees.
  const landing = await guestLandingRedirect(request, signedIn);
  if (landing) return landing;

  return response;
}

/** /groups/<the demo group> → /guest, for guests only. */
async function guestLandingRedirect(request: NextRequest, signedIn: boolean) {
  if (signedIn) return null;

  // Only ever a group's own page; its subpages keep their own URLs.
  const match = /^\/groups\/([^/]+)$/.exec(request.nextUrl.pathname);
  if (!match) return null;

  if (match[1] !== (await getGuestLandingGroupId())) return null;

  const url = request.nextUrl.clone();
  url.pathname = "/guest";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
