import { createRouteClient } from "@/lib/supabase/server";
import { fail, ok } from "@/lib/auth/respond";
import {
  collect,
  friendlyAuthError,
  validateEmail,
  validateName,
  validatePassword,
} from "@/lib/auth/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const displayName =
    typeof body.displayName === "string" ? body.displayName.trim() : "";

  const fieldErrors = collect({
    displayName: validateName(displayName),
    email: validateEmail(email),
    password: validatePassword(password, true),
  });
  if (Object.keys(fieldErrors).length > 0) return fail({ fieldErrors });

  const supabase = await createRouteClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // Read by the handle_new_user trigger to populate profiles.display_name.
    options: { data: { display_name: displayName } },
  });

  if (error) return fail({ formError: friendlyAuthError(error.message) });

  // With email confirmation off, sign-up returns a session and the cookie is
  // already set. With it on, there is no session until the link is clicked.
  if (!data.session) {
    return ok({ message: "Check your email to confirm your account." });
  }
  return ok({ redirectTo: "/groups" });
}
