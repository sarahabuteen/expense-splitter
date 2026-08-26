import { NextResponse } from "next/server";

import { addMember } from "@/lib/server/group-write";
import { handleWriteError } from "@/lib/server/respond";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  try {
    const { groupId } = await params;
    const body = await request.json().catch(() => ({}));
    const result = await addMember(groupId, {
      name: typeof body.name === "string" ? body.name : "",
      email: typeof body.email === "string" ? body.email : undefined,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleWriteError(error);
  }
}
