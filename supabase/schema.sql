-- ============================================================================
-- Riverside Community Hub — Database Schema
-- Postgres / Supabase
-- Run this in the Supabase SQL editor (or via `supabase db push`) on a fresh
-- project. Safe to re-run: guarded with IF NOT EXISTS / OR REPLACE where sane.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('member', 'staff', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type membership_tier as enum ('free', 'standard', 'family');
exception when duplicate_object then null; end $$;

do $$ begin
  create type resource_type as enum ('room', 'equipment');
exception when duplicate_object then null; end $$;

do $$ begin
  create type booking_status as enum ('pending', 'approved', 'rejected', 'cancelled');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- profiles — one row per auth.users row, created by trigger on signup
-- ----------------------------------------------------------------------------
create table if not exists profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text not null,
  phone           text,
  role            user_role not null default 'member',
  membership_tier membership_tier not null default 'free',
  joined_at       timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, membership_tier)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'member',
    'free'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ----------------------------------------------------------------------------
-- resources — bookable rooms & equipment
-- ----------------------------------------------------------------------------
create table if not exists resources (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  type        resource_type not null,
  capacity    int,
  description text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- bookings — one row per booking request
-- ----------------------------------------------------------------------------
create table if not exists bookings (
  id          uuid primary key default gen_random_uuid(),
  resource_id uuid not null references resources(id) on delete cascade,
  member_id   uuid not null references profiles(id) on delete cascade,
  start_time  timestamptz not null,
  end_time    timestamptz not null,
  status      booking_status not null default 'pending',
  notes       text,
  created_at  timestamptz not null default now(),
  constraint booking_time_valid check (end_time > start_time)
);

-- Prevent double-booking at the DB level: no two approved/pending bookings
-- for the same resource may overlap in time.
create extension if not exists btree_gist;

alter table bookings
  add column if not exists during tstzrange
  generated always as (tstzrange(start_time, end_time, '[)')) stored;

do $$ begin
  alter table bookings
    add constraint no_overlapping_bookings
    exclude using gist (
      resource_id with =,
      during with &&
    ) where (status in ('pending', 'approved'));
exception when duplicate_object then null; end $$;

create index if not exists idx_bookings_member on bookings(member_id);
create index if not exists idx_bookings_resource on bookings(resource_id);
create index if not exists idx_bookings_status on bookings(status);

-- ----------------------------------------------------------------------------
-- campaigns — donation drives (e.g. "R50,000 for winter parcels")
-- ----------------------------------------------------------------------------
create table if not exists campaigns (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  description    text,
  goal_amount    numeric(12,2) not null,
  current_amount numeric(12,2) not null default 0,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- donations — one-off or pledged-recurring gifts
-- ----------------------------------------------------------------------------
create table if not exists donations (
  id           uuid primary key default gen_random_uuid(),
  donor_id     uuid references profiles(id) on delete set null, -- null = anonymous
  campaign_id  uuid references campaigns(id) on delete set null,
  amount       numeric(12,2) not null check (amount > 0),
  is_recurring boolean not null default false,
  donor_name   text,   -- captured for anonymous/non-member donors
  donor_email  text,
  created_at   timestamptz not null default now()
);

create index if not exists idx_donations_campaign on donations(campaign_id);
create index if not exists idx_donations_donor on donations(donor_id);

-- Keep campaigns.current_amount in sync automatically.
create or replace function bump_campaign_total()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.campaign_id is not null then
    update campaigns
      set current_amount = current_amount + new.amount
      where id = new.campaign_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_donation_insert on donations;
create trigger on_donation_insert
  after insert on donations
  for each row execute procedure bump_campaign_total();

-- ----------------------------------------------------------------------------
-- notifications — in-app status-change notices
-- ----------------------------------------------------------------------------
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  message    text not null,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on notifications(user_id);

-- Notify a member automatically when their booking's status changes.
create or replace function notify_booking_status_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    insert into notifications (user_id, message)
    values (
      new.member_id,
      'Your booking request has been ' || new.status || '.'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_booking_status_change on bookings;
create trigger on_booking_status_change
  after update on bookings
  for each row execute procedure notify_booking_status_change();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table profiles      enable row level security;
alter table resources     enable row level security;
alter table bookings      enable row level security;
alter table campaigns     enable row level security;
alter table donations     enable row level security;
alter table notifications enable row level security;

-- Helper: is the current user staff or admin?
create or replace function is_staff_or_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('staff', 'admin')
  );
$$;

create or replace function is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ---- profiles ---------------------------------------------------------
create policy "profiles: self read" on profiles
  for select using (auth.uid() = id);

create policy "profiles: staff read all" on profiles
  for select using (is_staff_or_admin());

create policy "profiles: self update own basic fields" on profiles
  for update using (auth.uid() = id);

create policy "profiles: admin manage all" on profiles
  for all using (is_admin());

-- ---- resources ----------------------------------------------------------
create policy "resources: public read" on resources
  for select using (true);

create policy "resources: staff write" on resources
  for insert with check (is_staff_or_admin());

create policy "resources: staff update" on resources
  for update using (is_staff_or_admin());

create policy "resources: staff delete" on resources
  for delete using (is_staff_or_admin());

-- ---- bookings -----------------------------------------------------------
create policy "bookings: member read own" on bookings
  for select using (auth.uid() = member_id);

create policy "bookings: staff read all" on bookings
  for select using (is_staff_or_admin());

create policy "bookings: member create own" on bookings
  for insert with check (auth.uid() = member_id);

create policy "bookings: member cancel own pending" on bookings
  for update using (auth.uid() = member_id and status = 'pending')
  with check (status = 'cancelled');

create policy "bookings: staff approve/reject" on bookings
  for update using (is_staff_or_admin());

-- ---- campaigns ------------------------------------------------------------
create policy "campaigns: public read" on campaigns
  for select using (true);

create policy "campaigns: staff manage" on campaigns
  for all using (is_staff_or_admin());

-- ---- donations --------------------------------------------------------
create policy "donations: public insert" on donations
  for insert with check (true);

create policy "donations: donor read own" on donations
  for select using (auth.uid() = donor_id);

create policy "donations: staff read all" on donations
  for select using (is_staff_or_admin());

create policy "donations: admin update" on donations
  for update using (is_admin());

-- ---- notifications ------------------------------------------------------
create policy "notifications: self read" on notifications
  for select using (auth.uid() = user_id);

create policy "notifications: self mark read" on notifications
  for update using (auth.uid() = user_id);

-- ============================================================================
-- Seed data
-- ============================================================================
insert into resources (name, type, capacity, description) values
  ('Main Hall',        'room',      80, 'Large multipurpose hall for events and workshops'),
  ('Youth Room',       'room',      25, 'Youth programme classroom with whiteboard'),
  ('Meeting Room A',   'room',       8, 'Small meeting room, ideal for board meetings'),
  ('Projector & Screen','equipment', null, 'Portable projector and pull-down screen'),
  ('Sound System',     'equipment', null, 'PA speakers, mixer, two wireless mics')
on conflict do nothing;

insert into campaigns (title, description, goal_amount, active) values
  ('Winter Food Parcels', 'Help us pack and deliver food parcels for 200 families this winter.', 50000, true)
on conflict do nothing;
