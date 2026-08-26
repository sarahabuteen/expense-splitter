"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import type { FieldErrors } from "@/lib/auth/validation";

type State = {
  pending: boolean;
  formError: string | null;
  fieldErrors: FieldErrors;
  message: string | null;
};

const IDLE: State = { pending: false, formError: null, fieldErrors: {}, message: null };

/**
 * Submits an auth form to its route handler and maps the response back onto
 * the form. Every endpoint returns the same shape, so this handles all of them.
 *
 * Form data is never cleared on failure — losing what someone typed because the
 * server said no is its own bug.
 */
export function useAuthForm(endpoint: string) {
  const router = useRouter();
  const [state, setState] = useState<State>(IDLE);

  const onSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;
      const payload = Object.fromEntries(new FormData(form));

      setState({ ...IDLE, pending: true });

      let result: {
        ok?: boolean;
        redirectTo?: string;
        message?: string;
        formError?: string;
        fieldErrors?: FieldErrors;
      };

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        result = await response.json();
      } catch {
        setState({
          ...IDLE,
          formError: "Couldn't reach the server. Check your connection and try again.",
        });
        return;
      }

      if (!result.ok) {
        setState({
          pending: false,
          formError: result.formError ?? null,
          fieldErrors: result.fieldErrors ?? {},
          message: null,
        });
        return;
      }

      if (result.redirectTo) {
        // router.push + refresh, not window.location: the session cookie was
        // just set server-side and the Server Components need to re-read it.
        router.push(result.redirectTo);
        router.refresh();
        return;
      }

      setState({ ...IDLE, message: result.message ?? null });
    },
    [endpoint, router],
  );

  return { ...state, onSubmit };
}
