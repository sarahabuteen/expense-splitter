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
      className="rounded-md border border-negative/30 bg-negative/5 px-3 py-2.5 text-sm text-negative"
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
      className="rounded-md border border-positive/30 bg-positive/5 px-3 py-2.5 text-sm text-positive"
    >
      {children}
    </p>
  );
}
