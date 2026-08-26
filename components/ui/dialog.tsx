"use client";

import { useEffect, useRef } from "react";

import { Button } from "./button";

/**
 * One dialog implementation for the whole app.
 *
 * Built on native <dialog>, so focus trapping, Escape, background inertness and
 * the top layer come from the platform rather than being reimplemented.
 *
 * Adds the three things it does not give you for free:
 *   - a close button, always
 *   - click-outside to dismiss
 *   - open/close animation (see the `dialog` rules in globals.css)
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  footer,
  width = "28rem",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  footer?: React.ReactNode;
  width?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = `${title.replace(/\W+/g, "-").toLowerCase()}-title`;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    // Method calls, not property assignment — the compiler lint allows these.
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      // The backdrop is part of the <dialog> element itself, so a click that
      // lands on the element rather than its contents is a click outside.
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      aria-labelledby={titleId}
      style={{ width: `min(${width}, calc(100vw - 2rem))` }}
      // m-auto is load-bearing: Tailwind's preflight resets margin on every
      // element, overriding the UA stylesheet's `margin: auto` that centres an
      // open modal — without it the dialog pins to the top-left corner.
      className="m-auto rounded-xl border border-border bg-surface p-0 text-text-primary shadow-lg"
    >
      <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-5">
        <div className="min-w-0">
          <h2 id={titleId} className="text-lg font-bold tracking-tight">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-text-secondary">{description}</p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="-me-2 -mt-1 shrink-0"
        >
          <span className="sr-only">Close</span>
          <CloseIcon />
        </Button>
      </div>

      {children}

      {footer ? (
        <div className="mt-5 flex justify-end gap-2 border-t border-border px-6 py-4">
          {footer}
        </div>
      ) : null}
    </dialog>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
