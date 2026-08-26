import type { AvatarColor } from "@/lib/avatar-colors";

/**
 * PLACEHOLDER DATA — UI only.
 *
 * The Trip to Japan timeline, taken verbatim from the fixture: real
 * descriptions, payers, dates, currencies and split types, in
 * reverse-chronological order.
 */

export type ActivityRow =
  | {
      kind: "expense";
      id: string;
      title: string;
      category: string;
      payer: string;
      payerColor: AvatarColor;
      date: string;
      amountMinor: number;
      currency: string;
      /** Shown only when it isn't the default equal split. */
      splitType: "equal" | "exact" | "percentage" | "shares";
    }
  | {
      kind: "settlement";
      id: string;
      from: string;
      fromColor: AvatarColor;
      to: string;
      toColor: AvatarColor;
      date: string;
      amountMinor: number;
      currency: string;
    };

const C: AvatarColor[] = ["indigo", "amber", "pink", "teal"];

export const JAPAN_ACTIVITY: ActivityRow[] = [
  { kind: "expense", id: "exp_011", title: "Convenience store runs (accumulated)", category: "Groceries", payer: "Sam Rivera", payerColor: C[2], date: "2024-03-27", amountMinor: 8340, currency: "JPY", splitType: "equal" },
  { kind: "expense", id: "exp_010", title: "Osaka Castle entry", category: "Entertainment", payer: "Jordan Park", payerColor: C[1], date: "2024-03-26", amountMinor: 2400, currency: "JPY", splitType: "equal" },
  { kind: "settlement", id: "stl_002", from: "Sam Rivera", fromColor: C[2], to: "Taylor Kim", toColor: C[3], date: "2024-03-26", amountMinor: 8500, currency: "JPY" },
  { kind: "expense", id: "exp_009", title: "Osaka street food tour", category: "Food & Drink", payer: "Taylor Kim", payerColor: C[3], date: "2024-03-25", amountMinor: 28000, currency: "JPY", splitType: "equal" },
  { kind: "expense", id: "exp_012", title: "Izakaya dinner in Dotonbori", category: "Food & Drink", payer: "Alex Chen", payerColor: C[0], date: "2024-03-25", amountMinor: 42600, currency: "JPY", splitType: "shares" },
  { kind: "expense", id: "exp_007", title: "Shinkansen Kyoto to Osaka", category: "Transport", payer: "Alex Chen", payerColor: C[0], date: "2024-03-24", amountMinor: 5720, currency: "JPY", splitType: "equal" },
  { kind: "expense", id: "exp_008", title: "Don Quijote shopping haul", category: "Shopping", payer: "Sam Rivera", payerColor: C[2], date: "2024-03-24", amountMinor: 18750, currency: "JPY", splitType: "exact" },
  { kind: "settlement", id: "stl_001", from: "Jordan Park", fromColor: C[1], to: "Alex Chen", toColor: C[0], date: "2024-03-24", amountMinor: 15000, currency: "USD" },
  { kind: "expense", id: "exp_006", title: "Fushimi Inari snacks & drinks", category: "Food & Drink", payer: "Jordan Park", payerColor: C[1], date: "2024-03-23", amountMinor: 4850, currency: "JPY", splitType: "equal" },
  { kind: "expense", id: "exp_005", title: "Kyoto ryokan (2 nights)", category: "Accommodation", payer: "Taylor Kim", payerColor: C[3], date: "2024-03-22", amountMinor: 120000, currency: "JPY", splitType: "exact" },
  { kind: "expense", id: "exp_004", title: "TeamLab Borderless tickets", category: "Entertainment", payer: "Sam Rivera", payerColor: C[2], date: "2024-03-20", amountMinor: 12800, currency: "JPY", splitType: "equal" },
  { kind: "expense", id: "exp_002", title: "Sushi Dai at Tsukiji", category: "Food & Drink", payer: "Jordan Park", payerColor: C[1], date: "2024-03-19", amountMinor: 32400, currency: "JPY", splitType: "equal" },
  { kind: "expense", id: "exp_001", title: "Shinjuku hotel (3 nights)", category: "Accommodation", payer: "Alex Chen", payerColor: C[0], date: "2024-03-18", amountMinor: 84000, currency: "JPY", splitType: "equal" },
  { kind: "expense", id: "exp_013", title: "Group travel insurance (EU provider)", category: "Other", payer: "Jordan Park", payerColor: C[1], date: "2024-03-16", amountMinor: 9600, currency: "EUR", splitType: "equal" },
  { kind: "expense", id: "exp_003", title: "JR Pass (7-day)", category: "Transport", payer: "Alex Chen", payerColor: C[0], date: "2024-03-15", amountMinor: 23650, currency: "USD", splitType: "equal" },
];

/** The viewing member's own totals — Alex, the group's first member. */
export const JAPAN_VIEWER = {
  paidMinor: 112304,
  shareMinor: 75658,
};

/**
 * Greedy simplification of the group's balances: repeatedly match the largest
 * debtor with the largest creditor. Three payments instead of the six a
 * direct pairwise settlement would need.
 */
export const JAPAN_PLAN = [
  { from: "Jordan Park", fromColor: C[1], to: "Alex Chen", toColor: C[0], amountMinor: 21646, isYou: true },
  { from: "Sam Rivera", fromColor: C[2], to: "Taylor Kim", toColor: C[3], amountMinor: 31509, isYou: false },
  { from: "Jordan Park", fromColor: C[1], to: "Taylor Kim", toColor: C[3], amountMinor: 303, isYou: false },
];
