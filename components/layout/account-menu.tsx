"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import type { Account } from "@/lib/server/account";

/**
 * The account row, with theme and sign-out behind it.
 *
 * The sidebar footer had grown to three stacked blocks — create, theme,
 * account — which is more chrome than the nav it sits under. Theme and
 * sign-out are both "settings about me", so they belong together behind the
 * one control that identifies me.
 *
 * The panel expands upward in place rather than floating: the sidebar has the
 * room, and inline avoids positioning against a scrolling container entirely.
 */
export function AccountMenu({ account }: { account: Account | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function signOut() {
    setPending(true);
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
      router.push("/");
      // The session cookie was cleared server-side, so every Server Component
      // has to re-read or the nav would still show the account.
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      {open ? (
        <div className="mb-1 rounded-md border border-border bg-surface p-1 shadow-md">
          <div className="flex items-center justify-between gap-2 px-2 py-1.5">
            <span className="text-xs text-text-secondary">Theme</span>
            <ThemeToggle />
          </div>

          {account ? (
            <>
              <div className="my-1 border-t border-border" />
              <button
                type="button"
                onClick={() => void signOut()}
                disabled={pending}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary disabled:opacity-60"
              >
                <SignOutIcon />
                {pending ? "Signing out…" : "Sign out"}
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-2 text-start transition-colors hover:bg-bg-tertiary"
        >
          <span
            aria-hidden="true"
            className={`grid size-7 shrink-0 place-items-center rounded-full text-[0.625rem] font-semibold ${
              account ? "bg-accent text-white" : "border border-border text-text-secondary"
            }`}
          >
            {account ? account.name.slice(0, 1).toUpperCase() : "G"}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-medium text-text-primary">
              {account ? account.name : "Guest"}
            </span>
            <span className="block truncate text-[0.625rem] text-text-secondary">
              {account ? account.email : "Nothing is saved"}
            </span>
          </span>
          <ChevronIcon open={open} />
        </button>

        {account ? null : (
          <Button asChild variant="primary" className="h-8 shrink-0 px-3 text-xs">
            <Link href="/sign-up">Sign up</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`size-3.5 shrink-0 text-text-tertiary transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 17l5-5-5-5M20 12H9M12 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6" />
    </svg>
  );
}
