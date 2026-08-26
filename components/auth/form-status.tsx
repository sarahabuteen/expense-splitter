"use client";

/**
 * Form-level feedback. Both live in aria-live regions so a screen reader hears
 * the outcome without having to hunt for it after submitting.
 */
export function FormError({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="rounded-md border border-owe/30 bg-owe/5 px-3 py-2.5 text-sm text-owe"
    >
      {children}
    </p>
  );
}

export function FormMessage({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p
      role="status"
      className="rounded-md border border-owed/30 bg-owed/5 px-3 py-2.5 text-sm text-owed"
    >
      {children}
    </p>
  );
}
