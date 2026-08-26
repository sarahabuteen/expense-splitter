import type { AvatarColor } from "./avatar-colors";

export type GroupMember = {
  id: string;
  name: string;
  email: string | null;
  color: AvatarColor;
  /** Net position in the group's currency, minor units. Positive = is owed. */
  balanceMinor: number;
  /** True for the member representing the person viewing the page. */
  isViewer: boolean;
};

export type GroupSummary = {
  id: string;
  name: string;
  description: string;
  currency: string;
  isDemo: boolean;
  members: GroupMember[];
  expenseCount: number;
  totalMinor: number;
  yourBalanceMinor: number;
};

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
      splitType: "equal" | "exact" | "percentage" | "shares";
      /** Who owed what, for the expanded detail view. */
      splits: {
        memberId: string;
        name: string;
        color: AvatarColor;
        amountMinor: number;
        /** In the group's currency — what pairwise debts are computed from. */
        convertedAmountMinor: number;
        /** Present for their own split types — needed to reopen an edit. */
        percentage: number | null;
        shares: number | null;
        isPayer: boolean;
      }[];
      payerId: string;
      /** In the group's currency, when the expense was paid in another. */
      convertedMinor: number;
      relativeDate: string;
      fullDate: string;
    }
  | {
      kind: "settlement";
      id: string;
      from: string;
      fromColor: AvatarColor;
      to: string;
      toColor: AvatarColor;
      fromId: string;
      toId: string;
      date: string;
      amountMinor: number;
      currency: string;
      convertedMinor: number;
      relativeDate: string;
      fullDate: string;
    };

export type PlannedPayment = {
  /** Ids, not names: two members can share a name, and a payment's direction
      must never be decided by comparing strings. */
  fromId: string;
  from: string;
  fromColor: AvatarColor;
  toId: string;
  to: string;
  toColor: AvatarColor;
  amountMinor: number;
};

export type SettlementPlan = {
  /** The viewer's own payment, with its direction already resolved. */
  yours: (PlannedPayment & { viewerRole: "payer" | "payee" }) | null;
  others: PlannedPayment[];
};

export type GroupDetail = GroupSummary & {
  activity: ActivityRow[];
  /** The nine predefined plus any this group has added. */
  categories: string[];
  /** Who owes whom directly, before any simplification. */
  directPlan: SettlementPlan;
  viewerPaidMinor: number;
  viewerShareMinor: number;
  plan: SettlementPlan;
};
