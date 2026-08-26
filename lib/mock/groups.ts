import type { AvatarColor } from "@/lib/avatar-colors";

/**
 * PLACEHOLDER DATA — UI only, nothing is wired to the database yet.
 *
 * These are the real seeded figures (totals, member names, balances verified
 * against the live project), so the layout is exercised by data the app will
 * actually render rather than by convenient fictions. Replace this module with
 * the server data layer; the shapes below are the contract to hit.
 */

export type GroupMember = {
  id: string;
  name: string;
  email: string | null;
  color: AvatarColor;
  /** Net position in the group's currency, minor units. */
  balanceMinor: number;
};

export type GroupSummary = {
  id: string;
  name: string;
  description: string;
  currency: string;
  members: GroupMember[];
  expenseCount: number;
  totalMinor: number;
  /** The viewing member's own net position. */
  yourBalanceMinor: number;
  lastActivity: string;
};

const COLORS: AvatarColor[] = [
  "indigo", "amber", "pink", "teal", "violet", "orange", "cyan", "emerald", "rose", "blue",
];

/**
 * `nameOnly` marks members added by name with no account — they still take part
 * in splits and balances. Dev Okafor in Camping Weekend is the fixture's case.
 */
function members(
  names: string[],
  balances: number[],
  nameOnly: string[] = [],
): GroupMember[] {
  return names.map((name, i) => ({
    id: `mem_${i}`,
    name,
    email: nameOnly.includes(name)
      ? null
      : `${name.split(" ")[0].toLowerCase()}@example.com`,
    color: COLORS[i % COLORS.length],
    balanceMinor: balances[i],
  }));
}

export const MOCK_GROUPS: GroupSummary[] = [
  {
    id: "grp_japan",
    name: "Trip to Japan",
    description: "Two weeks in Tokyo, Kyoto, and Osaka. Cherry blossom season 2024.",
    currency: "USD",
    members: members(
      ["Alex Chen", "Jordan Park", "Sam Rivera", "Taylor Kim"],
      [21646, -21949, -31509, 31812],
    ),
    expenseCount: 13,
    totalMinor: 275125,
    yourBalanceMinor: 21646,
    lastActivity: "2024-03-27",
  },
  {
    id: "grp_apartment",
    name: "Apartment 4B",
    description: "Monthly shared expenses for our apartment.",
    currency: "USD",
    members: members(
      ["Riley Morgan", "Casey Brooks", "Drew Patel"],
      [226709, -113898, -112811],
    ),
    expenseCount: 10,
    totalMinor: 836798,
    yourBalanceMinor: 226709,
    lastActivity: "2024-02-18",
  },
  {
    id: "grp_lunch",
    name: "Office Lunch Crew",
    description: "Weekly lunches, coffee runs, and the occasional birthday cake.",
    currency: "USD",
    members: members(
      ["Mia Torres", "Noah Williams", "Priya Sharma", "Ethan Nakamura"],
      [1950, -3568, 5398, -3780],
    ),
    expenseCount: 8,
    totalMinor: 36745,
    yourBalanceMinor: 1950,
    lastActivity: "2024-03-06",
  },
  {
    id: "grp_birthday",
    name: "Sarah's Birthday Present",
    description: "Chipping in for Sarah's birthday gift, dinner, and decorations.",
    currency: "USD",
    members: members(
      ["Olivia Hayes", "Ben Gutierrez", "Chloe Yun", "Marcus Webb"],
      [0, 1437, -1437, 0],
    ),
    expenseCount: 4,
    totalMinor: 35749,
    yourBalanceMinor: 0,
    lastActivity: "2024-02-16",
  },
  {
    id: "grp_camping",
    name: "Camping Weekend",
    description: "Lake Tahoe camping trip. Firewood, food, and fresh air.",
    currency: "USD",
    members: members(
      ["Jake Foster", "Lily Tran", "Omar Hassan", "Rachel Kim", "Dev Okafor"],
      [17779, 7929, -8696, -7897, -9115],
      ["Dev Okafor"],
    ),
    expenseCount: 8,
    totalMinor: 55344,
    yourBalanceMinor: 17779,
    lastActivity: "2024-03-10",
  },
];

/**
 * A freshly created group — no members but you, no expenses. This is the state
 * the create dialog drops you into, and the one the group empty state is for.
 */
MOCK_GROUPS.push({
  id: "grp_new",
  name: "Weekend in Amman",
  description: "",
  currency: "JOD",
  members: members(["You", "Layla Haddad", "Omar Nasser"], [0, 0, 0]),
  expenseCount: 0,
  totalMinor: 0,
  yourBalanceMinor: 0,
  lastActivity: "2026-08-26",
});

export function mockGroup(id: string): GroupSummary | undefined {
  return MOCK_GROUPS.find((g) => g.id === id);
}
