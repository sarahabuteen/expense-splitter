import { NextResponse } from "next/server";

import { WriteError } from "./group-write";

/**
 * Turns a thrown error into a response.
 *
 * UNAUTHENTICATED comes from requireUser() and means "sign in" — 401, and the
 * client turns it into the sign-up prompt for guests. Anything unrecognised
 * becomes a flat 500: an internal message must never reach the user.
 */
export function handleWriteError(error: unknown): NextResponse {
  if (error instanceof WriteError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof Error && error.message === "UNAUTHENTICATED") {
    return NextResponse.json(
      { error: "Sign in to make changes.", requiresAuth: true },
      { status: 401 },
    );
  }
  console.error("[groups]", error);
  return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
}
