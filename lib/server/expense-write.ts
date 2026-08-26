import "server-only";

import { bookExpense } from "@/lib/booking";
import { computeSplits, validateSplits, type SplitType } from "@/lib/splits";
import { currencyFor } from "@/lib/currencies";
import { createRouteClient } from "@/lib/supabase/server";
import { getRate, RateError } from "./rates";
import { requireUser } from "@/lib/supabase/actor";
import { WriteError } from "./group-write";

/**
 * Expense mutations.
 *
 * The money rules are NOT reimplemented here: this validates, then calls the
 * same computeSplits() and bookExpense() the seed and the composer use. The
 * composer's live validation is feedback, not a control — everything is
 * checked again here, because anything enforced only in the browser is not
 * enforced.
 */

export type ExpenseInput = {
  description: string;
  amountMinor: number;
  currency: string;
  date: string;
  category: string;
  paidBy: string;
  splitType: SplitType;
  participants: string[];
  values?: Record<string, number>;
  /** A user-supplied rate wins over the fetched one and is flagged as manual. */
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

/** Shared by create and update: validate, price, and split. */
async function prepare(
  db: Awaited<ReturnType<typeof createRouteClient>>,
  groupId: string,
  groupCurrency: string,
  input: ExpenseInput,
) {
  const description = input.description.trim();
  if (!description) throw new WriteError("Give the expense a description.", 400);
  if (!currencyFor(input.currency)) {
    throw new WriteError("That isn't a supported currency.", 400);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    throw new WriteError("That isn't a valid date.", 400);
  }

  // Members must all belong to this group — otherwise a crafted request could
  // splice someone else's member into the split.
  const { data: members } = await db.from("members").select("id").eq("group_id", groupId);
  const valid = new Set((members ?? []).map((m) => m.id as string));

  if (!valid.has(input.paidBy)) {
    throw new WriteError("That payer isn't in this group.", 400);
  }
  const participants = input.participants.filter((id) => valid.has(id));
  if (participants.length === 0) {
    throw new WriteError("Choose at least one person to split with.", 400);
  }

  const payerIndex = participants.indexOf(input.paidBy);

  const errors = validateSplits({
    splitType: input.splitType,
    totalMinor: input.amountMinor,
    currency: input.currency,
    participants,
    payerIndex,
    values: input.values,
  });
  if (errors.length > 0) throw new WriteError(errors[0].message, 400);

  const splits = computeSplits({
    splitType: input.splitType,
    totalMinor: input.amountMinor,
    currency: input.currency,
    participants,
    payerIndex,
    values: input.values,
  });

  let rate = input.exchangeRate;
  const manual = rate !== undefined && rate > 0;

  if (!manual) {
    try {
      rate = await getRate(input.currency, groupCurrency);
    } catch (error) {
      // Refuse rather than guess: a made-up rate silently corrupts every
      // balance in the group.
      throw new WriteError(
        error instanceof RateError
          ? `${error.message} Enter a rate manually to continue.`
          : "Couldn't fetch an exchange rate.",
        502,
      );
    }
  }

  const booked = bookExpense({
    amountMinor: input.amountMinor,
    currency: input.currency,
    groupCurrency,
    exchangeRate: rate!,
    splits,
    payerIndex,
  });

  const { data: category } = await db
    .from("categories")
    .select("id")
    .or(`group_id.eq.${groupId},group_id.is.null`)
    .ilike("name", input.category)
    .limit(1)
    .maybeSingle();

  return { description, booked, manual, categoryId: (category?.id as string) ?? null };
}

export async function createExpense(groupId: string, input: ExpenseInput) {
  const { userId } = await requireUser();
  const db = await createRouteClient();
  const group = await assertWritableGroup(db, groupId, userId);

  const { description, booked, manual, categoryId } = await prepare(
    db, groupId, group.currency, input,
  );

  const { data: expense, error } = await db
    .from("expenses")
    .insert({
      group_id: groupId,
      description,
      amount_minor: booked.amountMinor,
      currency: booked.currency,
      exchange_rate: booked.exchangeRate,
      converted_amount_minor: booked.convertedAmountMinor,
      rate_is_manual: manual,
      paid_by: input.paidBy,
      split_type: input.splitType,
      category_id: categoryId,
      date: input.date,
    })
    .select("id")
    .single();

  if (error || !expense) throw new WriteError(error?.message ?? "Couldn't save the expense.", 400);

  const { error: splitError } = await db.from("expense_splits").insert(
    booked.splits.map((s) => ({
      expense_id: expense.id,
      member_id: s.memberId,
      amount_minor: s.amountMinor,
      converted_amount_minor: s.convertedAmountMinor,
      percentage: s.percentage ?? null,
      shares: s.shares ?? null,
    })),
  );
  if (splitError) throw new WriteError(splitError.message, 400);

  return { id: expense.id as string };
}

export async function updateExpense(
  groupId: string,
  expenseId: string,
  input: ExpenseInput,
) {
  const { userId } = await requireUser();
  const db = await createRouteClient();
  const group = await assertWritableGroup(db, groupId, userId);

  const { data: existing } = await db
    .from("expenses")
    .select("id")
    .eq("id", expenseId)
    .eq("group_id", groupId)
    .maybeSingle();
  if (!existing) throw new WriteError("That expense doesn't exist.", 404);

  const { description, booked, manual, categoryId } = await prepare(
    db, groupId, group.currency, input,
  );

  const { data: updated } = await db
    .from("expenses")
    .update({
      description,
      amount_minor: booked.amountMinor,
      currency: booked.currency,
      exchange_rate: booked.exchangeRate,
      converted_amount_minor: booked.convertedAmountMinor,
      rate_is_manual: manual,
      paid_by: input.paidBy,
      split_type: input.splitType,
      category_id: categoryId,
      date: input.date,
    })
    .eq("id", expenseId)
    .select("id");

  if (!updated?.length) throw new WriteError("That expense doesn't exist.", 404);

  // Splits are replaced wholesale: an edit can change who is even involved,
  // so reconciling row by row would be more code and more ways to be wrong.
  await db.from("expense_splits").delete().eq("expense_id", expenseId);
  const { error: splitError } = await db.from("expense_splits").insert(
    booked.splits.map((s) => ({
      expense_id: expenseId,
      member_id: s.memberId,
      amount_minor: s.amountMinor,
      converted_amount_minor: s.convertedAmountMinor,
      percentage: s.percentage ?? null,
      shares: s.shares ?? null,
    })),
  );
  if (splitError) throw new WriteError(splitError.message, 400);

  return { id: expenseId };
}

export async function deleteExpense(groupId: string, expenseId: string) {
  const { userId } = await requireUser();
  const db = await createRouteClient();
  await assertWritableGroup(db, groupId, userId);

  // Splits first: expense_splits.member_id is ON DELETE RESTRICT, so the
  // cascade from the expense is not guaranteed to reach them first.
  await db.from("expense_splits").delete().eq("expense_id", expenseId);

  const { data } = await db
    .from("expenses")
    .delete()
    .eq("id", expenseId)
    .eq("group_id", groupId)
    .select("id");

  if (!data?.length) throw new WriteError("That expense doesn't exist.", 404);
  return { id: expenseId };
}
