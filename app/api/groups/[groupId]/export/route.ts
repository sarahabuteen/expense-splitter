import { applyFilters, parseFilters } from "@/lib/filters";
import { expensesToCsv, settlementsToCsv } from "@/lib/csv";
import { getGroup } from "@/lib/server/groups";

/**
 * CSV export.
 *
 * Honours the same filters as the ledger, read from the query string — so
 * "export what I'm looking at" needs no separate concept. Guests can export
 * the demo groups: it is a read, and RLS already decides what they can see.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await params;
  const group = await getGroup(groupId);
  if (!group) {
    return new Response("Group not found.", { status: 404 });
  }

  const url = new URL(request.url);
  const filters = parseFilters(Object.fromEntries(url.searchParams));
  const rows = applyFilters(group.activity, filters);
  const kind = url.searchParams.get("kind") === "settlements" ? "settlements" : "expenses";

  const csv =
    kind === "settlements"
      ? settlementsToCsv(rows, group.currency)
      : expensesToCsv(rows, group.members, group.currency);

  const slug = group.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      // A download rather than a render, with a name that says what it is.
      "Content-Disposition": `attachment; filename="${slug}-${kind}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
