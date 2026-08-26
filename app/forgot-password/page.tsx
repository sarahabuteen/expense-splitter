import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = {
  title: "Reset your password · Expense Splitter",
  description: "Request a link to reset your Expense Splitter password.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send you a link to set a new one."
      footer={
        <>
          Remembered it?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-accent underline underline-offset-2"
          >
            Back to sign in
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
