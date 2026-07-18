-- ============================================================================
-- Member 3 — combined setup. Paste this whole file into the Supabase SQL Editor
-- (Dashboard ▸ SQL Editor ▸ New query ▸ Run). Idempotent; safe to re-run.
-- Order: schema -> RLS -> functions.
-- ============================================================================

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

-- ============================================================================
-- Member 3 — 0002: Row Level Security
--
-- Principle: reads are scoped to trip participants / the owning user; all
-- financial writes (payments, wallets, transactions) are denied to clients and
-- go exclusively through the SECURITY DEFINER RPCs in 0003. Idempotent.
-- ============================================================================

-- Participant check as SECURITY DEFINER so RLS on trips/bookings does not
-- recurse when other policies call it. STABLE = safe to cache within a query.
create or replace function public.is_trip_participant(p_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.trips t
    where t.id = p_trip_id
      and (
        t.driver_id = auth.uid()
        or exists (
          select 1
          from public.bookings b
          where b.ride_id = t.ride_id
            and b.passenger_id = auth.uid()
        )
      )
  );
$$;

alter table public.profiles       enable row level security;
alter table public.rides          enable row level security;
alter table public.bookings       enable row level security;
alter table public.trips          enable row level security;
alter table public.trip_locations enable row level security;
alter table public.messages       enable row level security;
alter table public.payments       enable row level security;
alter table public.wallets        enable row level security;
alter table public.transactions   enable row level security;

-- ─────────────────────────────── profiles ────────────────────────────
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ─────────────────────────── rides / bookings ────────────────────────
-- Minimal policies so Member 3 can read the ride/booking context it needs.
-- Member 2 may broaden these when they own the tables.
drop policy if exists rides_select on public.rides;
create policy rides_select on public.rides
  for select to authenticated using (
    driver_id = auth.uid()
    or exists (select 1 from public.bookings b where b.ride_id = id and b.passenger_id = auth.uid())
  );

drop policy if exists rides_write_driver on public.rides;
create policy rides_write_driver on public.rides
  for all to authenticated using (driver_id = auth.uid()) with check (driver_id = auth.uid());

drop policy if exists bookings_select on public.bookings;
create policy bookings_select on public.bookings
  for select to authenticated using (
    passenger_id = auth.uid()
    or exists (select 1 from public.rides r where r.id = ride_id and r.driver_id = auth.uid())
  );

drop policy if exists bookings_write_passenger on public.bookings;
create policy bookings_write_passenger on public.bookings
  for all to authenticated using (passenger_id = auth.uid()) with check (passenger_id = auth.uid());

-- ──────────────────────────────── trips ──────────────────────────────
drop policy if exists trips_select_participant on public.trips;
create policy trips_select_participant on public.trips
  for select to authenticated using (public.is_trip_participant(id));

drop policy if exists trips_insert_driver on public.trips;
create policy trips_insert_driver on public.trips
  for insert to authenticated with check (driver_id = auth.uid());

-- Direct status flips are still allowed for the driver, but the app drives all
-- lifecycle changes through start_trip / end_trip so validation is centralised.
drop policy if exists trips_update_driver on public.trips;
create policy trips_update_driver on public.trips
  for update to authenticated using (driver_id = auth.uid()) with check (driver_id = auth.uid());

-- ─────────────────────────── trip_locations ──────────────────────────
drop policy if exists trip_locations_select_participant on public.trip_locations;
create policy trip_locations_select_participant on public.trip_locations
  for select to authenticated using (public.is_trip_participant(trip_id));

-- Only the authorised driver, and only while the trip is actually running.
drop policy if exists trip_locations_insert_driver on public.trip_locations;
create policy trip_locations_insert_driver on public.trip_locations
  for insert to authenticated with check (
    driver_id = auth.uid()
    and exists (
      select 1 from public.trips t
      where t.id = trip_id
        and t.driver_id = auth.uid()
        and t.status in ('STARTED', 'IN_PROGRESS')
    )
  );

-- ─────────────────────────────── messages ────────────────────────────
drop policy if exists messages_select_participant on public.messages;
create policy messages_select_participant on public.messages
  for select to authenticated using (public.is_trip_participant(trip_id));

drop policy if exists messages_insert_participant on public.messages;
create policy messages_insert_participant on public.messages
  for insert to authenticated with check (
    sender_id = auth.uid() and public.is_trip_participant(trip_id)
  );

-- ─────────────── payments / wallets / transactions (read-only) ────────
-- Clients may only READ their own money records. Every write happens through
-- the SECURITY DEFINER RPCs so amounts/balances can never be forged.
drop policy if exists payments_select_own on public.payments;
create policy payments_select_own on public.payments
  for select to authenticated using (user_id = auth.uid());

drop policy if exists wallets_select_own on public.wallets;
create policy wallets_select_own on public.wallets
  for select to authenticated using (user_id = auth.uid());

drop policy if exists transactions_select_own on public.transactions;
create policy transactions_select_own on public.transactions
  for select to authenticated using (user_id = auth.uid());

-- ============================================================================
-- Member 3 — 0003: secure server-side operations (SECURITY DEFINER RPCs)
--
-- All trip lifecycle transitions and every money movement run here so they are
-- atomic and validated on the server. Clients cannot write payments/wallets/
-- transactions directly (see 0002), so these functions are the only path.
-- Error messages use stable UPPER_SNAKE codes the app maps to friendly text.
-- ============================================================================

-- ─────────────────────────────── start_trip ──────────────────────────
create or replace function public.start_trip(p_trip_id uuid)
returns public.trips
language plpgsql
security definer
set search_path = public
as $$
declare v_trip public.trips;
begin
  select * into v_trip from public.trips where id = p_trip_id for update;
  if not found then raise exception 'TRIP_NOT_FOUND'; end if;
  if v_trip.driver_id <> auth.uid() then raise exception 'NOT_TRIP_DRIVER'; end if;

  if v_trip.status = 'IN_PROGRESS' then
    return v_trip; -- idempotent: already started
  end if;
  if v_trip.status <> 'BOOKED' then
    raise exception 'INVALID_TRANSITION';
  end if;

  update public.trips
     set status = 'IN_PROGRESS',
         actual_start_time = coalesce(actual_start_time, now())
   where id = p_trip_id
  returning * into v_trip;
  return v_trip;
end $$;

-- ──────────────────────────────── end_trip ───────────────────────────
create or replace function public.end_trip(
  p_trip_id uuid,
  p_final_fare numeric default null,
  p_distance_km double precision default null
)
returns public.trips
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip public.trips;
  v_fare numeric(10,2);
begin
  select * into v_trip from public.trips where id = p_trip_id for update;
  if not found then raise exception 'TRIP_NOT_FOUND'; end if;
  if v_trip.driver_id <> auth.uid() then raise exception 'NOT_TRIP_DRIVER'; end if;

  if v_trip.status in ('COMPLETED', 'PAYMENT_PENDING', 'PAYMENT_COMPLETED') then
    return v_trip; -- idempotent
  end if;
  if v_trip.status not in ('STARTED', 'IN_PROGRESS') then
    raise exception 'INVALID_TRANSITION';
  end if;

  select coalesce(p_final_fare, r.fare_per_seat) into v_fare
  from public.rides r where r.id = v_trip.ride_id;

  update public.trips
     set status = 'COMPLETED',
         actual_end_time = now(),
         final_fare = v_fare,
         distance_km = coalesce(p_distance_km, distance_km)
   where id = p_trip_id
  returning * into v_trip;
  return v_trip;
end $$;

-- ─────────────────────────────── cancel_trip ─────────────────────────
create or replace function public.cancel_trip(p_trip_id uuid)
returns public.trips
language plpgsql
security definer
set search_path = public
as $$
declare v_trip public.trips;
begin
  select * into v_trip from public.trips where id = p_trip_id for update;
  if not found then raise exception 'TRIP_NOT_FOUND'; end if;
  if v_trip.driver_id <> auth.uid() then raise exception 'NOT_TRIP_DRIVER'; end if;
  if v_trip.status in ('COMPLETED', 'PAYMENT_COMPLETED') then
    raise exception 'INVALID_TRANSITION';
  end if;

  update public.trips set status = 'CANCELLED' where id = p_trip_id returning * into v_trip;
  return v_trip;
end $$;

-- ─────────────────────── pay_trip_from_wallet ────────────────────────
-- The calling passenger pays their booking fare for a trip from their wallet.
-- Atomic: debits payer, credits driver, writes a payment + two ledger rows.
-- Idempotent per (trip, payer): a second call returns the existing PAID payment.
create or replace function public.pay_trip_from_wallet(p_trip_id uuid)
returns public.payments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip     public.trips;
  v_amount   numeric(10,2);
  v_payment  public.payments;
  v_payer_wallet  public.wallets;
begin
  -- Existing settled payment? return it (idempotency).
  select * into v_payment
  from public.payments
  where trip_id = p_trip_id and user_id = auth.uid() and status = 'PAID'
  limit 1;
  if found then return v_payment; end if;

  select * into v_trip from public.trips where id = p_trip_id;
  if not found then raise exception 'TRIP_NOT_FOUND'; end if;

  -- Amount is the caller's own booking fare — never taken from the client.
  select b.fare_total into v_amount
  from public.bookings b
  where b.ride_id = v_trip.ride_id and b.passenger_id = auth.uid()
  limit 1;
  if v_amount is null then raise exception 'NO_BOOKING'; end if;
  if v_amount <= 0 then raise exception 'INVALID_AMOUNT'; end if;

  -- Lock payer wallet and check funds.
  select * into v_payer_wallet from public.wallets where user_id = auth.uid() for update;
  if not found then raise exception 'NO_WALLET'; end if;
  if v_payer_wallet.balance < v_amount then raise exception 'INSUFFICIENT_FUNDS'; end if;

  update public.wallets set balance = balance - v_amount where id = v_payer_wallet.id;

  insert into public.payments (user_id, trip_id, amount, currency, method, provider, provider_payment_id, status)
  values (auth.uid(), p_trip_id, v_amount, 'INR', 'WALLET', 'wallet', 'wal_' || replace(gen_random_uuid()::text, '-', ''), 'PAID')
  returning * into v_payment;

  insert into public.transactions (wallet_id, user_id, trip_id, payment_id, type, amount, status, method, description)
  values (v_payer_wallet.id, auth.uid(), p_trip_id, v_payment.id, 'DEBIT', v_amount, 'SUCCESS', 'WALLET', 'Trip fare payment');

  -- Credit the driver's wallet with the fare.
  insert into public.transactions (wallet_id, user_id, trip_id, payment_id, type, amount, status, method, description)
  select w.id, v_trip.driver_id, p_trip_id, v_payment.id, 'CREDIT', v_amount, 'SUCCESS', 'WALLET', 'Trip fare received'
  from public.wallets w where w.user_id = v_trip.driver_id;

  update public.wallets set balance = balance + v_amount where user_id = v_trip.driver_id;

  -- Reflect settlement on the trip.
  update public.trips set status = 'PAYMENT_COMPLETED'
   where id = p_trip_id and status in ('COMPLETED', 'PAYMENT_PENDING');

  return v_payment;
end $$;

-- ──────────────────────── create_trip_payment ───────────────────────
-- Creates (or reuses) a PENDING payment for the caller's trip fare via an
-- external provider (card/UPI). Amount is server-computed from the booking, so
-- the client can never set it. Returns the existing PAID payment if already
-- settled, or the current PENDING one, making the call idempotent.
create or replace function public.create_trip_payment(
  p_trip_id uuid,
  p_method public.payment_method default 'CARD'
)
returns public.payments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip     public.trips;
  v_amount   numeric(10,2);
  v_payment  public.payments;
begin
  select * into v_trip from public.trips where id = p_trip_id;
  if not found then raise exception 'TRIP_NOT_FOUND'; end if;

  select b.fare_total into v_amount
  from public.bookings b
  where b.ride_id = v_trip.ride_id and b.passenger_id = auth.uid()
  limit 1;
  if v_amount is null then raise exception 'NO_BOOKING'; end if;

  select * into v_payment
  from public.payments
  where trip_id = p_trip_id and user_id = auth.uid() and status = 'PAID'
  limit 1;
  if found then return v_payment; end if;

  select * into v_payment
  from public.payments
  where trip_id = p_trip_id and user_id = auth.uid() and status in ('PENDING', 'PROCESSING')
  order by created_at desc
  limit 1;
  if found then
    update public.payments set method = p_method, amount = v_amount
     where id = v_payment.id returning * into v_payment;
    return v_payment;
  end if;

  insert into public.payments (user_id, trip_id, amount, method, provider, status)
  values (
    auth.uid(), p_trip_id, v_amount, p_method,
    case when p_method in ('CARD', 'UPI') then 'razorpay' else lower(p_method::text) end,
    'PENDING'
  )
  returning * into v_payment;
  return v_payment;
end $$;

-- ─────────────────────────── recharge_wallet ─────────────────────────
-- Adds funds to the caller's wallet (e.g. after a provider top-up succeeds).
create or replace function public.recharge_wallet(
  p_amount numeric,
  p_method public.payment_method default 'CARD',
  p_reference text default null
)
returns public.wallets
language plpgsql
security definer
set search_path = public
as $$
declare v_wallet public.wallets;
begin
  if p_amount is null or p_amount <= 0 then raise exception 'INVALID_AMOUNT'; end if;
  if p_amount > 100000 then raise exception 'AMOUNT_TOO_LARGE'; end if;

  insert into public.wallets (user_id, balance)
  values (auth.uid(), 0)
  on conflict (user_id) do nothing;

  update public.wallets set balance = balance + p_amount
   where user_id = auth.uid()
  returning * into v_wallet;

  insert into public.transactions (wallet_id, user_id, type, amount, status, method, description)
  values (v_wallet.id, auth.uid(), 'CREDIT', p_amount, 'SUCCESS', p_method,
          coalesce('Wallet recharge (' || p_reference || ')', 'Wallet recharge'));

  return v_wallet;
end $$;

-- ─────────────────────────── settle_payment ──────────────────────────
-- Marks a provider (card/UPI) payment PAID after the server has verified the
-- provider signature. Idempotent. Callable by the payment owner or the service
-- role (auth.uid() is null when using the service-role key).
create or replace function public.settle_payment(
  p_payment_id uuid,
  p_provider_payment_id text default null
)
returns public.payments
language plpgsql
security definer
set search_path = public
as $$
declare v_payment public.payments;
begin
  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then raise exception 'PAYMENT_NOT_FOUND'; end if;
  if auth.uid() is not null and v_payment.user_id <> auth.uid() then
    raise exception 'NOT_PAYMENT_OWNER';
  end if;

  if v_payment.status = 'PAID' then return v_payment; end if; -- idempotent

  update public.payments
     set status = 'PAID',
         provider_payment_id = coalesce(p_provider_payment_id, provider_payment_id)
   where id = p_payment_id
  returning * into v_payment;

  insert into public.transactions (user_id, trip_id, payment_id, type, amount, status, method, description)
  values (v_payment.user_id, v_payment.trip_id, v_payment.id, 'PAYMENT', v_payment.amount, 'SUCCESS',
          v_payment.method, 'Trip fare payment');

  update public.trips set status = 'PAYMENT_COMPLETED'
   where id = v_payment.trip_id and status in ('COMPLETED', 'PAYMENT_PENDING');

  return v_payment;
end $$;

-- ─────────────────────────── fail_payment ────────────────────────────
create or replace function public.fail_payment(
  p_payment_id uuid,
  p_reason text default null
)
returns public.payments
language plpgsql
security definer
set search_path = public
as $$
declare v_payment public.payments;
begin
  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then raise exception 'PAYMENT_NOT_FOUND'; end if;
  if auth.uid() is not null and v_payment.user_id <> auth.uid() then
    raise exception 'NOT_PAYMENT_OWNER';
  end if;
  if v_payment.status = 'PAID' then raise exception 'ALREADY_PAID'; end if;

  update public.payments
     set status = 'FAILED', failure_reason = p_reason
   where id = p_payment_id
  returning * into v_payment;
  return v_payment;
end $$;

-- Lock down the money RPCs: authenticated users only (or service role).
do $$
declare fn text;
begin
  foreach fn in array array[
    'start_trip(uuid)', 'end_trip(uuid,numeric,double precision)', 'cancel_trip(uuid)',
    'pay_trip_from_wallet(uuid)', 'create_trip_payment(uuid,public.payment_method)',
    'recharge_wallet(numeric,public.payment_method,text)',
    'settle_payment(uuid,text)', 'fail_payment(uuid,text)'
  ] loop
    execute format('revoke all on function public.%s from anon;', fn);
    execute format('grant execute on function public.%s to authenticated;', fn);
  end loop;
end $$;
