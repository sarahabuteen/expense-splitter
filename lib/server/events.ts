import "server-only";

import { createRouteClient } from "@/lib/supabase/server";

/**
 * Writing to the activity feed.
 *
 * Recording is BEST EFFORT and never fails the mutation that triggered it.
 * The write it describes has already committed by the time we get here, and
 * PostgREST gives us no transaction to join, so throwing would report failure
 * for something that actually happened — the worse of the two wrong answers.
 * A dropped event is logged loudly instead.
 */

export type EventKind =
  | "group_created"
  | "group_updated"
  | "member_added"
  | "member_removed"
  | "expense_added"
  | "expense_edited"
  | "expense_deleted"
  | "settlement_added"
  | "settlement_deleted";

type Db = Awaited<ReturnType<typeof createRouteClient>>;

/** The actor's display name, cached per request. */
export async function actorName(db: Db, userId: string): Promise<string> {
  const { data } = await db
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();

  const name = (data?.display_name as string | null)?.trim();
  return name || "You";
}

export async function recordEvent(
  db: Db,
  event: {
    groupId: string;
    kind: EventKind;
    actorId: string;
    actorName: string;
    subject: string;
    detail?: Record<string, unknown>;
  },
): Promise<void> {
  const { error } = await db.from("events").insert({
    group_id: event.groupId,
    kind: event.kind,
    actor_id: event.actorId,
    actor_name: event.actorName,
    subject: event.subject,
    detail: event.detail ?? {},
  });

  if (error) {
    console.error("[events] dropped a %s event: %s", event.kind, error.message);
  }
}

/** What changed on an edit — the field names, in the words the feed uses. */
export function changedFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  labels: Record<string, string>,
): string[] {
  return Object.keys(labels).filter(
    (key) => key in after && String(before[key] ?? "") !== String(after[key] ?? ""),
  ).map((key) => labels[key]);
}
