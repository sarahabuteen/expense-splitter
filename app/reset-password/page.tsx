import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = {
  title: "Choose a new password · Expense Splitter",
  description: "Set a new password for your Expense Splitter account.",
};

/**
 * Reached from the emailed link, which passes through /auth/callback first —
 * that exchanges the code for a session, which is what authorises the update.
 */
export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Choose a new password"
      subtitle="You're signed in from the reset link. Pick a new password to finish."
      footer={
        <>
          Changed your mind?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-accent underline underline-offset-2"
          >
            Back to sign in
          </Link>
        </>
      }
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
