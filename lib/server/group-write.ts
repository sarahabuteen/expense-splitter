import "server-only";

import { requireUser } from "@/lib/supabase/actor";
import { createRouteClient } from "@/lib/supabase/server";
import { isSettled } from "@/lib/balances";
import { nextAvatarColor, type AvatarColor } from "@/lib/avatar-colors";
import { currencyFor } from "@/lib/currencies";

/**
 * Every group mutation.
 *
 * Two rules hold throughout:
 *
 * 1. Mutations use requireUser(), which round-trips to the Auth server. A
 *    revoked session still passes local JWT verification until it expires, and
 *    that is not good enough for a write.
 *
 * 2. Every write ends in .select(). RLS refuses a forbidden write by matching
 *    ZERO ROWS, not by erroring — so without checking what came back, an
 *    update the policies threw away returns a cheerful 200.
 */

export class WriteError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const notFound = () =>
  new WriteError("That group doesn't exist, or isn't yours.", 404);

/**
 * Fail closed BEFORE any business rule runs.
 *
 * RLS lets everyone SELECT demo groups, so a read alone cannot tell "yours"
 * from "someone else's". Without this, a caller with no right to a group still
 * learns things about it: deleting a demo group answered "settle everyone up
 * first" (409), which confirms both that it exists and that it has outstanding
 * balances. Every write path answers with the same 404 instead.
 */
async function assertWritable(
  db: Awaited<ReturnType<typeof createRouteClient>>,
  groupId: string,
  userId: string,
) {
  const { data } = await db
    .from("groups")
    .select("id")
    .eq("id", groupId)
    .eq("owner_id", userId)
    .eq("is_demo", false)
    .maybeSingle();

  if (!data) throw notFound();
}

export async function createGroup(input: {
  name: string;
  description?: string;
  currency: string;
  memberNames?: string[];
}) {
  const { userId } = await requireUser();
  const db = await createRouteClient();

  const name = input.name.trim();
  if (!name) throw new WriteError("Give the group a name.", 400);
  if (!currencyFor(input.currency)) {
    throw new WriteError("That isn't a supported currency.", 400);
  }

  const { data: group, error } = await db
    .from("groups")
    .insert({
      owner_id: userId,
      name,
      description: input.description?.trim() || null,
      currency: input.currency.toUpperCase(),
    })
    .select("id")
    .single();

  if (error || !group) throw new WriteError(error?.message ?? "Couldn't create the group.", 400);

  // The creator is always the first member, with user_id set. That is what
  // makes "your balance" resolvable in a brand-new group.
  const { data: profile } = await db
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();

  const rows: { group_id: string; user_id: string | null; name: string; avatar_color: AvatarColor }[] = [
    {
      group_id: group.id,
      user_id: userId,
      name: (profile?.display_name as string | null)?.trim() || "You",
      avatar_color: nextAvatarColor([]),
    },
  ];

  const taken: AvatarColor[] = [rows[0].avatar_color];
  for (const raw of input.memberNames ?? []) {
    const memberName = raw.trim();
    if (!memberName) continue;
    if (rows.some((r) => r.name.toLowerCase() === memberName.toLowerCase())) continue;
    const color = nextAvatarColor(taken);
    taken.push(color);
    rows.push({ group_id: group.id, user_id: null, name: memberName, avatar_color: color });
  }

  const { error: memberError } = await db.from("members").insert(rows);
  if (memberError) throw new WriteError(memberError.message, 400);

  return { id: group.id as string };
}

export async function updateGroup(
  groupId: string,
  input: { name?: string; description?: string; currency?: string },
) {
  const { userId } = await requireUser();
  const db = await createRouteClient();
  await assertWritable(db, groupId, userId);

  const patch: Record<string, string | null> = {};

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) throw new WriteError("Give the group a name.", 400);
    patch.name = name;
  }
  if (input.description !== undefined) {
    patch.description = input.description.trim() || null;
  }

  if (input.currency !== undefined) {
    if (!currencyFor(input.currency)) {
      throw new WriteError("That isn't a supported currency.", 400);
    }
    // Every expense stored a converted amount against the current currency.
    // Switching it would silently invalidate every balance in the group, so
    // the server refuses independently of whether the UI disabled the field.
    const { count } = await db
      .from("expenses")
      .select("id", { count: "exact", head: true })
      .eq("group_id", groupId);

    if ((count ?? 0) > 0) {
      throw new WriteError(
        "This group already has expenses, so its currency is locked — every balance was calculated against it.",
        409,
      );
    }
    patch.currency = input.currency.toUpperCase();
  }

  if (Object.keys(patch).length === 0) return { id: groupId };

  const { data } = await db.from("groups").update(patch).eq("id", groupId).select("id");
  if (!data?.length) throw notFound();

  return { id: groupId };
}

export async function deleteGroup(groupId: string) {
  const { userId } = await requireUser();
  const db = await createRouteClient();
  await assertWritable(db, groupId, userId);

  const { data: balances } = await db
    .from("member_balances")
    .select("balance_minor")
    .eq("group_id", groupId);

  const outstanding = (balances ?? []).filter((b) => !isSettled(Number(b.balance_minor)));
  if (outstanding.length > 0) {
    throw new WriteError(
      "Settle everyone up before deleting this group — otherwise people lose track of what they're owed.",
      409,
    );
  }

  // Children go first, in dependency order. expenses.paid_by,
  // expense_splits.member_id and the settlement member columns are ON DELETE
  // RESTRICT (deliberately, so removing one member cannot destroy history), and
  // Postgres may reach `members` before `expenses` when cascading from the
  // group — which fails the whole delete.
  const { data: expenses } = await db.from("expenses").select("id").eq("group_id", groupId);

  await db.from("settlements").delete().eq("group_id", groupId);
  for (const expense of expenses ?? []) {
    await db.from("expense_splits").delete().eq("expense_id", expense.id);
  }
  await db.from("expenses").delete().eq("group_id", groupId);
  await db.from("members").delete().eq("group_id", groupId);

  const { data } = await db.from("groups").delete().eq("id", groupId).select("id");
  if (!data?.length) throw notFound();

  return { id: groupId };
}

export async function addMember(
  groupId: string,
  input: { name: string; email?: string },
) {
  const { userId } = await requireUser();
  const db = await createRouteClient();
  await assertWritable(db, groupId, userId);

  const name = input.name.trim();
  if (!name) throw new WriteError("Enter a name to add someone.", 400);

  const { data: existing } = await db
    .from("members")
    .select("id, name, avatar_color")
    .eq("group_id", groupId);

  // No rows means either an unknown group or someone else's — RLS makes those
  // indistinguishable, which is the point.
  if (!existing) throw notFound();
  if (existing.some((m) => (m.name as string).toLowerCase() === name.toLowerCase())) {
    throw new WriteError(`${name} is already in this group.`, 409);
  }

  const color = nextAvatarColor(existing.map((m) => m.avatar_color as AvatarColor));

  const { data, error } = await db
    .from("members")
    .insert({
      group_id: groupId,
      name,
      email: input.email?.trim() || null,
      avatar_color: color,
    })
    .select("id");

  if (error) throw new WriteError(error.message, 400);
  if (!data?.length) throw notFound();

  return { id: data[0].id as string };
}

export async function removeMember(groupId: string, memberId: string) {
  const { userId } = await requireUser();
  const db = await createRouteClient();
  await assertWritable(db, groupId, userId);

  const { data: balance } = await db
    .from("member_balances")
    .select("balance_minor")
    .eq("group_id", groupId)
    .eq("member_id", memberId)
    .maybeSingle();

  if (!balance) throw notFound();

  if (!isSettled(Number(balance.balance_minor))) {
    throw new WriteError(
      "They still have an outstanding balance. Settle up first.",
      409,
    );
  }

  // A settled member can still appear in a dozen splits. Removing them would
  // rewrite what the group spent, and the FKs are ON DELETE RESTRICT anyway.
  const [{ count: paid }, { count: split }, { count: sent }, { count: received }] =
    await Promise.all([
      db.from("expenses").select("id", { count: "exact", head: true }).eq("paid_by", memberId),
      db.from("expense_splits").select("id", { count: "exact", head: true }).eq("member_id", memberId),
      db.from("settlements").select("id", { count: "exact", head: true }).eq("from_member", memberId),
      db.from("settlements").select("id", { count: "exact", head: true }).eq("to_member", memberId),
    ]);

  if ((paid ?? 0) + (split ?? 0) + (sent ?? 0) + (received ?? 0) > 0) {
    throw new WriteError(
      "They appear in this group's expense history, so removing them would rewrite what the group spent.",
      409,
    );
  }

  const { data } = await db
    .from("members")
    .delete()
    .eq("id", memberId)
    .eq("group_id", groupId)
    .select("id");

  if (!data?.length) throw notFound();

  return { id: memberId };
}
