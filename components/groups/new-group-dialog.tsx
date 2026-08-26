"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { ApiError, groupsApi } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { useGuestGate } from "@/components/auth/guest-gate";
import { Dialog } from "@/components/ui/dialog";
import { CurrencyCombobox } from "@/components/ui/currency-combobox";
import { MemberChipsInput, type Chip } from "./member-chips-input";

/**
 * Creating a group is a small task, so it happens in place rather than on its
 * own route — navigating away loses the context you were in and makes
 * cancelling feel like a mistake to undo.
 *
 * The whole task finishes here. Starting in a modal and continuing on a page
 * is a context switch mid-task — you should not have to change surfaces to
 * finish one thing.
 *
 * Members fit because they are chips, not rows: ten people wrap into about
 * three lines instead of ~560px of list, so the dialog never needs to scroll.
 *
 * A native <dialog> gives focus trapping, Escape-to-close and background
 * inertness from the platform instead of reimplementing all three.
 */

type NewGroupContext = { open: () => void };

const Context = createContext<NewGroupContext | null>(null);

export function useNewGroup(): NewGroupContext {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useNewGroup must be used inside <NewGroupProvider>");
  return ctx;
}

export function NewGroupProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const { requestWrite } = useGuestGate();
  // A guest never even reaches the form — the prompt is what stops them.
  const open = useCallback(
    () => requestWrite("creating a group", () => setIsOpen(true)),
    [requestWrite],
  );
  // Memoised: the React Compiler lint rejects a context value rebuilt each render.
  const value = useMemo(() => ({ open }), [open]);

  return (
    <Context.Provider value={value}>
      {children}
      <NewGroupDialog isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </Context.Provider>
  );
}

function NewGroupDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  // The creator is always the first member; that is what makes "your balance"
  // resolvable in a brand-new group.
  const [chips, setChips] = useState<Chip[]>([
    { key: "you", name: "You", color: "indigo" },
  ]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title="New group"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="new-group-form"
            variant="primary"
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? "Creating…" : "Create group"}
          </Button>
        </>
      }
    >
      <form
        id="new-group-form"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setPending(true);
          setError(null);
          try {
            const { id } = await groupsApi.create({
              name: String(form.get("name") ?? ""),
              currency: String(form.get("currency") ?? "USD"),
              // The first chip is the creator, added server-side from the
              // signed-in profile — sending it again would duplicate them.
              memberNames: chips.slice(1).map((c) => c.name),
            });
            onClose();
            setChips([{ key: "you", name: "You", color: "indigo" }]);
            router.push(`/groups/${id}`);
            // Server Components hold the sidebar's group list, so it needs to
            // re-read for the new group to appear in the nav.
            router.refresh();
          } catch (err) {
            setError(
              err instanceof ApiError
                ? err.requiresAuth
                  ? "Sign in to create a group of your own."
                  : err.message
                : "Something went wrong.",
            );
          } finally {
            setPending(false);
          }
        }}
        className="flex flex-col gap-4 px-6"
      >
        {error ? (
          <p
            role="alert"
            className="rounded-md border border-owe/30 bg-owe-subtle px-3 py-2 text-sm text-owe"
          >
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="ng-name" className="text-sm font-medium">
            Group name
          </label>
          <input
            id="ng-name"
            name="name"
            required
            aria-required
            placeholder="Trip to Japan"
            autoFocus
            className="h-10 rounded-md border border-border bg-bg-primary px-3 text-base transition-colors focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="ng-members" className="text-sm font-medium">
            Split with
          </label>
          <MemberChipsInput
            id="ng-members"
            chips={chips}
            onChange={setChips}
            describedBy="ng-members-hint"
          />
          <p id="ng-members-hint" className="text-xs text-text-secondary">
            Names are enough. Nobody needs an account, and emails can be added
            later in group settings.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="ng-currency" className="text-sm font-medium">
            Default currency
          </label>
          <CurrencyCombobox
            id="ng-currency"
            name="currency"
            describedBy="ng-currency-hint"
          />
          <p id="ng-currency-hint" className="text-xs text-text-secondary">
            Balances settle in this currency. Expenses can be in any currency.
          </p>
        </div>
      </form>
    </Dialog>
  );
}
