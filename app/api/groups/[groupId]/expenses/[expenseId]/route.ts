import { NextResponse } from "next/server";

import { deleteExpense, updateExpense } from "@/lib/server/expense-write";
import { handleWriteError } from "@/lib/server/respond";
import { parseExpenseBody } from "../parse";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ groupId: string; expenseId: string }> },
) {
  try {
    const { groupId, expenseId } = await params;
    const body = await request.json().catch(() => ({}));
    return NextResponse.json(
      await updateExpense(groupId, expenseId, parseExpenseBody(body)),
    );
  } catch (error) {
    return handleWriteError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ groupId: string; expenseId: string }> },
) {
  try {
    const { groupId, expenseId } = await params;
    return NextResponse.json(await deleteExpense(groupId, expenseId));
  } catch (error) {
    return handleWriteError(error);
  }
}
