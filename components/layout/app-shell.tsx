"use client";

import { useState } from "react";

import { Logo } from "@/components/brand/logo";
import { NewGroupProvider } from "@/components/groups/new-group-dialog";
import { Sidebar } from "./sidebar";
import type { GroupSummary } from "@/lib/mock/groups";

/**
 * Sidebar on desktop, a drawer behind a menu button on mobile — the patterns
 * are explicit that a fixed sidebar must not be forced onto small screens.
 */
export function AppShell({
  groups,
  children,
}: {
  groups: GroupSummary[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <NewGroupProvider>
    <div className="flex min-h-full flex-1">
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-screen w-sidebar shrink-0 border-e border-border bg-bg-secondary lg:block">
        <Sidebar groups={groups} />
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-text-primary/30 backdrop-blur-[2px]"
          />
          <aside className="absolute inset-y-0 start-0 w-72 border-e border-border bg-bg-secondary shadow-lg">
            <Sidebar groups={groups} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-bg-primary/85 px-4 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            className="grid size-9 place-items-center rounded-md border border-border bg-surface text-text-primary"
          >
            <span className="sr-only">Open menu</span>
            <MenuIcon />
          </button>
          <Logo className="size-5 text-accent" />
          <span className="font-bold tracking-tight text-text-primary">Expense Splitter</span>
        </header>

        {children}
      </div>
    </div>
    </NewGroupProvider>
  );
}

function MenuIcon() {
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
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
