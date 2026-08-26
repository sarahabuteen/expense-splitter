import { NextResponse } from "next/server";

import { createGroup } from "@/lib/server/group-write";
import { handleWriteError } from "@/lib/server/respond";
import { listGroups } from "@/lib/server/groups";

export async function GET() {
  try {
    return NextResponse.json({ groups: await listGroups() });
  } catch (error) {
    return handleWriteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = await createGroup({
      name: typeof body.name === "string" ? body.name : "",
      description: typeof body.description === "string" ? body.description : undefined,
      currency: typeof body.currency === "string" ? body.currency : "USD",
      memberNames: Array.isArray(body.memberNames)
        ? body.memberNames.filter((n: unknown): n is string => typeof n === "string")
        : undefined,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleWriteError(error);
  }
}
