import { NextResponse } from "next/server";

import { createSettlement } from "@/lib/server/settlement-write";
import { handleWriteError } from "@/lib/server/respond";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  try {
    const { groupId } = await params;
    const body = await request.json().catch(() => ({}));
    const result = await createSettlement(groupId, {
      fromMember: typeof body.fromMember === "string" ? body.fromMember : "",
      toMember: typeof body.toMember === "string" ? body.toMember : "",
      amountMinor:
        typeof body.amountMinor === "number" && Number.isFinite(body.amountMinor)
          ? Math.round(body.amountMinor)
          : 0,
      currency: typeof body.currency === "string" ? body.currency : "",
      date: typeof body.date === "string" ? body.date : "",
      exchangeRate:
        typeof body.exchangeRate === "number" && body.exchangeRate > 0
          ? body.exchangeRate
          : undefined,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleWriteError(error);
  }
}
