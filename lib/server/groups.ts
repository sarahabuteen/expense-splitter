import "server-only";

import { getActor } from "@/lib/supabase/actor";
import { createGuestClient, createRouteClient } from "@/lib/supabase/server";
import { pairwiseDebts, simplifyDebts } from "@/lib/balances";
import { formatFullDate, formatRelativeTime } from "@/lib/format";
import type { AvatarColor } from "@/lib/avatar-colors";
import type { ActivityRow, GroupDetail, GroupMember, GroupSummary } from "@/lib/types";

/**
 * Read layer for groups.
 *
 * Guests get a client with no session, so the `anon` role sees exactly the demo
 * groups and nothing else — guest mode needs no branching beyond picking the
 * client. Signed-in users are additionally filtered to rows they own, which
 * stops demo data mixing into a real account; RLS is still the actual boundary.
 */

type Ctx = {
  db: Awaited<ReturnType<typeof createRouteClient>>;
  userId: string | null;
};

async function context(): Promise<Ctx> {
  const { userId } = await getActor();
  if (!userId) {
    return { db: createGuestClient(), userId: null };
  }
  return { db: await createRouteClient(), userId };
}

/** Which member represents the viewer: their linked account, else the first. */
function viewerIdFor(
  members: { id: string; user_id: string | null }[],
  userId: string | null,
): string | undefined {
  const linked = userId ? members.find((m) => m.user_id === userId) : undefined;
  return (linked ?? members[0])?.id;
}

export async function listGroups(): Promise<GroupSummary[]> {
  const { db, userId } = await context();

  let query = db
    .from("groups")
    .select("id, name, description, currency, is_demo, created_at")
    .order("created_at", { ascending: true });

  query = userId ? query.eq("owner_id", userId) : query.eq("is_demo", true);

  const { data: groups, error } = await query;
  if (error) throw new Error(error.message);
  if (!groups?.length) return [];

  const ids = groups.map((g) => g.id as string);

  // Three set-based reads rather than N per group: the spec is explicit that
  // loading a group list must not fan out into per-group queries.
  const [{ data: members }, { data: balances }, { data: totals }] = await Promise.all([
    db.from("members").select("id, group_id, user_id, name, email, avatar_color").in("group_id", ids),
    db.from("member_balances").select("group_id, member_id, balance_minor").in("group_id", ids),
    db.from("group_totals").select("group_id, expense_count, total_minor").in("group_id", ids),
  ]);

  const balanceOf = new Map(
    (balances ?? []).map((b) => [b.member_id as string, Number(b.balance_minor)]),
  );
  const totalOf = new Map(
    (totals ?? []).map((t) => [t.group_id as string, t]),
  );

  return groups.map((g) => {
    const own = (members ?? []).filter((m) => m.group_id === g.id);
    const viewerId = viewerIdFor(own, userId);
    const mapped = own.map((m) => toMember(m, balanceOf, viewerId));
    const total = totalOf.get(g.id as string);

    return {
      id: g.id as string,
      name: g.name as string,
      description: (g.description as string | null) ?? "",
      currency: g.currency as string,
      isDemo: Boolean(g.is_demo),
      members: mapped,
      expenseCount: Number(total?.expense_count ?? 0),
      totalMinor: Number(total?.total_minor ?? 0),
      yourBalanceMinor: mapped.find((m) => m.isViewer)?.balanceMinor ?? 0,
    };
  });
}

export async function getGroup(groupId: string): Promise<GroupDetail | null> {
  const { db, userId } = await context();

  const { data: group } = await db
    .from("groups")
    .select("id, name, description, currency, is_demo")
    .eq("id", groupId)
    .maybeSingle();

  // RLS turns "not allowed" into "no rows", so this covers both a bad id and a
  // group belonging to someone else. Both should look the same to the caller.
  if (!group) return null;

  const [{ data: rawMembers }, { data: balances }, { data: totals }] = await Promise.all([
    db.from("members").select("id, user_id, name, email, avatar_color").eq("group_id", groupId),
    db.from("member_balances").select("member_id, balance_minor").eq("group_id", groupId),
    db.from("group_totals").select("expense_count, total_minor").eq("group_id", groupId).maybeSingle(),
  ]);

  const memberRows = rawMembers ?? [];
  const viewerId = viewerIdFor(memberRows, userId);
  const balanceOf = new Map(
    (balances ?? []).map((b) => [b.member_id as string, Number(b.balance_minor)]),
  );
  const members = memberRows.map((m) => toMember(m, balanceOf, viewerId));
  const nameOf = new Map(members.map((m) => [m.id, m]));

  const [{ data: expenses }, { data: settlements }] = await Promise.all([
    db
      .from("expenses")
      .select(
        "id, description, amount_minor, currency, paid_by, split_type, date, category_id, converted_amount_minor",
      )
      .eq("group_id", groupId)
      .order("date", { ascending: false }),
    db
      .from("settlements")
      .select("id, from_member, to_member, amount_minor, currency, date, converted_amount_minor")
      .eq("group_id", groupId)
      .order("date", { ascending: false }),
  ]);

  // Category names are fetched separately: the hand-written Database types
  // declare no relationships, so an embedded select would not type.
  // Splits for the expanded row. One set-based read, not one per expense.
  const expenseIds = (expenses ?? []).map((e) => e.id as string);
  const { data: allSplits } = expenseIds.length
    ? await db
        .from("expense_splits")
        .select("expense_id, member_id, amount_minor, converted_amount_minor, percentage, shares")
        .in("expense_id", expenseIds)
    : { data: [] };

  const splitsByExpense = new Map<string, typeof allSplits>();
  for (const split of allSplits ?? []) {
    const key = split.expense_id as string;
    splitsByExpense.set(key, [...(splitsByExpense.get(key) ?? []), split]);
  }

  const categoryIds = [
    ...new Set((expenses ?? []).map((e) => e.category_id).filter(Boolean)),
  ] as string[];
  const { data: categories } = categoryIds.length
    ? await db.from("categories").select("id, name").in("id", categoryIds)
    : { data: [] };
  const categoryOf = new Map(
    (categories ?? []).map((c) => [c.id as string, c.name as string]),
  );

  const { data: allCategories } = await db
    .from("categories")
    .select("name, group_id")
    .or(`group_id.eq.${groupId},group_id.is.null`);

  const activity: ActivityRow[] = [
    ...(expenses ?? []).map(
      (e): ActivityRow => ({
        kind: "expense",
        id: e.id as string,
        title: e.description as string,
        category: categoryOf.get(e.category_id as string) ?? "Other",
        payer: nameOf.get(e.paid_by as string)?.name ?? "Someone",
        payerColor: nameOf.get(e.paid_by as string)?.color ?? "indigo",
        date: e.date as string,
        amountMinor: Number(e.amount_minor),
        currency: e.currency as string,
        splitType: e.split_type as "equal" | "exact" | "percentage" | "shares",
        payerId: e.paid_by as string,
        convertedMinor: Number(e.converted_amount_minor),
        relativeDate: formatRelativeTime(e.date as string),
        fullDate: formatFullDate(e.date as string),
        splits: (splitsByExpense.get(e.id as string) ?? []).map((split) => {
          const member = nameOf.get(split.member_id as string);
          return {
            memberId: split.member_id as string,
            name: member?.name ?? "Someone",
            color: member?.color ?? ("indigo" as const),
            amountMinor: Number(split.amount_minor),
            convertedAmountMinor: Number(split.converted_amount_minor),
            percentage: split.percentage === null ? null : Number(split.percentage),
            shares: split.shares === null ? null : Number(split.shares),
            isPayer: split.member_id === e.paid_by,
          };
        }),
      }),
    ),
    ...(settlements ?? []).map(
      (s): ActivityRow => ({
        kind: "settlement",
        id: s.id as string,
        from: nameOf.get(s.from_member as string)?.name ?? "Someone",
        fromColor: nameOf.get(s.from_member as string)?.color ?? "indigo",
        to: nameOf.get(s.to_member as string)?.name ?? "Someone",
        toColor: nameOf.get(s.to_member as string)?.color ?? "indigo",
        fromId: s.from_member as string,
        toId: s.to_member as string,
        date: s.date as string,
        amountMinor: Number(s.amount_minor),
        currency: s.currency as string,
        convertedMinor: Number(s.converted_amount_minor),
        relativeDate: formatRelativeTime(s.date as string),
        fullDate: formatFullDate(s.date as string),
      }),
    ),
  ].sort((a, b) => b.date.localeCompare(a.date));

  // What the viewer personally put in and personally owes, in group currency.
  const viewerPaidMinor = (expenses ?? [])
    .filter((e) => e.paid_by === viewerId)
    .reduce((sum, e) => sum + Number(e.converted_amount_minor), 0);

  const { data: viewerSplits } = viewerId
    ? await db
        .from("expense_splits")
        .select("converted_amount_minor, expense_id")
        .eq("member_id", viewerId)
    : { data: [] };

  const groupExpenseIds = new Set((expenses ?? []).map((e) => e.id as string));
  const viewerShareMinor = (viewerSplits ?? [])
    .filter((s) => groupExpenseIds.has(s.expense_id as string))
    .reduce((sum, s) => sum + Number(s.converted_amount_minor), 0);

  return {
    id: group.id as string,
    name: group.name as string,
    description: (group.description as string | null) ?? "",
    currency: group.currency as string,
    isDemo: Boolean(group.is_demo),
    members,
    expenseCount: Number(totals?.expense_count ?? 0),
    totalMinor: Number(totals?.total_minor ?? 0),
    yourBalanceMinor: members.find((m) => m.isViewer)?.balanceMinor ?? 0,
    activity,
    viewerPaidMinor,
    viewerShareMinor,
    categories: [...new Set((allCategories ?? []).map((c) => c.name as string))].sort(),
    plan: simplifyDebts(members),
    directPlan: pairwiseDebts(members, activity),
  };
}

function toMember(
  row: { id: string; user_id?: string | null; name: string; email: string | null; avatar_color: string },
  balanceOf: Map<string, number>,
  viewerId: string | undefined,
): GroupMember {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    color: row.avatar_color as AvatarColor,
    balanceMinor: balanceOf.get(row.id) ?? 0,
    isViewer: row.id === viewerId,
  };
}
