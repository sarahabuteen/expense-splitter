import "server-only";

import { createGuestClient, createRouteClient } from "@/lib/supabase/server";
import { formatRelativeTimestamp, formatTimestamp } from "@/lib/format";
import { getActor } from "@/lib/supabase/actor";
import type { EventKind } from "./events";

/**
 * Reading the activity feed.
 *
 * Paged with a keyset cursor (created_at, id), not an offset: the feed grows
 * at the head, and an offset would show a row twice or skip one whenever
 * something is added between two page loads.
 */

export type FeedEntry = {
  id: string;
  kind: EventKind;
  actorName: string;
  subject: string;
  detail: Record<string, unknown>;
  /** Rendered on the server — the client formats nothing. */
  sentence: string;
  relativeTime: string;
  fullTime: string;
  /** The row it describes, when that row still exists. */
  expenseId: string | null;
};

export type Feed = {
  entries: FeedEntry[];
  /** Pass back as `cursor` to get the next page; null when the feed is done. */
  nextCursor: string | null;
  total: number;
};

const PAGE_SIZE = 25;

export async function getFeed(
  groupId: string,
  options: { cursor?: string | null; limit?: number } = {},
): Promise<Feed | null> {
  const { userId } = await getActor();
  const db = userId ? await createRouteClient() : createGuestClient();
  const limit = options.limit ?? PAGE_SIZE;

  // RLS decides whether this group is readable; no row means no access, which
  // is indistinguishable from "no such group" on purpose.
  const { data: group } = await db
    .from("groups")
    .select("id")
    .eq("id", groupId)
    .maybeSingle();
  if (!group) return null;

  // Counted separately from the page: a count taken alongside the cursor
  // filter counts what is LEFT, not what there is, and a field called `total`
  // that shrinks as you page is a trap for the next caller.
  const { count: total } = await db
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId);

  let query = db
    .from("events")
    .select("id, kind, actor_name, subject, detail, created_at")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1); // One extra: its existence is what says "there is more".

  if (options.cursor) {
    const [at, id] = decodeCursor(options.cursor);
    // Strictly older, or the same instant with a lower id — the tiebreak that
    // stops two events sharing a timestamp from hiding each other.
    query = query.or(`created_at.lt.${at},and(created_at.eq.${at},id.lt.${id})`);
  }

  const { data } = await query;
  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    entries: page.map(toEntry),
    nextCursor: hasMore
      ? encodeCursor(page[page.length - 1].created_at as string, page[page.length - 1].id as string)
      : null,
    total: total ?? page.length,
  };
}

function encodeCursor(createdAt: string, id: string): string {
  return `${createdAt}|${id}`;
}

function decodeCursor(cursor: string): [string, string] {
  const at = cursor.slice(0, cursor.lastIndexOf("|"));
  const id = cursor.slice(cursor.lastIndexOf("|") + 1);
  return [at, id];
}

function toEntry(row: Record<string, unknown>): FeedEntry {
  const detail = (row.detail ?? {}) as Record<string, unknown>;
  const kind = row.kind as EventKind;
  const createdAt = row.created_at as string;

  return {
    id: row.id as string,
    kind,
    actorName: row.actor_name as string,
    subject: row.subject as string,
    detail,
    sentence: sentenceFor(kind, row.subject as string, detail),
    relativeTime: formatRelativeTimestamp(createdAt),
    fullTime: formatTimestamp(createdAt),
    expenseId: typeof detail.expenseId === "string" ? detail.expenseId : null,
  };
}

/**
 * The line the feed shows. Built here rather than in the component: the
 * wording depends on the event's data, and that is a server concern like
 * every other computed string in the app.
 */
function sentenceFor(
  kind: EventKind,
  subject: string,
  detail: Record<string, unknown>,
): string {
  const changed = Array.isArray(detail.changed) ? (detail.changed as string[]) : [];

  switch (kind) {
    case "group_created": {
      const count = Number(detail.memberCount ?? 0);
      return `created ${subject} with ${count} member${count === 1 ? "" : "s"}`;
    }
    case "group_updated":
      return changed.length
        ? `changed the group's ${list(changed)}`
        : "updated the group";
    case "member_added":
      return `added ${subject} to the group`;
    case "member_removed":
      return `removed ${subject} from the group`;
    case "expense_added":
      return `added ${subject}`;
    case "expense_edited":
      return changed.length
        ? `changed the ${list(changed)} of ${subject}`
        : `edited ${subject}`;
    case "expense_deleted":
      return `deleted ${subject}`;
    case "settlement_added":
      return `recorded a payment, ${subject}`;
    case "settlement_deleted":
      return `removed a payment, ${subject}`;
    default:
      // Unreachable while the union is exhaustive; keeps a newly added kind
      // from rendering as a blank line rather than a rough sentence.
      return `${String(kind).replace(/_/g, " ")} ${subject}`.trim();
  }
}

/** "amount", "amount and date", "amount, date and who paid". */
function list(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
