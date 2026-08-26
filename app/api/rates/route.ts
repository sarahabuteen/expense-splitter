import { NextResponse } from "next/server";

import { getRate } from "@/lib/server/rates";

/**
 * Lets the composer preview a conversion before saving.
 *
 * `rate: null` with a 200 is a normal answer, not an error — the rate service
 * being unavailable should show "enter one manually", not a failure state.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const from = url.searchParams.get("from") ?? "";
  const to = url.searchParams.get("to") ?? "";

  if (!from || !to) {
    return NextResponse.json({ error: "Specify from and to." }, { status: 400 });
  }

  try {
    return NextResponse.json({ rate: await getRate(from, to), from, to });
  } catch {
    return NextResponse.json({ rate: null, from, to });
  }
}
