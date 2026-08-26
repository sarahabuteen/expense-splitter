"use client";

import { Button } from "@/components/ui/button";

/** The id the composer's amount field carries, so the header can reach it. */
export const AMOUNT_FIELD_ID = "composer-amount";

/**
 * The header's "Add expense".
 *
 * It focuses the composer's amount field rather than opening anything: the
 * composer is already on the page, and its fast path is this one field. A
 * modal here would hide the ledger people copy amounts from, which is exactly
 * why the composer is an inline row in the first place.
 *
 * A client component because the page around it is a Server Component, and
 * this needs a click handler — which is what the button was missing.
 */
export function AddExpenseButton() {
  return (
    <Button
      type="button"
      variant="primary"
      onClick={() => {
        const field = document.getElementById(AMOUNT_FIELD_ID);
        if (!field) return;
        // Scroll first, then focus: focus() alone jumps the field to the top
        // of the viewport with the composer's label cropped above it.
        field.scrollIntoView({ behavior: "smooth", block: "center" });
        field.focus({ preventScroll: true });
      }}
    >
      <PlusIcon />
      Add expense
    </Button>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
