# Member 3 — Trip Execution & Financial System

Implementation report for the Member 3 vertical slice: trip lifecycle, live tracking,
trip chat, payments, wallet, transactions, ride history, and reports — built on
**Supabase** (Postgres + Auth + RLS + Realtime) inside the existing Next.js app
(`apps/web`), per the Member 3 master prompt.

> **Architecture note.** The repo scaffold ships a NestJS API (`apps/api`) + Prisma.
> Per the chosen direction, Member 3 talks to **Supabase directly** from `apps/web`
> using Route Handlers / Server Actions. The NestJS stubs and other members' code are
> left untouched. Other modules can migrate to Supabase later or keep using the API.

---

## How to run

```bash
# 1. Install (adds @supabase/ssr, @supabase/supabase-js, zod)
npm install

# 2. Configure env — copy and fill in from the Supabase dashboard (Settings ▸ API)
cp apps/web/.env.example apps/web/.env
#   NEXT_PUBLIC_SUPABASE_URL=https://fyktryxrfemcvcgepnqp.supabase.co
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
#   SUPABASE_SERVICE_ROLE_KEY=<service role key>   # server-only, never NEXT_PUBLIC

# 3. Apply the database schema (see "Database setup" below)

# 4. Run the web app
npm run dev -w @carpool/web        # http://localhost:3000
```

Verified locally: `tsc --noEmit` ✓, `next build` ✓, `next lint` ✓, and every route
returns 200/handled status when Supabase is unconfigured (graceful notices, no crashes).

---

## Database setup (manual — Supabase MCP was not authorized in this session)

Apply the migrations in order via the **Supabase SQL Editor** (or `supabase db push`):

1. `supabase/migrations/0001_member3_schema.sql` — enums, tables, indexes, timestamp
   triggers, `handle_new_user` (auto-creates a `profiles` + `wallets` row per signup),
   and the Realtime publication.
2. `supabase/migrations/0002_member3_rls.sql` — Row Level Security policies.
3. `supabase/migrations/0003_member3_functions.sql` — SECURITY DEFINER RPCs.
4. _(optional)_ `supabase/seed.sql` — demo trips (run after ≥1 user has signed up).

> Identity: the schema assumes **Supabase Auth** (`auth.users`) as the identity source,
> with a `public.profiles` row per user. If Member 1 builds a different auth, point
> `driver_id` / `passenger_id` / `user_id` at whatever `profiles` table exists.

---

## What was built

### Database (`supabase/migrations/`)

Tables: `profiles`, `rides`, `bookings` (minimal, `if not exists` — owned by Members 1/2),
`trips`, `trip_locations`, `messages`, `payments`, `wallets`, `transactions`.
Enums: `trip_status`, `payment_status`, `payment_method`, `transaction_type`,
`transaction_status`. Financial columns use `numeric`, not float. Idempotency enforced
with partial unique indexes (one `PAID` payment per trip; unique `provider_payment_id`).

### RLS

Reads are scoped to trip participants (`is_trip_participant`, SECURITY DEFINER to avoid
recursion) or the owning user. **All** writes to `payments` / `wallets` / `transactions`
are denied to clients — they happen only through the RPCs below. Location inserts are
allowed only for the authorized driver of a `STARTED`/`IN_PROGRESS` trip.

### Secure RPCs (SECURITY DEFINER, atomic)

`start_trip`, `end_trip`, `cancel_trip` (validated lifecycle transitions),
`pay_trip_from_wallet` (atomic debit payer / credit driver / write payment + ledger,
idempotent), `create_trip_payment` (provider PENDING payment, server-computed amount),
`recharge_wallet`, `settle_payment` / `fail_payment` (provider verification, idempotent).

### Supabase clients (`apps/web/src/lib/supabase/`)

`client.ts` (browser), `server.ts` (SSR, cookie-bound), `admin.ts` (service-role,
`server-only`), `middleware.ts` (session refresh), `config.ts`, `database.types.ts`
(hand-written typed schema), `db.ts` (typed `callRpc`/`insertRow` write helpers).

### API routes (`apps/web/src/app/api/`)

`POST /api/trips/[tripId]/location` — driver location ingestion (Zod-validated, RLS-guarded).
`POST /api/payments/verify` — Razorpay HMAC-SHA256 signature verification → idempotent
`settle_payment`. Returns 501 until `RAZORPAY_KEY_SECRET` is set (never trusts the client).

### Server Actions (`apps/web/src/lib/member3/actions.ts`)

`startTripAction`, `endTripAction`, `cancelTripAction`, `sendMessageAction`,
`payTripFromWalletAction`, `createTripPaymentAction`, `rechargeWalletAction` — each
authenticates, validates with Zod, delegates to an RPC/RLS-guarded insert, and revalidates.

### Data layer (`apps/web/src/lib/member3/queries.ts`)

Server-only, RLS-scoped reads: `getMyTrips`, `getRideHistory`, `getTripDetail`,
`getTripMessages`, `getWalletSummary`, `getTransactions`, `getPaymentById`, `getAnalytics`.
Plus `lifecycle.ts` (transition rules + status/tone maps + error mapping), `format.ts`,
`types.ts`, `session.ts`.

### Components (`apps/web/src/components/member3/`)

`TripCard`, `TripsBoard` (tabs), `TripStatusBadge`/`PaymentStatusBadge`, `TripTimeline`,
`TripLifecycleControls` (confirm dialogs), `LiveTrackingMap` (Realtime), `DriverLocationBroadcaster`
(throttled `watchPosition`, cleans up), `ChatWindow`/message bubbles (Realtime),
`PaymentMethodSelector`, `WalletBalanceCard`, `RechargeForm`, `TransactionList`,
`RideHistoryTable`, `MiniBarChart`/`Breakdown`, `StatTile`, `Avatar`, loading/empty/error/
sign-in states. Styled to the Stitch "Arboreal Enterprise" system using the repo's Tailwind + lucide.

### Pages (`apps/web/src/app/(main)/`)

`/trips`, `/trips/[tripId]`, `/trips/[tripId]/tracking`, `/trips/[tripId]/chat`, `/payments`,
`/payments/success`, `/payments/failed`, `/wallet`, `/transactions`, `/history`, `/reports`,
`/chat` (hub). Added a **Transactions** nav item to the sidebar.

### Realtime

Live tracking (`trip_locations`) and chat (`messages`) subscribe via Supabase Realtime;
channels are removed on unmount.

---

## Environment variables

| Variable                        | Where        | Notes                                            |
| ------------------------------- | ------------ | ------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | web          | Public                                           |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | web          | Public                                           |
| `SUPABASE_SERVICE_ROLE_KEY`     | web (server) | **Secret** — bypasses RLS                        |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID`   | web          | Public key id                                    |
| `RAZORPAY_KEY_SECRET`           | web (server) | **Secret** — required for `/api/payments/verify` |

---

## Manual steps you must perform

1. **Re-authorize Supabase** (the MCP/connector session was invalidated), then apply the
   four SQL files in `supabase/`.
2. **Fill `apps/web/.env`** with the Supabase URL + keys.
3. **Create at least one Supabase Auth user** (Dashboard ▸ Authentication) so `profiles`
   and `wallets` are auto-provisioned; then optionally run `supabase/seed.sql`.
4. _(optional)_ Add `RAZORPAY_KEY_SECRET` to enable card/UPI verification, and a Maps API
   key to replace the `MapContainer` placeholder.

## Known gaps / follow-ups

- **Wallet & Cash payments are fully functional**; card/UPI create a PENDING payment and
  route through the verify flow — completing them needs Razorpay order creation + `RAZORPAY_KEY_SECRET`.
- `database.types.ts` is hand-written; regenerate with `supabase gen types typescript` once
  the DB is live, then the `db.ts` cast helpers can be removed.
- The `MapContainer` is the repo's placeholder — swap for a real provider without changing props.
