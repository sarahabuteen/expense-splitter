"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

/**
 * One polite live region for the whole app.
 *
 * Writes here happen in a dialog that then closes, or in a form that then
 * re-renders from the server, so the region cannot live inside the thing that
 * caused it — it would unmount before a screen reader read it. It sits in the
 * shell instead, and anything below calls `announce()`.
 *
 * Polite, never assertive: a recorded settlement is confirmation, not an
 * emergency, and interrupting mid-sentence is the rudest thing a live region
 * can do. Errors keep their own role="alert" next to the field they belong to.
 */
const Context = createContext<(message: string) => void>(() => {});

export function useAnnounce() {
  return useContext(Context);
}

export function Announcer({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState("");

  const announce = useCallback((next: string) => {
    // Re-announce an identical message: without the reset, a second settlement
    // for the same amount would not change the node and would stay silent.
    setMessage((current) => (current === next ? `${next} ` : next));
  }, []);

  const value = useMemo(() => announce, [announce]);

  return (
    <Context.Provider value={value}>
      {children}
      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {message}
      </p>
    </Context.Provider>
  );
}
