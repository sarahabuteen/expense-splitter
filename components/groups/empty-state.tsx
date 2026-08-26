"use client";

import { Button } from "@/components/ui/button";
import { useNewGroup } from "./new-group-dialog";

/**
 * Action-oriented rather than barren: an empty group list is the first thing a
 * new account sees, and it should point at the next step, not apologise.
 */
export function GroupsEmptyState() {
  const { open } = useNewGroup();

  return (
    <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-16 text-center">
      <h2 className="text-lg font-semibold tracking-tight text-text-primary">No groups yet</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-text-secondary">
        A group is anywhere you share costs — a trip, a flat, a regular lunch.
        Create one and add the people you split with.
      </p>
      <Button
        type="button"
        variant="primary"
        onClick={open}
        className="mt-6"
      >
        Create your first group
      </Button>
    </div>
  );
}
