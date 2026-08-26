-- ---------------------------------------------------------------------------
-- Expense Splitter — initial schema
--
-- Auth is Supabase Auth, so `auth.users` exists and `auth.uid()` returns the
-- signed-in user. RLS is therefore the real authorization boundary: a route
-- handler that forgets an ownership filter leaks nothing, because Postgres
-- refuses the rows independently.
--
-- The browser never talks to Supabase directly. Route handlers act AS the
-- signed-in user (cookie-backed session via @supabase/ssr), so policies apply
-- to every query. The secret key is reserved for seeding demo data.
--
-- MONEY IS NEVER A FLOAT. All amounts are integer minor units in the row's own
-- currency (USD cents, JPY yen — JPY has 0 decimals, so minor == major).
-- `converted_amount_minor` is the same amount in the GROUP's currency, rounded
-- once at write time, so balance views are pure integer sums and can never
-- disagree with what the timeline displays.
-- ---------------------------------------------------------------------------

-- ------------------------------------------------------------------ profiles
-- Mirrors auth.users with app-level preferences. Created by trigger so a
-- profile always exists for a signed-in user.

create table profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  display_name     text,
  default_currency char(3) not null default 'USD',
  created_at       timestamptz not null default now()
);

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- -------------------------------------------------------------------- groups

create table groups (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  currency    char(3) not null,
  -- Demo groups seed the guest experience: owner_id is NULL, readable by
  -- everyone, writable by nobody. Guest mode needs no special-casing in app code.
  is_demo     boolean not null default false,
  created_at  timestamptz not null default now(),
  constraint owner_or_demo check (is_demo or owner_id is not null)
);

create index on groups (owner_id);
create index on groups (is_demo) where is_demo;

create table members (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references groups(id) on delete cascade,
  -- Name-only members (e.g. Dev Okafor in the fixture) never get a user_id.
  -- Nullable so an invite flow can link accounts later without a migration.
  user_id      uuid references auth.users(id) on delete set null,
  name         text not null,
  email        text,
  avatar_color text not null,
  created_at   timestamptz not null default now()
);

create index on members (group_id);
create unique index members_email_lower on members (group_id, lower(email))
  where email is not null;

-- ---------------------------------------------------------------- categories

create table categories (
  id            uuid primary key default gen_random_uuid(),
  -- NULL group_id = one of the nine predefined categories, shared by everyone.
  group_id      uuid references groups(id) on delete cascade,
  name          text not null,
  is_predefined boolean not null default false
);

create unique index categories_predefined_name on categories (lower(name))
  where group_id is null;
create unique index categories_group_name on categories (group_id, lower(name))
  where group_id is not null;

insert into categories (name, is_predefined) values
  ('Food & Drink', true), ('Transport', true), ('Accommodation', true),
  ('Housing', true), ('Entertainment', true), ('Shopping', true),
  ('Utilities', true), ('Groceries', true), ('Other', true);

-- ------------------------------------------------------------------ expenses

create type split_type as enum ('equal', 'exact', 'percentage', 'shares');
create type recurrence as enum ('weekly', 'biweekly', 'monthly');

create table expenses (
  id                     uuid primary key default gen_random_uuid(),
  group_id               uuid not null references groups(id) on delete cascade,
  description            text not null,
  amount_minor           bigint not null check (amount_minor > 0),
  currency               char(3) not null,
  exchange_rate          numeric(20, 10) not null check (exchange_rate > 0),
  converted_amount_minor bigint not null check (converted_amount_minor > 0),
  -- A user-supplied rate is kept distinct from a fetched one so the UI can say so.
  rate_is_manual         boolean not null default false,
  paid_by                uuid not null references members(id) on delete restrict,
  split_type             split_type not null,
  category_id            uuid references categories(id) on delete set null,
  date                   date not null,
  notes                  text,
  recurring              recurrence,
  created_at             timestamptz not null default now()
);

-- Reverse-chronological listing within a group is the hottest query.
create index on expenses (group_id, date desc);
create index on expenses (paid_by);

create table expense_splits (
  id                     uuid primary key default gen_random_uuid(),
  expense_id             uuid not null references expenses(id) on delete cascade,
  member_id              uuid not null references members(id) on delete restrict,
  amount_minor           bigint not null check (amount_minor >= 0),
  converted_amount_minor bigint not null check (converted_amount_minor >= 0),
  shares                 numeric(12, 4),  -- only for split_type = 'shares'
  percentage             numeric(9, 6),   -- only for split_type = 'percentage'
  unique (expense_id, member_id)
);

create index on expense_splits (member_id);

-- --------------------------------------------------------------- settlements

create table settlements (
  id                     uuid primary key default gen_random_uuid(),
  group_id               uuid not null references groups(id) on delete cascade,
  from_member            uuid not null references members(id) on delete restrict,
  to_member              uuid not null references members(id) on delete restrict,
  amount_minor           bigint not null check (amount_minor > 0),
  -- A settlement may be paid in a currency the group does not use
  -- (the fixture has a JPY settlement inside a USD group).
  currency               char(3) not null,
  exchange_rate          numeric(20, 10) not null check (exchange_rate > 0),
  converted_amount_minor bigint not null check (converted_amount_minor > 0),
  date                   date not null,
  created_at             timestamptz not null default now(),
  constraint no_self_settlement check (from_member <> to_member)
);

create index on settlements (group_id, date desc);

-- ------------------------------------------------------------ access helpers
-- SECURITY DEFINER so the policies below don't re-trigger RLS on `groups`
-- for every child-table row check.

create or replace function can_read_group(gid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from groups g
    where g.id = gid and (g.is_demo or g.owner_id = auth.uid())
  );
$$;

create or replace function can_write_group(gid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from groups g
    where g.id = gid and g.owner_id = auth.uid() and not g.is_demo
  );
$$;

-- ------------------------------------------------------------------ balances
--
-- Views, not maintained columns: editing or deleting an expense needs no
-- recalculation cascade, and the numbers can never drift from their source.
--
-- security_invoker = on is REQUIRED. Without it a view runs as its owner and
-- silently bypasses every policy below.

create view member_balances with (security_invoker = on) as
  select
    m.group_id,
    m.id as member_id,
    coalesce(paid.total, 0) - coalesce(owed.total, 0)
      + coalesce(sent.total, 0) - coalesce(received.total, 0) as balance_minor
  from members m
  left join lateral (
    select sum(e.converted_amount_minor) as total
    from expenses e where e.paid_by = m.id
  ) paid on true
  left join lateral (
    select sum(s.converted_amount_minor) as total
    from expense_splits s where s.member_id = m.id
  ) owed on true
  left join lateral (
    select sum(st.converted_amount_minor) as total
    from settlements st where st.from_member = m.id
  ) sent on true
  left join lateral (
    select sum(st.converted_amount_minor) as total
    from settlements st where st.to_member = m.id
  ) received on true;

create view group_totals with (security_invoker = on) as
  select group_id,
         count(*)                    as expense_count,
         sum(converted_amount_minor) as total_minor
  from expenses group by group_id;

-- ----------------------------------------------------------------------- RLS

alter table profiles       enable row level security;
alter table groups         enable row level security;
alter table members        enable row level security;
alter table categories     enable row level security;
alter table expenses       enable row level security;
alter table expense_splits enable row level security;
alter table settlements    enable row level security;

create policy profiles_select on profiles for select using (id = auth.uid());
create policy profiles_update on profiles for update using (id = auth.uid());

-- Demo groups are readable by everyone (including the anon role, which is what
-- makes guest mode work) and writable by nobody — so seeding needs the secret key.
create policy groups_select on groups for select
  using (is_demo or owner_id = auth.uid());
create policy groups_insert on groups for insert
  with check (owner_id = auth.uid() and not is_demo);
create policy groups_update on groups for update
  using (owner_id = auth.uid() and not is_demo);
create policy groups_delete on groups for delete
  using (owner_id = auth.uid() and not is_demo);

create policy members_select on members for select using (can_read_group(group_id));
create policy members_write  on members for insert with check (can_write_group(group_id));
create policy members_update on members for update using (can_write_group(group_id));
create policy members_delete on members for delete using (can_write_group(group_id));

create policy categories_select on categories for select
  using (group_id is null or can_read_group(group_id));
create policy categories_write on categories for insert
  with check (group_id is not null and can_write_group(group_id));
create policy categories_delete on categories for delete
  using (group_id is not null and can_write_group(group_id));

create policy expenses_select on expenses for select using (can_read_group(group_id));
create policy expenses_write  on expenses for insert with check (can_write_group(group_id));
create policy expenses_update on expenses for update using (can_write_group(group_id));
create policy expenses_delete on expenses for delete using (can_write_group(group_id));

create policy splits_select on expense_splits for select
  using (exists (select 1 from expenses e where e.id = expense_id and can_read_group(e.group_id)));
create policy splits_write on expense_splits for insert
  with check (exists (select 1 from expenses e where e.id = expense_id and can_write_group(e.group_id)));
create policy splits_update on expense_splits for update
  using (exists (select 1 from expenses e where e.id = expense_id and can_write_group(e.group_id)));
create policy splits_delete on expense_splits for delete
  using (exists (select 1 from expenses e where e.id = expense_id and can_write_group(e.group_id)));

create policy settlements_select on settlements for select using (can_read_group(group_id));
create policy settlements_write  on settlements for insert with check (can_write_group(group_id));
create policy settlements_update on settlements for update using (can_write_group(group_id));
create policy settlements_delete on settlements for delete using (can_write_group(group_id));
