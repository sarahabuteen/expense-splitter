"use client";

import { useId, useState } from "react";

/**
 * Form fields for the auth screens.
 *
 * Labels are always visible, never placeholder-only: a placeholder disappears
 * the moment you type, so it fails anyone who looks away mid-form, and screen
 * readers treat it as a hint rather than a name.
 *
 * Each field owns an error slot wired through aria-describedby, so wiring
 * validation later means passing an `error` string and nothing else.
 */

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  inputMode?: "text" | "email";
  required?: boolean;
  hint?: string;
  error?: string;
};

export function TextField({
  label,
  name,
  type = "text",
  autoComplete,
  inputMode,
  required,
  hint,
  error,
}: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-text-primary">
        {label}
        {required ? (
          <span aria-hidden="true" className="ms-1 text-owe">
            *
          </span>
        ) : null}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className="h-11 rounded-md border border-border bg-surface px-3 text-base text-text-primary
                   shadow-sm transition-colors hover:border-text-secondary/40
                   focus:border-accent aria-[invalid=true]:border-owe"
      />
      {hint ? (
        <p id={hintId} className="text-xs text-text-secondary">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-owe">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function PasswordField({
  label,
  name,
  autoComplete,
  required,
  hint,
  error,
}: Omit<FieldProps, "type" | "inputMode">) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-text-primary">
        {label}
        {required ? (
          <span aria-hidden="true" className="ms-1 text-owe">
            *
          </span>
        ) : null}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          aria-required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className="h-11 w-full rounded-md border border-border bg-surface ps-3 pe-12 text-base text-text-primary
                     shadow-sm transition-colors hover:border-text-secondary/40
                     focus:border-accent aria-[invalid=true]:border-owe"
        />
        {/*
          A visibility toggle beats a "confirm password" field: it lets people
          check what they typed instead of typing it twice, and it is the one
          affordance that reliably reduces password-entry errors on mobile.
        */}
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          className="absolute end-1 top-1 grid h-9 w-10 place-items-center rounded
                     text-text-secondary transition-colors hover:text-text-primary"
        >
          <span className="sr-only">
            {visible ? "Hide password" : "Show password"}
          </span>
          <EyeIcon crossed={visible} />
        </button>
      </div>
      {hint ? (
        <p id={hintId} className="text-xs text-text-secondary">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-owe">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function EyeIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.6" />
      {crossed ? <path d="m4 20 16-16" /> : null}
    </svg>
  );
}
