-- ============================================================================
-- Member 3 — Trip Execution & Financial System
-- 0001: schema (enums, tables, indexes, timestamp triggers, realtime)
--
-- Idempotent: safe to re-run. `profiles`, `rides`, `bookings` are created only
-- if they don't already exist so other members' identity/ride work is never
-- clobbered — Member 3's tables reference them.
-- ============================================================================

create extension if not exists pgcrypto;

-- ─────────────────────────────── Enums ────────────────────────────────
do $$ begin
  create type public.trip_status as enum
    ('BOOKED','STARTED','IN_PROGRESS','COMPLETED','PAYMENT_PENDING','PAYMENT_COMPLETED','CANCELLED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum
    ('PENDING','PROCESSING','PAID','FAILED','REFUNDED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_method as enum ('CASH','CARD','UPI','WALLET');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.transaction_type as enum ('PAYMENT','CREDIT','DEBIT','REFUND');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.transaction_status as enum ('PENDING','SUCCESS','FAILED');
exception when duplicate_object then null; end $$;

-- ─────────────────────── Shared updated_at trigger ────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ───────────────── Identity (owned by Member 1 — minimal) ─────────────
-- Profile row per auth user. Member 1 may extend this table.
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  company_id   uuid,
  role         text not null default 'EMPLOYEE',
  email        text,
  first_name   text,
  last_name    text,
  phone        text,
  avatar_url   text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ─────────────── Ride & booking (owned by Member 2 — minimal) ─────────
create table if not exists public.rides (
  id                   uuid primary key default gen_random_uuid(),
  driver_id            uuid not null references public.profiles(id),
  vehicle_id           uuid,
  origin_address       text not null,
  origin_lat           double precision,
  origin_lng           double precision,
  destination_address  text not null,
  destination_lat      double precision,
  destination_lng      double precision,
  departure_at         timestamptz not null,
  seats_total          integer not null default 1,
  seats_available      integer not null default 1,
  fare_per_seat        numeric(10,2) not null default 0,
  vehicle_model        text,
  vehicle_registration text,
  route_polyline       text,
  status               text not null default 'PUBLISHED',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table if not exists public.bookings (
  id           uuid primary key default gen_random_uuid(),
  ride_id      uuid not null references public.rides(id) on delete cascade,
  passenger_id uuid not null references public.profiles(id),
  seats        integer not null default 1,
  fare_total   numeric(10,2) not null default 0,
  status       text not null default 'CONFIRMED',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ───────────────────────── Trips (Member 3) ──────────────────────────
create table if not exists public.trips (
  id                   uuid primary key default gen_random_uuid(),
  ride_id              uuid not null unique references public.rides(id) on delete cascade,
  driver_id            uuid not null references public.profiles(id),
  status               public.trip_status not null default 'BOOKED',
  scheduled_start_time timestamptz,
  actual_start_time    timestamptz,
  actual_end_time      timestamptz,
  final_fare           numeric(10,2),
  distance_km          double precision,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table if not exists public.trip_locations (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references public.trips(id) on delete cascade,
  driver_id   uuid not null references public.profiles(id),
  latitude    double precision not null,
  longitude   double precision not null,
  accuracy    double precision,
  heading     double precision,
  speed       double precision,
  recorded_at timestamptz not null default now()
);

create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references public.trips(id) on delete cascade,
  sender_id  uuid not null references public.profiles(id),
  content    text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

-- ─────────────────── Payments / Wallet / Ledger ──────────────────────
create table if not exists public.payments (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id),
  trip_id             uuid references public.trips(id) on delete set null,
  booking_id          uuid references public.bookings(id) on delete set null,
  amount              numeric(10,2) not null check (amount >= 0),
  currency            text not null default 'INR',
  method              public.payment_method not null default 'WALLET',
  provider            text,
  provider_order_id   text,
  provider_payment_id text,
  status              public.payment_status not null default 'PENDING',
  failure_reason      text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists public.wallets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references public.profiles(id) on delete cascade,
  balance    numeric(12,2) not null default 0 check (balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  wallet_id   uuid references public.wallets(id) on delete set null,
  user_id     uuid not null references public.profiles(id),
  trip_id     uuid references public.trips(id) on delete set null,
  payment_id  uuid references public.payments(id) on delete set null,
  type        public.transaction_type not null,
  amount      numeric(12,2) not null,
  status      public.transaction_status not null default 'SUCCESS',
  method      public.payment_method,
  description text,
  created_at  timestamptz not null default now()
);

-- ───────────────────────────── Indexes ───────────────────────────────
create index if not exists idx_rides_driver           on public.rides(driver_id);
create index if not exists idx_bookings_ride           on public.bookings(ride_id);
create index if not exists idx_bookings_passenger      on public.bookings(passenger_id);
create index if not exists idx_trips_driver            on public.trips(driver_id);
create index if not exists idx_trips_status            on public.trips(status);
create index if not exists idx_trip_locations_trip     on public.trip_locations(trip_id, recorded_at desc);
create index if not exists idx_messages_trip           on public.messages(trip_id, created_at);
create index if not exists idx_payments_user           on public.payments(user_id);
create index if not exists idx_payments_trip           on public.payments(trip_id);
create index if not exists idx_transactions_user       on public.transactions(user_id, created_at desc);
create index if not exists idx_transactions_wallet     on public.transactions(wallet_id);

-- Idempotency: at most one settled payment per trip, and provider ids unique.
create unique index if not exists uniq_paid_payment_per_trip
  on public.payments(trip_id) where status = 'PAID' and trip_id is not null;
create unique index if not exists uniq_provider_payment_id
  on public.payments(provider_payment_id) where provider_payment_id is not null;

-- ─────────────────────── updated_at triggers ─────────────────────────
do $$
declare t text;
begin
  foreach t in array array['profiles','rides','bookings','trips','payments','wallets'] loop
    execute format('drop trigger if exists set_updated_at on public.%I;', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
       for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- ───────── Auto-provision profile + wallet on new auth user ───────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, first_name, last_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.wallets (user_id, balance)
  values (new.id, 0)
  on conflict (user_id) do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────── Realtime publication ──────────────────────
-- Live tracking + chat + trip status changes stream over Supabase Realtime.
do $$
declare t text;
begin
  foreach t in array array['trips','trip_locations','messages'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I;', t);
    exception when duplicate_object then null;
    when others then null;
    end;
  end loop;
end $$;
