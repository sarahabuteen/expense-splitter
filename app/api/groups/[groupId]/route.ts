import { NextResponse } from "next/server";

import { deleteGroup, updateGroup } from "@/lib/server/group-write";
import { getGroup } from "@/lib/server/groups";
import { handleWriteError } from "@/lib/server/respond";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await params;
  const group = await getGroup(groupId);
  if (!group) {
    return NextResponse.json({ error: "Group not found." }, { status: 404 });
  }
  return NextResponse.json({ group });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  try {
    const { groupId } = await params;
    const body = await request.json().catch(() => ({}));
    const result = await updateGroup(groupId, {
      name: typeof body.name === "string" ? body.name : undefined,
      description: typeof body.description === "string" ? body.description : undefined,
      currency: typeof body.currency === "string" ? body.currency : undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleWriteError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  try {
    const { groupId } = await params;
    return NextResponse.json(await deleteGroup(groupId));
  } catch (error) {
    return handleWriteError(error);
  }
}
