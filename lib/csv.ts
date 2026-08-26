import { fromMinor } from "./money";
import type { ActivityRow, GroupMember } from "./types";

/**
 * CSV generation.
 *
 * Amounts are written as plain decimal numbers with no symbol or thousands
 * separator — a spreadsheet has to be able to sum the column, and "$1,234.56"
 * is a string to Excel. The currency travels in its own column instead.
 */

function escape(value: string): string {
  // A field containing a comma, quote or newline must be quoted, with inner
  // quotes doubled. Descriptions are free text, so this is not optional.
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function amount(minor: number, currency: string): string {
  return fromMinor(minor, currency).toFixed(
    currency.toUpperCase() === "JPY" ? 0 : currency.toUpperCase() === "JOD" ? 3 : 2,
  );
}

/**
 * One row per expense, with a column per member holding their share — the
 * shape the spec asks for, and the one that pivots cleanly in a spreadsheet.
 */
export function expensesToCsv(
  rows: ActivityRow[],
  members: GroupMember[],
  groupCurrency: string,
): string {
  const header = [
    "Date",
    "Description",
    "Amount",
    "Currency",
    `Amount (${groupCurrency})`,
    "Category",
    "Paid by",
    "Split type",
    ...members.map((m) => `${m.name} share (${groupCurrency})`),
  ];

  const lines = [header.map(escape).join(",")];

  for (const row of rows) {
    if (row.kind !== "expense") continue;
    const shareOf = new Map(
      row.splits.map((s) => [s.memberId, s.convertedAmountMinor]),
    );
    lines.push(
      [
        row.date,
        row.title,
        amount(row.amountMinor, row.currency),
        row.currency,
        amount(row.convertedMinor, groupCurrency),
        row.category,
        row.payer,
        row.splitType,
        ...members.map((m) => amount(shareOf.get(m.id) ?? 0, groupCurrency)),
      ]
        .map((v) => escape(String(v)))
        .join(","),
    );
  }

  return lines.join("\n");
}

/** Settlements are a separate shape, so they get their own file. */
export function settlementsToCsv(rows: ActivityRow[], groupCurrency: string): string {
  const lines = [
    ["Date", "From", "To", "Amount", "Currency", `Amount (${groupCurrency})`]
      .map(escape)
      .join(","),
  ];

  for (const row of rows) {
    if (row.kind !== "settlement") continue;
    lines.push(
      [
        row.date,
        row.from,
        row.to,
        amount(row.amountMinor, row.currency),
        row.currency,
        amount(row.convertedMinor, groupCurrency),
      ]
        .map((v) => escape(String(v)))
        .join(","),
    );
  }

  return lines.join("\n");
}

export type MemberReport = {
  name: string;
  paidMinor: number;
  shareMinor: number;
  /** Positive means they put in more than they consumed. */
  differenceMinor: number;
};

/**
 * Who tends to pay more, and who pays less — the spec's per-member comparison.
 * Distinct from balances: this ignores settlements, so it describes spending
 * habits rather than the current debt position.
 */
export function memberReports(
  rows: ActivityRow[],
  members: GroupMember[],
): MemberReport[] {
  const paid = new Map<string, number>();
  const share = new Map<string, number>();

  for (const row of rows) {
    if (row.kind !== "expense") continue;
    paid.set(row.payerId, (paid.get(row.payerId) ?? 0) + row.convertedMinor);
    for (const split of row.splits) {
      share.set(
        split.memberId,
        (share.get(split.memberId) ?? 0) + split.convertedAmountMinor,
      );
    }
  }

  return members
    .map((m) => {
      const paidMinor = paid.get(m.id) ?? 0;
      const shareMinor = share.get(m.id) ?? 0;
      return {
        name: m.name,
        paidMinor,
        shareMinor,
        differenceMinor: paidMinor - shareMinor,
      };
    })
    .sort((a, b) => b.paidMinor - a.paidMinor);
}
