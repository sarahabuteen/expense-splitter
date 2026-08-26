import { strict as assert } from "node:assert";
import { test } from "node:test";

import { expensesToCsv, memberReports, settlementsToCsv } from "./csv";
import type { ActivityRow, GroupMember } from "./types";

const members: GroupMember[] = [
  { id: "a", name: "Alex", email: null, color: "indigo", balanceMinor: 0, isViewer: true, settled: true },
  { id: "b", name: "Bo", email: null, color: "amber", balanceMinor: 0, isViewer: false, settled: true },
];

const expense = (
  id: string, title: string, amountMinor: number, currency: string,
  convertedMinor: number, payerId: string, shares: [string, number][],
  category = "Food & Drink",
): ActivityRow => ({
  kind: "expense", id, title, category, payer: payerId === "a" ? "Alex" : "Bo",
  payerColor: "indigo", payerId, date: "2026-01-10", amountMinor, currency,
  splitType: "equal", convertedMinor, exchangeRate: 1, rateIsManual: false,
  relativeDate: "", fullDate: "",
  splits: shares.map(([memberId, amount]) => ({
    memberId, name: memberId, color: "indigo" as const,
    amountMinor: amount, convertedAmountMinor: amount,
    percentage: null, shares: null, isPayer: memberId === payerId,
  })),
});

test("csv has the columns the spec asks for, plus a share column per member", () => {
  const csv = expensesToCsv(
    [expense("e1", "Sushi", 3000, "USD", 3000, "a", [["a", 1500], ["b", 1500]])],
    members, "USD",
  );
  const [header, row] = csv.split("\n");
  assert.deepEqual(header.split(","), [
    "Date", "Description", "Amount", "Currency", "Amount (USD)",
    "Category", "Paid by", "Split type", "Alex share (USD)", "Bo share (USD)",
  ]);
  assert.deepEqual(row.split(","), [
    "2026-01-10", "Sushi", "30.00", "USD", "30.00",
    "Food & Drink", "Alex", "equal", "15.00", "15.00",
  ]);
});

test("fields containing commas or quotes are escaped", () => {
  // Descriptions are free text, so this is not optional.
  const csv = expensesToCsv(
    [expense("e1", 'Dinner, drinks and a "round"', 1000, "USD", 1000, "a", [["a", 1000]])],
    members, "USD",
  );
  assert.ok(csv.includes('"Dinner, drinks and a ""round"""'));

  // The escaped comma must not create an extra column. Counting quote
  // characters cannot tell you that — a correctly escaped field DOUBLES its
  // inner quotes — so parse the row properly.
  const fields = parseCsvRow(csv.split("\n")[1]);
  assert.equal(fields.length, 10, "still ten columns");
  assert.equal(fields[1], 'Dinner, drinks and a "round"', "round-trips exactly");
});

/** Minimal RFC-4180 reader, only good enough to verify what we emit. */
function parseCsvRow(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (quoted) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

test("amounts are plain numbers a spreadsheet can sum", () => {
  const csv = expensesToCsv(
    [expense("e1", "Hotel", 84000, "JPY", 56280, "a", [["a", 56280]])],
    members, "USD",
  );
  const row = csv.split("\n")[1].split(",");
  assert.equal(row[2], "84000", "JPY has no decimal places");
  assert.equal(row[3], "JPY");
  assert.equal(row[4], "562.80", "converted into the group currency");
  assert.ok(!csv.includes("$") && !csv.includes("¥"), "no symbols, no separators");
});

test("settlements export separately, since they are a different shape", () => {
  const rows: ActivityRow[] = [{
    kind: "settlement", id: "s1", from: "Bo", fromColor: "amber", to: "Alex",
    toColor: "indigo", fromId: "b", toId: "a", date: "2026-01-12",
    amountMinor: 1000, currency: "USD", convertedMinor: 1000,
    relativeDate: "", fullDate: "",
  }];
  const csv = settlementsToCsv(rows, "USD");
  assert.equal(csv.split("\n")[0], "Date,From,To,Amount,Currency,Amount (USD)");
  assert.equal(csv.split("\n")[1], "2026-01-12,Bo,Alex,10.00,USD,10.00");
  // An expense must not leak into the settlements file.
  assert.equal(settlementsToCsv([expense("e1","X",100,"USD",100,"a",[["a",100]])], "USD").split("\n").length, 1);
});

test("member report compares what someone put in against what they consumed", () => {
  const rows = [
    expense("e1", "Dinner", 6000, "USD", 6000, "a", [["a", 3000], ["b", 3000]]),
    expense("e2", "Taxi", 2000, "USD", 2000, "b", [["a", 1000], ["b", 1000]]),
  ];
  const [first, second] = memberReports(rows, members);
  assert.equal(first.name, "Alex", "sorted by who paid most");
  assert.equal(first.paidMinor, 6000);
  assert.equal(first.shareMinor, 4000);
  assert.equal(first.differenceMinor, 2000, "Alex carried $20 more than he consumed");
  assert.equal(second.differenceMinor, -2000);
  assert.equal(
    first.differenceMinor + second.differenceMinor, 0,
    "differences always cancel out",
  );
});
