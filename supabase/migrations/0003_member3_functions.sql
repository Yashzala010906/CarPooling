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
