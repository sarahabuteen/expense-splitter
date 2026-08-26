import type { ActivityRow, GroupMember } from "./types";

/**
 * Aggregations that feed the charts. Pure, and run on the server like every
 * other total in the app.
 */

export type MonthPoint = { month: string; label: string; totalMinor: number };

/**
 * Spending by calendar month, with empty months filled in.
 *
 * A gap-free axis matters: dropping a month with no expenses would compress
 * the x-axis and make a quiet period look like a steady one.
 */
export function spendingOverTime(rows: ActivityRow[]): MonthPoint[] {
  const totals = new Map<string, number>();

  for (const row of rows) {
    if (row.kind !== "expense") continue;
    const month = row.date.slice(0, 7);
    totals.set(month, (totals.get(month) ?? 0) + row.convertedMinor);
  }
  if (totals.size === 0) return [];

  const months = [...totals.keys()].sort();
  const [startYear, startMonth] = months[0].split("-").map(Number);
  const [endYear, endMonth] = months[months.length - 1].split("-").map(Number);

  const points: MonthPoint[] = [];
  for (
    let cursor = new Date(Date.UTC(startYear, startMonth - 1, 1));
    cursor <= new Date(Date.UTC(endYear, endMonth - 1, 1));
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1))
  ) {
    const key = cursor.toISOString().slice(0, 7);
    points.push({
      month: key,
      label: cursor.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
        timeZone: "UTC",
      }),
      totalMinor: totals.get(key) ?? 0,
    });
  }

  return points;
}

export type ContributionSegment = { category: string; totalMinor: number };
export type MemberContribution = {
  memberId: string;
  name: string;
  totalMinor: number;
  segments: ContributionSegment[];
};

/**
 * What each member PAID FOR, broken down by category.
 *
 * Distinct from their share: this is who fronted the money, which is what
 * "member contribution" means in the differentiator brief.
 */
export function memberContributions(
  rows: ActivityRow[],
  members: GroupMember[],
): MemberContribution[] {
  const byMember = new Map<string, Map<string, number>>();

  for (const row of rows) {
    if (row.kind !== "expense") continue;
    const categories = byMember.get(row.payerId) ?? new Map<string, number>();
    categories.set(
      row.category,
      (categories.get(row.category) ?? 0) + row.convertedMinor,
    );
    byMember.set(row.payerId, categories);
  }

  return members
    .map((member) => {
      const categories = byMember.get(member.id) ?? new Map<string, number>();
      const segments = [...categories.entries()]
        .map(([category, totalMinor]) => ({ category, totalMinor }))
        .sort((a, b) => b.totalMinor - a.totalMinor);

      return {
        memberId: member.id,
        name: member.name,
        totalMinor: segments.reduce((sum, s) => sum + s.totalMinor, 0),
        segments,
      };
    })
    .sort((a, b) => b.totalMinor - a.totalMinor);
}

/**
 * How many transfers each member is involved in, before and after
 * simplification — the "before → after" the differentiator asks to be made
 * tangible.
 */
export type TransferChange = { name: string; before: number; after: number };

export function transferComparison(
  members: GroupMember[],
  direct: { fromId: string; toId: string }[],
  simplified: { fromId: string; toId: string }[],
): TransferChange[] {
  const count = (payments: { fromId: string; toId: string }[], id: string) =>
    payments.filter((p) => p.fromId === id || p.toId === id).length;

  return members
    .map((member) => ({
      name: member.name,
      before: count(direct, member.id),
      after: count(simplified, member.id),
    }))
    .filter((row) => row.before > 0 || row.after > 0)
    .sort((a, b) => b.before - a.before);
}
