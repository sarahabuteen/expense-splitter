import { NextResponse } from "next/server";

import { createExpense } from "@/lib/server/expense-write";
import { handleWriteError } from "@/lib/server/respond";
import { parseExpenseBody } from "./parse";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  try {
    const { groupId } = await params;
    const body = await request.json().catch(() => ({}));
    return NextResponse.json(await createExpense(groupId, parseExpenseBody(body)), {
      status: 201,
    });
  } catch (error) {
    return handleWriteError(error);
  }
}
