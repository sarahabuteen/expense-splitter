import { NextResponse } from "next/server";

import { searchCurrencies } from "@/lib/currencies";

/**
 * Currency search. The matching and ranking happen here rather than in the
 * combobox, so every sort in the app is decided server-side.
 */
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  return NextResponse.json({ currencies: searchCurrencies(query) });
}
