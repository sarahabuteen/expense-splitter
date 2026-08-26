import { allocate, convertMinor, toMinor } from "../money";
import { avatarColorForIndex } from "../avatar-colors";

/**
 * Pure: fixture in, database rows out. No Supabase client, no IO.
 *
 * Being pure is the point — the same money rules run here and in the live
 * expense path, so seeded data and user-created data round identically. If the
 * seed had its own arithmetic, every balance test would only prove the seed
 * agrees with itself.
 */

export type Fixture = {
  groups: FixtureGroup[];
};

type FixtureGroup = {
  id: string;
  name: string;
  description: string;
  currency: string;
  createdAt: string;
  members: { id: string; name: string; email?: string; avatarColor: string }[];
  expenses: FixtureExpense[];
  settlements: FixtureSettlement[];
};

type FixtureExpense = {
  id: string;
  description: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  paidBy: string;
  splitType: "equal" | "exact" | "percentage" | "shares";
  splits: { memberId: string; amount: number; shares?: number; percentage?: number }[];
  date: string;
  category: string;
  notes?: string;
  recurring?: "weekly" | "biweekly" | "monthly";
};

type FixtureSettlement = {
  id: string;
  from: string;
  to: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  date: string;
};

export type BuiltGroup = {
  group: { name: string; description: string; currency: string; is_demo: true; created_at: string };
  members: { fixtureId: string; name: string; email: string | null; avatar_color: string }[];
  expenses: BuiltExpense[];
  settlements: BuiltSettlement[];
};

type BuiltExpense = {
  description: string;
  amount_minor: number;
  currency: string;
  exchange_rate: number;
  converted_amount_minor: number;
  paid_by: string;
  split_type: string;
  category: string;
  date: string;
  notes: string | null;
  recurring: string | null;
  splits: {
    member: string;
    amount_minor: number;
    converted_amount_minor: number;
    shares: number | null;
    percentage: number | null;
  }[];
};

type BuiltSettlement = {
  from_member: string;
  to_member: string;
  amount_minor: number;
  currency: string;
  exchange_rate: number;
  converted_amount_minor: number;
  date: string;
};

export function buildGroup(g: FixtureGroup): BuiltGroup {
  return {
    group: {
      name: g.name,
      description: g.description,
      currency: g.currency,
      is_demo: true,
      created_at: g.createdAt,
    },
    // The fixture's own avatarColor values collide with our balance semantics
    // (it ships emerald, teal, rose, pink and red). Reassign by position.
    members: g.members.map((m, i) => ({
      fixtureId: m.id,
      name: m.name,
      email: m.email ?? null,
      avatar_color: avatarColorForIndex(i),
    })),
    expenses: g.expenses.map((e) => buildExpense(e, g)),
    settlements: g.settlements.map((s) => ({
      from_member: s.from,
      to_member: s.to,
      amount_minor: toMinor(s.amount, s.currency),
      currency: s.currency,
      exchange_rate: s.exchangeRate,
      converted_amount_minor: convertMinor(
        toMinor(s.amount, s.currency),
        s.currency,
        g.currency,
        s.exchangeRate,
      ),
      date: s.date.slice(0, 10),
    })),
  };
}

function buildExpense(e: FixtureExpense, g: FixtureGroup): BuiltExpense {
  const amountMinor = toMinor(e.amount, e.currency);
  const shareMinors = e.splits.map((s) => toMinor(s.amount, e.currency));

  // Convert the TOTAL once, then redistribute it across members by their
  // original-currency shares. Converting each share independently would let
  // the parts drift from the whole, so a group's displayed total would not
  // equal the sum of its rows.
  const convertedTotal = convertMinor(amountMinor, e.currency, g.currency, e.exchangeRate);
  const payerIndex = Math.max(0, e.splits.findIndex((s) => s.memberId === e.paidBy));
  const convertedShares = allocate(convertedTotal, shareMinors, payerIndex);

  return {
    description: e.description,
    amount_minor: amountMinor,
    currency: e.currency,
    exchange_rate: e.exchangeRate,
    converted_amount_minor: convertedTotal,
    paid_by: e.paidBy,
    split_type: e.splitType,
    category: e.category,
    date: e.date.slice(0, 10),
    notes: e.notes ?? null,
    recurring: e.recurring ?? null,
    splits: e.splits.map((s, i) => ({
      member: s.memberId,
      amount_minor: shareMinors[i],
      converted_amount_minor: convertedShares[i],
      shares: s.shares ?? null,
      percentage: s.percentage ?? null,
    })),
  };
}

export function buildAll(fixture: Fixture): BuiltGroup[] {
  return fixture.groups.map(buildGroup);
}
