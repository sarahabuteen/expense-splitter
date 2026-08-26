import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = {
  title: "Create an account · Expense Splitter",
  description: "Create an Expense Splitter account to save your groups.",
};

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Keep your groups, expenses and balances in sync across devices."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-brand underline underline-offset-2"
          >
            Sign in
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthShell>
  );
}
