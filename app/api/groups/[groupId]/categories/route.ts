import { NextResponse } from "next/server";

import { createCategory } from "@/lib/server/group-write";
import { handleWriteError } from "@/lib/server/respond";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  try {
    const { groupId } = await params;
    const body = await request.json().catch(() => ({}));
    const result = await createCategory(
      groupId,
      typeof body.name === "string" ? body.name : "",
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleWriteError(error);
  }
}
