import "server-only";

import { createGuestClient, createRouteClient } from "@/lib/supabase/server";
import { formatFullDate, formatRelativeTime } from "@/lib/format";
import { getActor } from "@/lib/supabase/actor";
import { isSettled, simplifyDebts } from "@/lib/balances";
import type { AvatarColor } from "@/lib/avatar-colors";
import type { ActivityRow, GroupMember, SettlementPlan } from "@/lib/types";
import type { CategoryTotal, Filters } from "@/lib/filters";

/**
 * The group dashboard's read, which is the app's hottest query.
 *
 * Distinct from getGroup() because the two want different things. getGroup
 * loads every expense and every split, which the settle page and the reports
 * genuinely need — they compute pairwise debts and category breakdowns across
 * the whole history. The dashboard does not: it shows one screen of the
 * ledger, and its balances come from the member_balances view.
 *
 * So this loads ONE PAGE of rows, and does it after filtering in SQL rather
 * than in JavaScript — filtering a page that was already truncated would show
 * the wrong rows, not merely slow ones.
 *
 * Category totals are the exception: a breakdown of only the visible page
 * would be wrong, so they come from a separate narrow scan of every matching
 * expense — two integers per row, without the splits that make the full read
 * expensive.
 */

export type GroupPage = {
  id: string;
  name: string;
  description: string;
  currency: string;
  isDemo: boolean;
  members: GroupMember[];
  expenseCount: number;
  totalMinor: number;
  yourBalanceMinor: number;
  yourBalanceSettled: boolean;
  viewerName: string | null;
  viewerSettled: boolean;
  viewerPaidMinor: number;
  viewerShareMinor: number;
  categories: string[];
  /** Every category this group has actually spent in, unfiltered. */
  usedCategories: string[];
  plan: SettlementPlan;
  /** One page of the filtered ledger, newest first. */
  activity: ActivityRow[];
  /** Totals across ALL matching rows, not just the page. */
  totals: CategoryTotal[];
  /** How many rows match the filters in total, and whether more remain. */
  matchCount: number;
  matchExpenseCount: number;
  matchSettlementCount: number;
  /** Every row in the group, ignoring filters — for "12 of 340 shown". */
  totalEntries: number;
  hasMore: boolean;
};

export const PAGE_SIZE = 25;

export async function getGroupPage(
  groupId: string,
  options: { filters: Filters; limit?: number },
): Promise<GroupPage | null> {
  const { userId } = await getActor();
  const db = userId ? await createRouteClient() : createGuestClient();
  const limit = options.limit ?? PAGE_SIZE;
  const { filters } = options;

  const { data: group } = await db
    .from("groups")
    .select("id, name, description, currency, is_demo")
    .eq("id", groupId)
    .maybeSingle();
  if (!group) return null;

  const [{ data: rawMembers }, { data: balances }, { data: totals }, { data: allCategories }] =
    await Promise.all([
      db.from("members").select("id, user_id, name, email, avatar_color").eq("group_id", groupId),
      db.from("member_balances").select("member_id, balance_minor").eq("group_id", groupId),
      db.from("group_totals").select("expense_count, total_minor").eq("group_id", groupId).maybeSingle(),
      db.from("categories").select("id, name, group_id").or(`group_id.eq.${groupId},group_id.is.null`),
    ]);

  const memberRows = rawMembers ?? [];
  const linked = userId ? memberRows.find((m) => m.user_id === userId) : undefined;
  const viewerId = (linked ?? memberRows[0])?.id as string | undefined;
  const balanceOf = new Map(
    (balances ?? []).map((b) => [b.member_id as string, Number(b.balance_minor)]),
  );
  const members: GroupMember[] = memberRows.map((m) => ({
    id: m.id as string,
    name: m.name as string,
    email: (m.email as string | null) ?? null,
    color: m.avatar_color as AvatarColor,
    balanceMinor: balanceOf.get(m.id as string) ?? 0,
    isViewer: m.id === viewerId,
    settled: isSettled(balanceOf.get(m.id as string) ?? 0),
  }));
  const memberOf = new Map(members.map((m) => [m.id, m]));

  const categoryName = new Map(
    (allCategories ?? []).map((c) => [c.id as string, c.name as string]),
  );
  const categoryIdsByName = new Map(
    (allCategories ?? []).map((c) => [(c.name as string).toLowerCase(), c.id as string]),
  );

  // ------------------------------------------------------------------ filters
  // Resolved to ids here so the queries below can filter in SQL. Member and
  // category NAMES are matched in app code first: the lists are tiny, and the
  // alternative is a join PostgREST cannot express against untyped relations.
  const query = filters.query.trim().toLowerCase();
  const matchingMemberIds = query
    ? members.filter((m) => m.name.toLowerCase().includes(query)).map((m) => m.id)
    : [];
  const matchingCategoryIds = query
    ? [...categoryIdsByName.entries()]
        .filter(([name]) => name.includes(query))
        .map(([, id]) => id)
    : [];
  const filterCategoryIds = filters.categories
    .map((name) => categoryIdsByName.get(name.toLowerCase()))
    .filter((id): id is string => Boolean(id));

  // A member filter also matches expenses the member merely took part in, so
  // their split rows have to be resolved before the expense query can run.
  let memberExpenseIds: string[] | null = null;
  if (filters.memberId) {
    const { data: splits } = await db
      .from("expense_splits")
      .select("expense_id")
      .eq("member_id", filters.memberId);
    memberExpenseIds = [...new Set((splits ?? []).map((s) => s.expense_id as string))];
  }

  const applyExpenseFilters = <T>(builder: T): T => {
    let q = builder as Filterable;
    q = q.eq("group_id", groupId);
    if (filters.from) q = q.gte("date", filters.from);
    if (filters.to) q = q.lte("date", filters.to);
    if (filterCategoryIds.length) q = q.in("category_id", filterCategoryIds);
    // An unresolvable category name must match nothing, not everything.
    else if (filters.categories.length) q = q.eq("id", NO_MATCH);
    if (filters.memberId) {
      const ids = memberExpenseIds ?? [];
      q = q.or(
        ids.length
          ? `paid_by.eq.${filters.memberId},id.in.(${ids.join(",")})`
          : `paid_by.eq.${filters.memberId}`,
      );
    }
    if (query) {
      const clauses = [`description.ilike.*${escapeLike(query)}*`];
      if (matchingMemberIds.length) clauses.push(`paid_by.in.(${matchingMemberIds.join(",")})`);
      if (matchingCategoryIds.length) {
        clauses.push(`category_id.in.(${matchingCategoryIds.join(",")})`);
      }
      q = q.or(clauses.join(","));
    }
    return q as unknown as T;
  };

  const applySettlementFilters = <T>(builder: T): T => {
    let q = builder as Filterable;
    q = q.eq("group_id", groupId);
    if (filters.from) q = q.gte("date", filters.from);
    if (filters.to) q = q.lte("date", filters.to);
    if (filters.memberId) {
      q = q.or(`from_member.eq.${filters.memberId},to_member.eq.${filters.memberId}`);
    }
    if (query) {
      // Settlements have no text of their own; they match on the two names.
      q = matchingMemberIds.length
        ? q.or(
            `from_member.in.(${matchingMemberIds.join(",")}),to_member.in.(${matchingMemberIds.join(",")})`,
          )
        : q.eq("id", NO_MATCH);
    }
    return q as unknown as T;
  };

  // A category filter is about spending, so it excludes settlements entirely —
  // a payment is not uncategorised spending, it is not spending at all.
  const settlementsExcluded = filters.categories.length > 0;

  // Both tables are fetched to `limit`, merged, then sliced. The newest `limit`
  // of a merge is always inside the newest `limit` of each side, so this is the
  // whole page and not an approximation of it.
  const [expensesResult, settlementsResult, aggregateResult] = await Promise.all([
    applyExpenseFilters(
      db
        .from("expenses")
        .select(
            "id, description, amount_minor, currency, paid_by, split_type, date, category_id, converted_amount_minor, exchange_rate, rate_is_manual",
            { count: "exact" },
          ),
      )
        .order("date", { ascending: false })
        .order("id", { ascending: false })
        .limit(limit),
      settlementsExcluded
        ? Promise.resolve({ data: [], count: 0 })
        : applySettlementFilters(
            db
              .from("settlements")
              .select(
                "id, from_member, to_member, amount_minor, currency, date, converted_amount_minor",
                { count: "exact" },
              ),
          )
            .order("date", { ascending: false })
            .order("id", { ascending: false })
            .limit(limit),
    // The narrow scan behind the category breakdown: no splits, no joins.
    applyExpenseFilters(
      db.from("expenses").select("category_id, converted_amount_minor"),
    ),
  ]);

  const expenseRows = expensesResult.data ?? [];
  const settlementRows = settlementsResult.data ?? [];

  // Splits only for the page's expenses — the read that used to scale with the
  // whole group now scales with what is on screen.
  const pageExpenseIds = expenseRows.map((e) => e.id as string);
  const { data: splitRows } = pageExpenseIds.length
    ? await db
        .from("expense_splits")
        .select("expense_id, member_id, amount_minor, converted_amount_minor, percentage, shares")
        .in("expense_id", pageExpenseIds)
    : { data: [] };

  const splitsByExpense = new Map<string, NonNullable<typeof splitRows>>();
  for (const split of splitRows ?? []) {
    const key = split.expense_id as string;
    splitsByExpense.set(key, [...(splitsByExpense.get(key) ?? []), split]);
  }

  const activity: ActivityRow[] = [
    ...expenseRows.map((e): ActivityRow => ({
      kind: "expense",
      id: e.id as string,
      title: e.description as string,
      category: categoryName.get(e.category_id as string) ?? "Other",
      payer: memberOf.get(e.paid_by as string)?.name ?? "Someone",
      payerColor: memberOf.get(e.paid_by as string)?.color ?? "indigo",
      date: e.date as string,
      amountMinor: Number(e.amount_minor),
      currency: e.currency as string,
      splitType: e.split_type as "equal" | "exact" | "percentage" | "shares",
      payerId: e.paid_by as string,
      convertedMinor: Number(e.converted_amount_minor),
      exchangeRate: Number(e.exchange_rate),
      rateIsManual: Boolean(e.rate_is_manual),
      relativeDate: formatRelativeTime(e.date as string),
      fullDate: formatFullDate(e.date as string),
      splits: (splitsByExpense.get(e.id as string) ?? []).map((split) => {
        const member = memberOf.get(split.member_id as string);
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
    })),
    ...settlementRows.map((s): ActivityRow => ({
      kind: "settlement",
      id: s.id as string,
      from: memberOf.get(s.from_member as string)?.name ?? "Someone",
      fromColor: memberOf.get(s.from_member as string)?.color ?? "indigo",
      to: memberOf.get(s.to_member as string)?.name ?? "Someone",
      toColor: memberOf.get(s.to_member as string)?.color ?? "indigo",
      fromId: s.from_member as string,
      toId: s.to_member as string,
      date: s.date as string,
      amountMinor: Number(s.amount_minor),
      currency: s.currency as string,
      convertedMinor: Number(s.converted_amount_minor),
      relativeDate: formatRelativeTime(s.date as string),
      fullDate: formatFullDate(s.date as string),
    })),
  ].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  const matchExpenseCount = expensesResult.count ?? 0;
  const matchSettlementCount = settlementsResult.count ?? 0;
  const matchCount = matchExpenseCount + matchSettlementCount;
  const page = activity.slice(0, limit);

  // Category totals over every matching expense.
  const totalsByCategory = new Map<string, { totalMinor: number; count: number }>();
  for (const row of aggregateResult.data ?? []) {
    const name = categoryName.get(row.category_id as string) ?? "Other";
    const existing = totalsByCategory.get(name) ?? { totalMinor: 0, count: 0 };
    totalsByCategory.set(name, {
      totalMinor: existing.totalMinor + Number(row.converted_amount_minor),
      count: existing.count + 1,
    });
  }
  const grand = [...totalsByCategory.values()].reduce((sum, t) => sum + t.totalMinor, 0);
  const categoryTotals: CategoryTotal[] = [...totalsByCategory.entries()]
    .map(([category, t]) => ({
      category,
      totalMinor: t.totalMinor,
      count: t.count,
      percentage: grand === 0 ? 0 : (t.totalMinor / grand) * 100,
    }))
    .sort((a, b) => b.totalMinor - a.totalMinor);

  // One narrow scan of the group's expenses, serving two jobs: the filter
  // chips list every category the group SPENDS in (a chip set that shrinks as
  // you filter cannot be used to change the filter), and the viewer's share
  // needs to know which splits belong to this group.
  const { data: allExpenseRows } = await db
    .from("expenses")
    .select("id, category_id, paid_by, converted_amount_minor")
    .eq("group_id", groupId);

  const usedCategories = [
    ...new Set(
      (allExpenseRows ?? []).map((r) => categoryName.get(r.category_id as string) ?? "Other"),
    ),
  ].sort();

  const viewerPaidMinor = (allExpenseRows ?? [])
    .filter((r) => r.paid_by === viewerId)
    .reduce((sum, r) => sum + Number(r.converted_amount_minor), 0);

  const groupExpenseIds = new Set((allExpenseRows ?? []).map((r) => r.id as string));
  const { count: settlementTotal } = await db
    .from("settlements")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId);

  const { data: viewerSplits } = viewerId
    ? await db
        .from("expense_splits")
        .select("converted_amount_minor, expense_id")
        .eq("member_id", viewerId)
    : { data: [] };
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
    yourBalanceSettled: isSettled(members.find((m) => m.isViewer)?.balanceMinor ?? 0),
    viewerName: members.find((m) => m.isViewer)?.name ?? null,
    viewerSettled: isSettled(members.find((m) => m.isViewer)?.balanceMinor ?? 0),
    viewerPaidMinor,
    viewerShareMinor,
    categories: [...new Set((allCategories ?? []).map((c) => c.name as string))].sort(),
    usedCategories,
    plan: simplifyDebts(members),
    activity: page,
    totals: categoryTotals,
    matchCount,
    matchExpenseCount,
    matchSettlementCount,
    totalEntries: (allExpenseRows ?? []).length + (settlementTotal ?? 0),
    hasMore: page.length < matchCount,
  };
}

/**
 * The slice of the PostgREST builder these helpers use. Structural rather than
 * imported: the project's Database types are hand-written and declare no
 * relations, so the real generic builder type resolves to something these
 * chained calls cannot be expressed against.
 */
type Filterable = {
  eq: (column: string, value: unknown) => Filterable;
  gte: (column: string, value: unknown) => Filterable;
  lte: (column: string, value: unknown) => Filterable;
  in: (column: string, values: readonly unknown[]) => Filterable;
  or: (filters: string) => Filterable;
};

/** A uuid that matches nothing, for "this filter can have no results". */
const NO_MATCH = "00000000-0000-0000-0000-000000000000";

/** PostgREST treats * as the wildcard in ilike, so a literal one must go. */
function escapeLike(value: string): string {
  return value.replace(/[*,()]/g, " ");
}
