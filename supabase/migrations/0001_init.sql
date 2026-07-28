create extension if not exists pgcrypto;

-- Room categories the guest browses (Deluxe, Standard, Suite...)
create table room_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  price_per_night numeric not null check (price_per_night > 0),
  max_guests int not null check (max_guests > 0),
  images text[] not null default '{}',
  view_variant text not null check (view_variant in ('river', 'mountain', 'valley')),
  created_at timestamptz not null default now()
);

-- Physical rooms behind each type -- e.g. Deluxe-1, Deluxe-2, Deluxe-3
create table rooms (
  id uuid primary key default gen_random_uuid(),
  room_type_id uuid not null references room_types(id) on delete cascade,
  room_label text not null,
  created_at timestamptz not null default now()
);

-- Guest bookings, tied to one physical room
create table bookings (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete restrict,
  guest_name text not null,
  guest_email text not null,
  check_in date not null,
  check_out date not null check (check_out > check_in),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  total_price numeric not null check (total_price >= 0),
  payment_id text,
  created_at timestamptz not null default now()
);

-- Owner-side manual date blocks (maintenance, personal use, etc.)
create table blocked_dates (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  start_date date not null,
  end_date date not null check (end_date > start_date),
  reason text,
  created_at timestamptz not null default now()
);

-- Property owner accounts, tied 1:1 to Supabase Auth users
create table owners (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null
);

-- Public-safe view: exposes only what's needed to compute availability.
-- Never exposes guest_name / guest_email / payment_id.
create view room_availability as
  select room_id, check_in, check_out, status
  from bookings
  where status != 'cancelled';

-- Row Level Security
alter table room_types enable row level security;
alter table rooms enable row level security;
alter table bookings enable row level security;
alter table blocked_dates enable row level security;
alter table owners enable row level security;

-- Anyone can browse room types and physical rooms
create policy "room_types are publicly readable"
  on room_types for select
  using (true);

create policy "rooms are publicly readable"
  on rooms for select
  using (true);

-- blocked_dates carries no guest PII, safe to expose publicly
create policy "blocked_dates are publicly readable"
  on blocked_dates for select
  using (true);

-- bookings itself stays locked down (default deny -- no select policy here).
-- room_availability is the public-facing read path instead, so guest
-- name/email/payment_id never leave the database via the anon key.
-- Booking creation (Phase 6) goes through a database function, not a
-- direct insert from the browser, so the conflict-prevention logic can
-- be enforced atomically at that layer.

-- Owners can only see their own row
create policy "owners can read their own row"
  on owners for select
  using (auth.uid() = id);

-- Owner write access, exercised starting Phase 8
create policy "owners can manage room_types"
  on room_types for all
  using (exists (select 1 from owners where owners.id = auth.uid()))
  with check (exists (select 1 from owners where owners.id = auth.uid()));

create policy "owners can manage rooms"
  on rooms for all
  using (exists (select 1 from owners where owners.id = auth.uid()))
  with check (exists (select 1 from owners where owners.id = auth.uid()));

create policy "owners can manage blocked_dates"
  on blocked_dates for all
  using (exists (select 1 from owners where owners.id = auth.uid()))
  with check (exists (select 1 from owners where owners.id = auth.uid()));
