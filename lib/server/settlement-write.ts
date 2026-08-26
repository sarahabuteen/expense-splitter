import "server-only";

import { convertMinor } from "@/lib/money";
import { createRouteClient } from "@/lib/supabase/server";
import { currencyFor } from "@/lib/currencies";
import { formatMoney } from "@/lib/format";
import { getGroup } from "./groups";
import { getRate, RateError } from "./rates";
import { requireUser } from "@/lib/supabase/actor";
import { WriteError } from "./group-write";

/**
 * Recording and undoing settlements.
 *
 * A settlement is money that already moved, so it is only ever recorded, never
 * "executed". That is also why undo is offered instead of a confirmation step:
 * removing the row is exact, and nothing real needs reversing.
 */

export type SettlementInput = {
  fromMember: string;
  toMember: string;
  amountMinor: number;
  currency: string;
  date: string;
  exchangeRate?: number;
};

const notFound = () => new WriteError("That group doesn't exist, or isn't yours.", 404);

async function assertWritableGroup(
  db: Awaited<ReturnType<typeof createRouteClient>>,
  groupId: string,
  userId: string,
) {
  const { data } = await db
    .from("groups")
    .select("id, currency")
    .eq("id", groupId)
    .eq("owner_id", userId)
    .eq("is_demo", false)
    .maybeSingle();

  if (!data) throw notFound();
  return data as { id: string; currency: string };
}

export async function createSettlement(groupId: string, input: SettlementInput) {
  const { userId } = await requireUser();
  const db = await createRouteClient();
  const group = await assertWritableGroup(db, groupId, userId);

  if (input.amountMinor <= 0) {
    throw new WriteError("Enter an amount greater than zero.", 400);
  }
  if (!currencyFor(input.currency)) {
    throw new WriteError("That isn't a supported currency.", 400);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    throw new WriteError("That isn't a valid date.", 400);
  }
  if (input.fromMember === input.toMember) {
    throw new WriteError("Someone can't settle up with themselves.", 400);
  }

  const { data: members } = await db.from("members").select("id").eq("group_id", groupId);
  const valid = new Set((members ?? []).map((m) => m.id as string));
  if (!valid.has(input.fromMember) || !valid.has(input.toMember)) {
    throw new WriteError("Both people must be in this group.", 400);
  }

  let rate = input.exchangeRate;
  const manual = rate !== undefined && rate > 0;
  if (!manual) {
    try {
      rate = await getRate(input.currency, group.currency);
    } catch (error) {
      throw new WriteError(
        error instanceof RateError
          ? `${error.message} Enter a rate manually to continue.`
          : "Couldn't fetch an exchange rate.",
        502,
      );
    }
  }

  // A settlement may be paid in a currency the group doesn't use — the fixture
  // has a JPY payment inside a USD group — so compare in the group's currency.
  const convertedMinor = convertMinor(
    input.amountMinor,
    input.currency,
    group.currency,
    rate!,
  );

  await assertDebtExists(groupId, input.fromMember, input.toMember, convertedMinor, group.currency);

  const { data, error } = await db
    .from("settlements")
    .insert({
      group_id: groupId,
      from_member: input.fromMember,
      to_member: input.toMember,
      amount_minor: input.amountMinor,
      currency: input.currency.toUpperCase(),
      exchange_rate: rate,
      converted_amount_minor: convertedMinor,
      date: input.date,
    })
    .select("id");

  if (error) throw new WriteError(error.message, 400);
  if (!data?.length) throw notFound();

  return { id: data[0].id as string };
}

/**
 * Core #6: "Prevent settling a debt that doesn't exist."
 *
 * Checked against BOTH plans. Only the direct one would reject every payment
 * the simplified view legitimately offered; only the simplified one would
 * reject a real pairwise debt between two people whose net positions point the
 * other way. A payment the UI offered must be recordable.
 */
async function assertDebtExists(
  groupId: string,
  fromMember: string,
  toMember: string,
  convertedMinor: number,
  currency: string,
) {
  const group = await getGroup(groupId);
  if (!group) throw notFound();

  const candidates = [
    group.plan.yours,
    ...group.plan.others,
    group.directPlan.yours,
    ...group.directPlan.others,
  ].filter((p) => p !== null);

  const matching = candidates.filter(
    (p) => p.fromId === fromMember && p.toId === toMember,
  );

  if (matching.length === 0) {
    const reversed = candidates.some(
      (p) => p.fromId === toMember && p.toId === fromMember,
    );
    throw new WriteError(
      reversed
        ? "That's the wrong way round — the debt runs the other way."
        : "There's no debt between those two to settle.",
      409,
    );
  }

  // Partial payments are fine; paying more than is owed is not.
  const largest = Math.max(...matching.map((p) => p.amountMinor));
  if (convertedMinor > largest) {
    throw new WriteError(
      `That's more than is owed. The most outstanding between them is ${formatMoney(largest, currency)}.`,
      409,
    );
  }
}

export async function deleteSettlement(groupId: string, settlementId: string) {
  const { userId } = await requireUser();
  const db = await createRouteClient();
  await assertWritableGroup(db, groupId, userId);

  const { data } = await db
    .from("settlements")
    .delete()
    .eq("id", settlementId)
    .eq("group_id", groupId)
    .select("id");

  if (!data?.length) throw new WriteError("That settlement doesn't exist.", 404);
  return { id: settlementId };
}
