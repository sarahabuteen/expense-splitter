"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

/**
 * Guests read; they never write.
 *
 * The server already refuses them — RLS grants the anon role read access to
 * demo groups only — so this is about what the UI does BEFORE that. Letting a
 * guest press Save and then showing a red error makes the app look broken. The
 * gate intercepts the intent and explains what an account gives you instead.
 *
 * Write controls stay visible and un-greyed on purpose: the patterns say not to
 * gate features behind sign-up prompts, so the product should look whole. The
 * prompt is what stops the action, not a disabled button.
 */

type GateContext = {
  isGuest: boolean;
  /** Runs `action` when signed in; opens the sign-up prompt when not. */
  requestWrite: (intent: string, action: () => void) => void;
};

const Context = createContext<GateContext>({
  isGuest: false,
  requestWrite: (_intent, action) => action(),
});

export function useGuestGate(): GateContext {
  return useContext(Context);
}

export function GuestGateProvider({
  isGuest,
  children,
}: {
  isGuest: boolean;
  children: React.ReactNode;
}) {
  const [intent, setIntent] = useState<string | null>(null);

  const requestWrite = useCallback(
    (nextIntent: string, action: () => void) => {
      if (!isGuest) {
        action();
        return;
      }
      setIntent(nextIntent);
    },
    [isGuest],
  );

  // Memoised: the React Compiler lint rejects a context value rebuilt each render.
  const value = useMemo(() => ({ isGuest, requestWrite }), [isGuest, requestWrite]);

  return (
    <Context.Provider value={value}>
      {children}

      <Dialog
        open={intent !== null}
        onClose={() => setIntent(null)}
        title="Create an account to keep going"
        description={intent ? `You're browsing as a guest, so ${intent} isn't saved.` : undefined}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setIntent(null)}>
              Keep exploring
            </Button>
            <Button asChild variant="primary">
              <Link href="/sign-up">Create an account</Link>
            </Button>
          </>
        }
      >
        <div className="px-6">
          <ul className="flex flex-col gap-3 text-sm text-text-secondary">
            <Perk>Your own groups, with whoever you actually split with</Perk>
            <Perk>Everything saved and synced across your devices</Perk>
            <Perk>Balances that keep counting after you close the tab</Perk>
          </ul>
          <p className="mt-4 text-xs text-text-tertiary">
            These sample groups stay here either way, so nothing you&rsquo;ve looked
            at is lost.
          </p>
        </div>
      </Dialog>
    </Context.Provider>
  );
}

function Perk({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-accent"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m5 12.5 4.5 4.5L19 7" />
      </svg>
      <span>{children}</span>
    </li>
  );
}
