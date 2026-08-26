"use client";

import Link from "next/link";

import { PasswordField, TextField } from "./fields";
import { FormError, FormMessage } from "./form-status";
import { useAuthForm } from "./use-auth-form";

export function SignInForm() {
  const { onSubmit, pending, formError, fieldErrors } = useAuthForm("/api/auth/sign-in");

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FormError>{formError}</FormError>

      <TextField
        label="Email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        error={fieldErrors.email}
      />

      <div className="flex flex-col gap-1.5">
        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          required
          error={fieldErrors.password}
        />
        <Link
          href="/forgot-password"
          className="self-end text-xs font-medium text-brand underline underline-offset-2 hover:no-underline"
        >
          Forgot your password?
        </Link>
      </div>

      <SubmitButton pending={pending} pendingLabel="Signing in…">
        Sign in
      </SubmitButton>
      <GuestAction />
    </form>
  );
}

export function SignUpForm() {
  const { onSubmit, pending, formError, fieldErrors, message } =
    useAuthForm("/api/auth/sign-up");

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FormError>{formError}</FormError>
      <FormMessage>{message}</FormMessage>

      <TextField
        label="Name"
        name="displayName"
        autoComplete="name"
        required
        hint="Shown to people you share groups with."
        error={fieldErrors.displayName}
      />
      <TextField
        label="Email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        error={fieldErrors.email}
      />
      <PasswordField
        label="Password"
        name="password"
        autoComplete="new-password"
        required
        hint="At least 8 characters."
        error={fieldErrors.password}
      />

      <SubmitButton pending={pending} pendingLabel="Creating account…">
        Create account
      </SubmitButton>
      <GuestAction />
    </form>
  );
}

export function ForgotPasswordForm() {
  const { onSubmit, pending, formError, fieldErrors, message } = useAuthForm(
    "/api/auth/forgot-password",
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FormError>{formError}</FormError>
      <FormMessage>{message}</FormMessage>

      <TextField
        label="Email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        error={fieldErrors.email}
      />

      <SubmitButton pending={pending} pendingLabel="Sending…">
        Send reset link
      </SubmitButton>
    </form>
  );
}

export function ResetPasswordForm() {
  const { onSubmit, pending, formError, fieldErrors } = useAuthForm(
    "/api/auth/update-password",
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FormError>{formError}</FormError>

      <PasswordField
        label="New password"
        name="password"
        autoComplete="new-password"
        required
        hint="At least 8 characters."
        error={fieldErrors.password}
      />

      <SubmitButton pending={pending} pendingLabel="Saving…">
        Save new password
      </SubmitButton>
    </form>
  );
}

function SubmitButton({
  children,
  pending,
  pendingLabel,
}: {
  children: React.ReactNode;
  pending: boolean;
  pendingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      // aria-busy rather than only a label swap, so the state is announced.
      aria-busy={pending}
      className="h-11 rounded-md bg-brand px-4 font-semibold text-brand-ink shadow-sm
                 transition-all hover:opacity-90 active:scale-[0.99]
                 disabled:cursor-not-allowed disabled:opacity-70 disabled:active:scale-100"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

/**
 * A real secondary button, not a text link. Guest mode is how almost everyone
 * will actually see this product, so it deserves weight comparable to the
 * primary action rather than being tucked into a sentence.
 */
function GuestAction() {
  return (
    <>
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs text-ink-muted">or</span>
        <span className="h-px flex-1 bg-line" />
      </div>
      <Link
        href="/groups"
        className="grid h-11 place-items-center rounded-md border border-line bg-surface
                   px-4 font-medium text-ink transition-colors hover:bg-surface-2"
      >
        Explore as a guest
      </Link>
    </>
  );
}
