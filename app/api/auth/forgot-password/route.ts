import { createRouteClient } from "@/lib/supabase/server";
import { fail, ok } from "@/lib/auth/respond";
import { collect, validateEmail } from "@/lib/auth/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  const fieldErrors = collect({ email: validateEmail(email) });
  if (Object.keys(fieldErrors).length > 0) return fail({ fieldErrors });

  const origin = new URL(request.url).origin;
  const supabase = await createRouteClient();

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  // Always the same answer, whether or not the account exists — otherwise this
  // endpoint becomes a way to enumerate registered email addresses.
  return ok({
    message: "If an account exists for that email, a reset link is on its way.",
  });
}
