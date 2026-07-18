-- ============================================================================
-- Member 3 — optional demo seed.
-- Run AFTER at least one user has signed up (so public.profiles has rows).
-- Picks the first profile as driver and the second as passenger, then creates
-- three trips (upcoming / active / completed) so the UI is populated.
-- Safe to run multiple times: it clears its own demo rows first.
-- ============================================================================
do $$
declare
  v_driver    uuid;
  v_passenger uuid;
  v_ride      uuid;
  v_trip      uuid;
begin
  select id into v_driver    from public.profiles order by created_at asc limit 1;
  select id into v_passenger from public.profiles order by created_at asc offset 1 limit 1;

  if v_driver is null then
    raise notice 'No profiles found — sign up at least one user, then re-run this seed.';
    return;
  end if;
  if v_passenger is null then v_passenger := v_driver; end if;

  -- Reset previous demo data (identified by the demo route address).
  delete from public.trips  t using public.rides r
    where t.ride_id = r.id and r.origin_address like 'ISKCON%';
  delete from public.rides where origin_address like 'ISKCON%';

  -- ── Upcoming trip ──────────────────────────────────────────────────
  insert into public.rides (driver_id, origin_address, destination_address, departure_at,
                            seats_total, seats_available, fare_per_seat, vehicle_model, vehicle_registration)
  values (v_driver, 'ISKCON, Ahmedabad', 'Infocity, Gandhinagar', now() + interval '2 hours',
          3, 2, 120, 'Swift Dzire', 'GJ01AB1234')
  returning id into v_ride;
  insert into public.bookings (ride_id, passenger_id, seats, fare_total, status)
  values (v_ride, v_passenger, 1, 120, 'CONFIRMED');
  insert into public.trips (ride_id, driver_id, status, scheduled_start_time)
  values (v_ride, v_driver, 'BOOKED', now() + interval '2 hours');

  -- ── Active trip ────────────────────────────────────────────────────
  insert into public.rides (driver_id, origin_address, destination_address, departure_at,
                            seats_total, seats_available, fare_per_seat, vehicle_model, vehicle_registration)
  values (v_driver, 'ISKCON, Ahmedabad', 'GIFT City, Gandhinagar', now() - interval '20 minutes',
          3, 2, 150, 'Alto 800', 'GJ01AB5034')
  returning id into v_ride;
  insert into public.bookings (ride_id, passenger_id, seats, fare_total, status)
  values (v_ride, v_passenger, 1, 150, 'CONFIRMED');
  insert into public.trips (ride_id, driver_id, status, scheduled_start_time, actual_start_time)
  values (v_ride, v_driver, 'IN_PROGRESS', now() - interval '20 minutes', now() - interval '18 minutes')
  returning id into v_trip;
  insert into public.trip_locations (trip_id, driver_id, latitude, longitude, accuracy, speed)
  values (v_trip, v_driver, 23.0225, 72.5714, 12, 34);

  -- ── Completed trip (paid) ─────────────────────────────────────────
  insert into public.rides (driver_id, origin_address, destination_address, departure_at,
                            seats_total, seats_available, fare_per_seat, vehicle_model, vehicle_registration)
  values (v_driver, 'ISKCON, Ahmedabad', 'Science City, Ahmedabad', now() - interval '1 day',
          3, 2, 90, 'Swift Dzire', 'GJ01AB1234')
  returning id into v_ride;
  insert into public.bookings (ride_id, passenger_id, seats, fare_total, status)
  values (v_ride, v_passenger, 1, 90, 'COMPLETED');
  insert into public.trips (ride_id, driver_id, status, scheduled_start_time, actual_start_time, actual_end_time, final_fare, distance_km)
  values (v_ride, v_driver, 'COMPLETED', now() - interval '1 day', now() - interval '1 day',
          now() - interval '23 hours', 90, 18.4);

  -- Give the passenger some spending money.
  update public.wallets set balance = 2000 where user_id = v_passenger;

  raise notice 'Seeded demo trips for driver=% passenger=%', v_driver, v_passenger;
end $$;
