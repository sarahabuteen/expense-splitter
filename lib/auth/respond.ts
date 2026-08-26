import { NextResponse } from "next/server";

import type { FieldErrors } from "./validation";

/** Uniform shape so every form can handle every response the same way. */
export type AuthResponse =
  | { ok: true; redirectTo?: string; message?: string }
  | { ok: false; formError?: string; fieldErrors?: FieldErrors };

export function ok(body: Omit<Extract<AuthResponse, { ok: true }>, "ok"> = {}) {
  return NextResponse.json({ ok: true, ...body } satisfies AuthResponse);
}

export function fail(
  body: Omit<Extract<AuthResponse, { ok: false }>, "ok">,
  status = 400,
) {
  return NextResponse.json({ ok: false, ...body } satisfies AuthResponse, {
    status,
  });
}
