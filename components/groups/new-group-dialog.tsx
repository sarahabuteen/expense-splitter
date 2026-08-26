"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { CurrencySelect } from "./currency-select";
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
  const open = useCallback(() => setIsOpen(true), []);
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
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  // The creator is always the first member; that is what makes "your balance"
  // resolvable in a brand-new group.
  const [chips, setChips] = useState<Chip[]>([
    { key: "you", name: "You", color: "indigo" },
  ]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    // Calling a DOM method, not assigning to one — the compiler lint allows this.
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="new-group-title"
      /*
        m-auto is load-bearing: Tailwind's preflight resets `margin: 0` on every
        element, which overrides the UA stylesheet's `margin: auto` on an open
        modal dialog — without it the dialog pins to the top-left corner.
      */
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xl border border-border bg-surface p-0 text-text-primary shadow-lg backdrop:bg-black/50 backdrop:backdrop-blur-[2px]"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onClose();
          // UI only: nothing is persisted. Landing in the group you just made
          // is navigation to the result, not a continuation of the task.
          router.push("/groups/grp_new");
        }}
      >
        <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-5">
          <h2 id="new-group-title" className="text-lg font-bold tracking-tight">
            New group
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="-me-2 -mt-1"
          >
            <span className="sr-only">Close</span>
            <CloseIcon />
          </Button>
        </div>

        <div className="flex flex-col gap-4 px-6">
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
              /* The one field that always needs filling, so it takes focus. */
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
              Names are enough — nobody needs an account. Emails, if anyone has
              one, can be added in group settings.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="ng-currency" className="text-sm font-medium">
              Default currency
            </label>
            <CurrencySelect
              id="ng-currency"
              name="currency"
              describedBy="ng-currency-hint"
            />
            <p id="ng-currency-hint" className="text-xs text-text-secondary">
              Balances settle in this currency. Expenses can be in any currency.
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-border px-6 py-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Create group
          </Button>
        </div>
      </form>
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
