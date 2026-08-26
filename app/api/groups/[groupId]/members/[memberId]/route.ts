import { NextResponse } from "next/server";

import { handleWriteError } from "@/lib/server/respond";
import { removeMember } from "@/lib/server/group-write";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ groupId: string; memberId: string }> },
) {
  try {
    const { groupId, memberId } = await params;
    return NextResponse.json(await removeMember(groupId, memberId));
  } catch (error) {
    return handleWriteError(error);
  }
}
