-- ---------------------------------------------------------------------------
-- Activity feed — an append-only record of what happened in a group.
--
-- Deliberately NOT derived from the expenses and settlements tables. A feed
-- built from those can only ever show what still exists: an expense that was
-- edited shows its new values, and one that was deleted shows nothing at all.
-- "Sam deleted Dinner" is exactly the entry people look for, so the history
-- has to be written down as it happens.
--
-- Consequently there is NO foreign key to the expense or settlement. The row
-- it describes is allowed to disappear; the event outlives it. The subject id
-- is kept in `detail` for linking, and treated as possibly-dangling.
-- ---------------------------------------------------------------------------

create type event_kind as enum (
  'group_created',
  'group_updated',
  'member_added',
  'member_removed',
  'expense_added',
  'expense_edited',
  'expense_deleted',
  'settlement_added',
  'settlement_deleted'
);

create table events (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references groups(id) on delete cascade,
  kind       event_kind not null,
  -- Who did it. The account may be deleted later, so the name is copied in
  -- rather than joined — a feed that renders "someone" for old rows is worse
  -- than one that remembers.
  actor_id   uuid references auth.users(id) on delete set null,
  actor_name text not null,
  -- What it was about, in the words the feed shows: "Dinner at Ippudo".
  subject    text not null,
  -- Amounts, member names, changed field names. Shape varies by kind, which
  -- is why it is jsonb and not columns.
  detail     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- The feed is always "this group, newest first", and it pages.
create index on events (group_id, created_at desc, id desc);

alter table events enable row level security;

-- Readable by anyone who can read the group (so guests see demo history),
-- writable only through a group you own. Nothing ever updates or deletes an
-- event: the audit trail is append-only, so those policies are absent by
-- design rather than by omission.
create policy events_select on events for select using (can_read_group(group_id));
create policy events_write  on events for insert with check (can_write_group(group_id));
