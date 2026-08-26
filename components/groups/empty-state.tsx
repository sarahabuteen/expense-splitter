"use client";

import { Button } from "@/components/ui/button";
import { EmptyGroupsIllustration } from "@/components/ui/empty-illustration";
import { useNewGroup } from "./new-group-dialog";

/**
 * No groups at all — the first thing a new account sees.
 *
 * Built to match the in-group empty state exactly: same card, same
 * illustration language, same heading-body-action rhythm, so the two read as
 * one family rather than two different designers' work.
 */
export function GroupsEmptyState() {
  const { open } = useNewGroup();

  return (
    <div className="w-full rounded-lg border border-border bg-surface px-6 py-14">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <EmptyGroupsIllustration className="w-full max-w-[17rem]" />

        <h2 className="mt-6 text-lg font-bold tracking-tight">No groups yet</h2>

        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          A group is anywhere you share costs: a trip, a flat, a regular lunch.
          Create one and add the people you split with.
        </p>

        <div className="mt-6">
          <Button type="button" variant="primary" onClick={open}>
            Create your first group
          </Button>
        </div>

        <ul className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-text-secondary">
          <Hint>Add people by name, nobody needs an account</Hint>
          <Hint>Settle in any of 35 currencies</Hint>
        </ul>
      </div>
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-1.5">
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="size-3.5 shrink-0 text-accent"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m5 12.5 4.5 4.5L19 7" />
      </svg>
      {children}
    </li>
  );
}
