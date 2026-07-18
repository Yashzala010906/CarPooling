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
