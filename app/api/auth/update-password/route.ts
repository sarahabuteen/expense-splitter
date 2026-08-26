import { createRouteClient } from "@/lib/supabase/server";
import { fail, ok } from "@/lib/auth/respond";
import { collect, friendlyAuthError, validatePassword } from "@/lib/auth/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";

  const fieldErrors = collect({ password: validatePassword(password, true) });
  if (Object.keys(fieldErrors).length > 0) return fail({ fieldErrors });

  const supabase = await createRouteClient();

  // The reset link established a session via /auth/callback; without one there
  // is nothing to update, and this must not silently succeed.
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) {
    return fail({ formError: "That reset link has expired. Request a new one." }, 401);
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return fail({ formError: friendlyAuthError(error.message) });

  return ok({ redirectTo: "/groups" });
}
