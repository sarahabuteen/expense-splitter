import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = {
  title: "Sign in · Expense Splitter",
  description: "Sign in to your Expense Splitter account.",
};

export default function SignInPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to pick up where your groups left off."
      footer={
        <>
          New here?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-accent underline underline-offset-2"
          >
            Create an account
          </Link>
        </>
      }
    >
      <SignInForm />
    </AuthShell>
  );
}
