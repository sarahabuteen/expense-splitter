import { createRouteClient } from "@/lib/supabase/server";
import { fail, ok } from "@/lib/auth/respond";
import {
  collect,
  friendlyAuthError,
  validateEmail,
  validatePassword,
} from "@/lib/auth/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  const fieldErrors = collect({
    email: validateEmail(email),
    password: validatePassword(password),
  });
  if (Object.keys(fieldErrors).length > 0) return fail({ fieldErrors });

  const supabase = await createRouteClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  // Deliberately a form-level error, not a field-level one: saying which of the
  // two was wrong tells an attacker whether the account exists.
  if (error) return fail({ formError: friendlyAuthError(error.message) }, 401);

  return ok({ redirectTo: "/groups" });
}
