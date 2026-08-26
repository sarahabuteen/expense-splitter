"use client";

import { useRef, useState } from "react";

import { ExpenseComposer, type EditableExpense } from "@/components/expenses/expense-composer";
import { Ledger } from "./ledger";
import type { CategoryTotal, Filters } from "@/lib/filters";
import type { ActivityRow } from "@/lib/types";
import type { GroupPage } from "@/lib/server/group-page";

/**
 * Holds the one piece of state the composer and the ledger share: which
 * expense is being edited.
 *
 * Editing reuses the composer rather than opening a second form — the two would
 * drift, and you would learn the layout twice.
 */
export function GroupWorkspace({
  group,
  rows,
  totals,
  filters,
  usedCategories,
}: {
  group: GroupPage;
  /** Already filtered on the server. */
  rows: ActivityRow[];
  /** Already aggregated on the server. */
  totals: CategoryTotal[];
  filters: Filters;
  usedCategories: string[];
}) {
  const [editing, setEditing] = useState<EditableExpense | null>(null);
  const composerRef = useRef<HTMLDivElement>(null);

  function edit(expense: EditableExpense) {
    setEditing(expense);
    // The composer sits above the ledger, so an edit started from a row far
    // down the page would otherwise happen off-screen.
    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="flex flex-col gap-6">
      <div ref={composerRef}>
        <ExpenseComposer
          // Remounting on change is what lets the composer initialise from the
          // expense being edited instead of syncing props into state.
          key={editing?.id ?? "new"}
          groupId={group.id}
          members={group.members}
          currency={group.currency}
          categories={group.categories}
          editing={editing}
          onCancelEdit={() => setEditing(null)}
        />
      </div>

      <Ledger
        group={group}
        rows={rows}
        totals={totals}
        filters={filters}
        usedCategories={usedCategories}
        editingId={editing?.id ?? null}
        onEdit={edit}
      />
    </div>
  );
}
