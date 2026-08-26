import { NextResponse } from "next/server";

import { getFeed } from "@/lib/server/activity";

/** Pages the activity feed. Read-only, so guests get it too. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await params;
  const search = new URL(request.url).searchParams;
  const cursor = search.get("cursor");
  // Bounded: the page size is the server's decision, not the caller's, but a
  // caller may ask for a smaller one.
  const asked = Number(search.get("limit"));
  const limit =
    Number.isFinite(asked) && asked > 0 ? Math.min(Math.round(asked), 100) : undefined;

  const feed = await getFeed(groupId, { cursor, limit });
  if (!feed) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return NextResponse.json(feed);
}
