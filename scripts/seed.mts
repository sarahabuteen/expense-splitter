/**
 * Seeds the five demo groups that power guest mode.
 *
 * Demo rows are `is_demo = true, owner_id = null`: readable by everyone,
 * writable by nobody. No role may insert them, which is exactly why this uses
 * the secret key — the one legitimate use of an RLS bypass in the project.
 *
 * Reads data/sample-groups.json, which is gitignored reference material. That
 * is fine HERE, in a script run manually against the database. Nothing in the
 * runtime app may import from data/ — the deployed build will not have it.
 */
import fs from "node:fs";

import { createClient } from "@supabase/supabase-js";

import { buildAll, type Fixture } from "../lib/seed/build";

for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim();
}

const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false },
});

const fixture = JSON.parse(fs.readFileSync("data/sample-groups.json", "utf8")) as Fixture;
const groups = buildAll(fixture);

// Categories are global and predefined; map by name once.
const { data: cats } = await db.from("categories").select("id, name").is("group_id", null);
const categoryId = new Map((cats ?? []).map((c) => [c.name.toLowerCase(), c.id as string]));

// Idempotent: clear existing demo data first so re-running is safe.
const { data: existing } = await db.from("groups").select("id").eq("is_demo", true);
for (const g of existing ?? []) {
  await db.from("settlements").delete().eq("group_id", g.id);
  const { data: exps } = await db.from("expenses").select("id").eq("group_id", g.id);
  for (const e of exps ?? []) await db.from("expense_splits").delete().eq("expense_id", e.id);
  await db.from("expenses").delete().eq("group_id", g.id);
  await db.from("events").delete().eq("group_id", g.id);
  await db.from("members").delete().eq("group_id", g.id);
  await db.from("groups").delete().eq("id", g.id);
}
if (existing?.length) console.log(`cleared ${existing.length} existing demo group(s)`);

const counts = { groups: 0, members: 0, expenses: 0, splits: 0, settlements: 0, events: 0 };

for (const built of groups) {
  const { data: group, error: gErr } = await db
    .from("groups").insert(built.group).select("id").single();
  if (gErr) throw new Error(`group ${built.group.name}: ${gErr.message}`);
  counts.groups++;

  const { data: members, error: mErr } = await db
    .from("members")
    .insert(built.members.map((m) => ({
      group_id: group.id, name: m.name, email: m.email, avatar_color: m.avatar_color,
    })))
    .select("id, name");
  if (mErr) throw new Error(`members for ${built.group.name}: ${mErr.message}`);
  counts.members += members.length;

  // Fixture member ids -> real uuids, matched by position.
  const memberId = new Map(built.members.map((m, i) => [m.fixtureId, members[i].id as string]));
  const nameOf = new Map(built.members.map((m, i) => [m.fixtureId, members[i].name as string]));

  // Guest mode is the showcase, so the demo groups get a history too — an
  // empty activity page would read as a broken feature rather than a new one.
  // Timestamps are derived from each row's own date so the feed is ordered
  // like the events actually happened.
  const events: Record<string, unknown>[] = [];
  // The fixture mixes shapes: group.createdAt is a full ISO timestamp, while
  // expense and settlement dates were already truncated to YYYY-MM-DD for
  // their `date` columns. Accept either, and give a bare date a midday time so
  // the ordering offsets below cannot cross a day boundary.
  const at = (value: string, offsetMinutes = 0) => {
    const base = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00Z` : value;
    const parsed = new Date(base);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`seed: can't read "${value}" as a date`);
    }
    return new Date(parsed.getTime() + offsetMinutes * 60_000).toISOString();
  };

  events.push({
    group_id: group.id,
    kind: "group_created",
    actor_id: null,
    actor_name: members[0].name,
    subject: built.group.name,
    detail: { memberCount: members.length, currency: built.group.currency },
    created_at: at(built.group.created_at ?? built.expenses[0]?.date ?? "2026-01-01", -60),
  });

  for (const [i, m] of built.members.slice(1).entries()) {
    events.push({
      group_id: group.id,
      kind: "member_added",
      actor_id: null,
      actor_name: members[0].name,
      subject: m.name,
      detail: {},
      created_at: at(built.group.created_at ?? built.expenses[0]?.date ?? "2026-01-01", -50 + i),
    });
  }

  for (const e of built.expenses) {
    const { data: expense, error: eErr } = await db
      .from("expenses")
      .insert({
        group_id: group.id,
        description: e.description,
        amount_minor: e.amount_minor,
        currency: e.currency,
        exchange_rate: e.exchange_rate,
        converted_amount_minor: e.converted_amount_minor,
        paid_by: memberId.get(e.paid_by),
        split_type: e.split_type,
        category_id: categoryId.get(e.category.toLowerCase()) ?? null,
        date: e.date,
        notes: e.notes,
        recurring: e.recurring,
      })
      .select("id").single();
    if (eErr) throw new Error(`expense ${e.description}: ${eErr.message}`);
    counts.expenses++;

    const { error: sErr } = await db.from("expense_splits").insert(
      e.splits.map((s) => ({
        expense_id: expense.id,
        member_id: memberId.get(s.member),
        amount_minor: s.amount_minor,
        converted_amount_minor: s.converted_amount_minor,
        shares: s.shares,
        percentage: s.percentage,
      })),
    );
    if (sErr) throw new Error(`splits for ${e.description}: ${sErr.message}`);
    counts.splits += e.splits.length;

    events.push({
      group_id: group.id,
      kind: "expense_added",
      actor_id: null,
      actor_name: nameOf.get(e.paid_by) ?? "Someone",
      subject: e.description,
      detail: {
        expenseId: expense.id,
        amountMinor: e.amount_minor,
        currency: e.currency,
        convertedMinor: e.converted_amount_minor,
      },
      created_at: at(e.date),
    });
  }

  if (built.settlements.length) {
    const { error: stErr } = await db.from("settlements").insert(
      built.settlements.map((s) => ({
        group_id: group.id,
        from_member: memberId.get(s.from_member),
        to_member: memberId.get(s.to_member),
        amount_minor: s.amount_minor,
        currency: s.currency,
        exchange_rate: s.exchange_rate,
        converted_amount_minor: s.converted_amount_minor,
        date: s.date,
      })),
    );
    if (stErr) throw new Error(`settlements for ${built.group.name}: ${stErr.message}`);
    counts.settlements += built.settlements.length;

    for (const st of built.settlements) {
      events.push({
        group_id: group.id,
        kind: "settlement_added",
        actor_id: null,
        actor_name: nameOf.get(st.from_member) ?? "Someone",
        subject: `${nameOf.get(st.from_member) ?? "Someone"} → ${nameOf.get(st.to_member) ?? "someone"}`,
        detail: {
          amountMinor: st.amount_minor,
          currency: st.currency,
          convertedMinor: st.converted_amount_minor,
        },
        created_at: at(st.date),
      });
    }
  }

  const { error: evErr } = await db.from("events").insert(events);
  if (evErr) throw new Error(`events for ${built.group.name}: ${evErr.message}`);
  counts.events += events.length;
}

console.log("seeded:", counts);
