import { NextResponse } from "next/server";

import { deleteSettlement } from "@/lib/server/settlement-write";
import { handleWriteError } from "@/lib/server/respond";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ groupId: string; settlementId: string }> },
) {
  try {
    const { groupId, settlementId } = await params;
    return NextResponse.json(await deleteSettlement(groupId, settlementId));
  } catch (error) {
    return handleWriteError(error);
  }
}
