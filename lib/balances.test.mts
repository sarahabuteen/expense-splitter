import { strict as assert } from "node:assert";
import { test } from "node:test";

import { simplifyDebts, isSettled, SUGGESTION_THRESHOLD_MINOR } from "./balances";
import type { GroupMember } from "./types";

function member(
  id: string,
  name: string,
  balanceMinor: number,
  isViewer = false,
): GroupMember {
  return { id, name, email: null, color: "indigo", balanceMinor, isViewer };
}

test("settled threshold treats a rounding residue as zero", () => {
  assert.equal(isSettled(0), true);
  assert.equal(isSettled(1), true, "one minor unit is rounding, not a debt");
  assert.equal(isSettled(-1), true);
  assert.equal(isSettled(2), false);
});

test("every zero-sum group clears, in at most n-1 payments", () => {
  // Random balance sets that sum to zero, the invariant the schema guarantees.
  let seed = 7;
  const rand = (n: number) => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed % n;
  };

  for (let trial = 0; trial < 300; trial++) {
    const n = 2 + rand(8);
    const balances: number[] = [];
    for (let i = 0; i < n - 1; i++) balances.push(rand(200000) - 100000);
    balances.push(-balances.reduce((a, b) => a + b, 0));

    const members = balances.map((b, i) => member(`m${i}`, `M${i}`, b, i === 0));
    const { yours, others } = simplifyDebts(members);
    const payments = [...(yours ? [yours] : []), ...others];

    assert.ok(payments.length <= n - 1, `${payments.length} payments for ${n} members`);

    // Applying every payment must clear everyone.
    const after = new Map(members.map((m) => [m.id, m.balanceMinor]));
    for (const p of payments) {
      after.set(p.fromId, after.get(p.fromId)! + p.amountMinor);
      after.set(p.toId, after.get(p.toId)! - p.amountMinor);
    }
    for (const [id, balance] of after) {
      assert.ok(
        Math.abs(balance) < SUGGESTION_THRESHOLD_MINOR,
        `${id} left with ${balance}`,
      );
    }
  }
});

test("the viewer's payment is separated, with its direction resolved", () => {
  const owed = simplifyDebts([
    member("a", "Alex", 5000, true),
    member("b", "Bo", -5000),
  ]);
  assert.equal(owed.yours?.viewerRole, "payee", "the viewer is owed");
  assert.equal(owed.yours?.from, "Bo");

  const owes = simplifyDebts([
    member("a", "Alex", -5000, true),
    member("b", "Bo", 5000),
  ]);
  assert.equal(owes.yours?.viewerRole, "payer", "the viewer owes");
  assert.equal(owes.yours?.to, "Bo");
});

test("direction survives two members sharing a name", () => {
  // The regression this guards: direction was decided by comparing the
  // viewer's NAME against the payment's recipient, so a duplicate name could
  // invert the sign and tell someone they were owed money they in fact owed.
  const plan = simplifyDebts([
    member("viewer", "Alex", -7500, true),
    member("other", "Alex", 7500),
  ]);
  assert.equal(plan.yours?.viewerRole, "payer");
  assert.equal(plan.yours?.fromId, "viewer");
  assert.equal(plan.yours?.toId, "other");
});

test("residual amounts below the suggestion threshold are not proposed", () => {
  const plan = simplifyDebts([
    member("a", "Alex", 50, true),
    member("b", "Bo", -50),
  ]);
  assert.equal(plan.yours, null, "chasing anyone for 50 cents is petty");
  assert.deepEqual(plan.others, []);
});

test("an all-settled group proposes nothing", () => {
  const plan = simplifyDebts([
    member("a", "Alex", 0, true),
    member("b", "Bo", 0),
    member("c", "Cy", 1),
  ]);
  assert.equal(plan.yours, null);
  assert.deepEqual(plan.others, []);
});
