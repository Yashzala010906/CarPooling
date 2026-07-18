import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import type {
  BookingRow,
  PaymentRow,
  ProfileRow,
  RideRow,
  TransactionRow,
  TripLocationRow,
  TripRow,
  WalletRow,
} from '@/lib/supabase/database.types';
import { tripCategory } from './lifecycle';
import type {
  AnalyticsSummary,
  MessageWithSender,
  MonthlyPoint,
  TripDetail,
  TripListItem,
  TripPassenger,
  WalletSummary,
} from './types';

/**
 * All Member 3 reads live here. Every query runs under the caller's Supabase
 * session, so RLS — not app code — is the authorization boundary. Functions
 * degrade gracefully (empty results) when Supabase is not yet configured or the
 * request is unauthenticated, so pages render their empty states instead of
 * throwing during SSR.
 */

type Ctx = { supabase: Awaited<ReturnType<typeof createClient>>; userId: string };

async function getContext(): Promise<Ctx | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { supabase, userId: user.id };
}

export async function getCurrentProfile(): Promise<ProfileRow | null> {
  const ctx = await getContext();
  if (!ctx) return null;
  const { data } = await ctx.supabase
    .from('profiles')
    .select('*')
    .eq('id', ctx.userId)
    .maybeSingle();
  return data ?? null;
}

// ─────────────────────────────── Trips ───────────────────────────────

type TripJoin = TripRow & { ride: RideRow | null; driver: ProfileRow | null };

const TRIP_SELECT = '*, ride:rides(*), driver:profiles(*)';

function toListItem(row: TripJoin, userId: string): TripListItem {
  return {
    trip: row,
    ride: row.ride,
    driver: row.driver,
    viewerRole: row.driver_id === userId ? 'DRIVER' : 'PASSENGER',
  };
}

export async function getMyTrips(): Promise<TripListItem[]> {
  const ctx = await getContext();
  if (!ctx) return [];
  const { data, error } = await ctx.supabase
    .from('trips')
    .select(TRIP_SELECT)
    .order('scheduled_start_time', { ascending: false, nullsFirst: false });
  if (error || !data) return [];
  return (data as unknown as TripJoin[]).map((row) => toListItem(row, ctx.userId));
}

export async function getRideHistory(): Promise<TripListItem[]> {
  const ctx = await getContext();
  if (!ctx) return [];
  const { data, error } = await ctx.supabase
    .from('trips')
    .select(TRIP_SELECT)
    .in('status', ['COMPLETED', 'PAYMENT_PENDING', 'PAYMENT_COMPLETED', 'CANCELLED'])
    .order('actual_end_time', { ascending: false, nullsFirst: false });
  if (error || !data) return [];
  return (data as unknown as TripJoin[]).map((row) => toListItem(row, ctx.userId));
}

export async function getTripDetail(tripId: string): Promise<TripDetail | null> {
  const ctx = await getContext();
  if (!ctx) return null;

  const { data: tripData, error } = await ctx.supabase
    .from('trips')
    .select(TRIP_SELECT)
    .eq('id', tripId)
    .maybeSingle();
  if (error || !tripData) return null;
  const trip = tripData as unknown as TripJoin;

  const [{ data: bookingRows }, { data: paymentRow }, { data: locationRow }] = await Promise.all([
    ctx.supabase.from('bookings').select('*, passenger:profiles(*)').eq('ride_id', trip.ride_id),
    ctx.supabase
      .from('payments')
      .select('*')
      .eq('trip_id', tripId)
      .eq('user_id', ctx.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    ctx.supabase
      .from('trip_locations')
      .select('*')
      .eq('trip_id', tripId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const passengers: TripPassenger[] = (
    (bookingRows as unknown as (BookingRow & { passenger: ProfileRow | null })[]) ?? []
  ).map((b) => ({ booking: b, profile: b.passenger }));

  const myBooking = passengers.find((p) => p.booking.passenger_id === ctx.userId)?.booking ?? null;

  return {
    trip,
    ride: trip.ride,
    driver: trip.driver,
    passengers,
    viewerRole: trip.driver_id === ctx.userId ? 'DRIVER' : 'PASSENGER',
    myBooking,
    myPayment: (paymentRow as PaymentRow | null) ?? null,
    lastLocation: (locationRow as TripLocationRow | null) ?? null,
  };
}

// ─────────────────────────────── Chat ────────────────────────────────

export async function getTripMessages(tripId: string): Promise<MessageWithSender[]> {
  const ctx = await getContext();
  if (!ctx) return [];
  const { data, error } = await ctx.supabase
    .from('messages')
    .select('*, sender:profiles(id, first_name, last_name, avatar_url)')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data as unknown as MessageWithSender[];
}

// ─────────────────────────────── Wallet ──────────────────────────────

export async function getWalletSummary(): Promise<WalletSummary> {
  const empty: WalletSummary = { wallet: null, totalCredits: 0, totalDebits: 0, recent: [] };
  const ctx = await getContext();
  if (!ctx) return empty;

  const [{ data: wallet }, { data: txns }] = await Promise.all([
    ctx.supabase.from('wallets').select('*').eq('user_id', ctx.userId).maybeSingle(),
    ctx.supabase
      .from('transactions')
      .select('*')
      .eq('user_id', ctx.userId)
      .order('created_at', { ascending: false }),
  ]);

  const all = (txns as TransactionRow[] | null) ?? [];
  let totalCredits = 0;
  let totalDebits = 0;
  for (const t of all) {
    if (t.status !== 'SUCCESS') continue;
    if (t.type === 'CREDIT' || t.type === 'REFUND') totalCredits += Number(t.amount);
    else totalDebits += Number(t.amount);
  }

  return {
    wallet: (wallet as WalletRow | null) ?? null,
    totalCredits,
    totalDebits,
    recent: all.slice(0, 6),
  };
}

export async function getTransactions(
  limit = 20,
  offset = 0,
): Promise<{ items: TransactionRow[]; total: number }> {
  const ctx = await getContext();
  if (!ctx) return { items: [], total: 0 };
  const { data, count } = await ctx.supabase
    .from('transactions')
    .select('*', { count: 'exact' })
    .eq('user_id', ctx.userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  return { items: (data as TransactionRow[] | null) ?? [], total: count ?? 0 };
}

// ────────────────────────────── Payments ─────────────────────────────

export async function getPaymentById(paymentId: string): Promise<PaymentRow | null> {
  const ctx = await getContext();
  if (!ctx) return null;
  const { data } = await ctx.supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .maybeSingle();
  return (data as PaymentRow | null) ?? null;
}

// ───────────────────────────── Analytics ─────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function lastSixMonths(): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTHS[d.getMonth()] ?? '' });
  }
  return out;
}

function bucketByMonth(items: { at: string | null; value: number }[]): MonthlyPoint[] {
  const buckets = lastSixMonths();
  const totals = new Map<string, number>(buckets.map((b) => [b.key, 0]));
  for (const it of items) {
    if (!it.at) continue;
    const d = new Date(it.at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (totals.has(key)) totals.set(key, (totals.get(key) ?? 0) + it.value);
  }
  return buckets.map((b) => ({
    label: b.label,
    value: Number((totals.get(b.key) ?? 0).toFixed(2)),
  }));
}

export async function getAnalytics(): Promise<AnalyticsSummary> {
  const ctx = await getContext();
  const base: AnalyticsSummary = {
    totalTrips: 0,
    completedTrips: 0,
    activeTrips: 0,
    upcomingTrips: 0,
    cancelledTrips: 0,
    totalPaid: 0,
    walletBalance: 0,
    totalCredits: 0,
    totalDebits: 0,
    spendByMonth: bucketByMonth([]),
    tripsByMonth: bucketByMonth([]),
    paymentStatusBreakdown: [],
  };
  if (!ctx) return base;

  const [{ data: trips }, { data: payments }, wallet] = await Promise.all([
    ctx.supabase.from('trips').select('id, status, scheduled_start_time, created_at'),
    ctx.supabase.from('payments').select('amount, status, created_at').eq('user_id', ctx.userId),
    getWalletSummary(),
  ]);

  const tripRows =
    (trips as Pick<TripRow, 'status' | 'scheduled_start_time' | 'created_at'>[] | null) ?? [];
  base.totalTrips = tripRows.length;
  for (const t of tripRows) {
    const cat = tripCategory(t.status);
    if (cat === 'completed') base.completedTrips += 1;
    else if (cat === 'active') base.activeTrips += 1;
    else if (cat === 'upcoming') base.upcomingTrips += 1;
    else if (cat === 'cancelled') base.cancelledTrips += 1;
  }
  base.tripsByMonth = bucketByMonth(
    tripRows.map((t) => ({ at: t.scheduled_start_time ?? t.created_at, value: 1 })),
  );

  const payRows = (payments as Pick<PaymentRow, 'amount' | 'status' | 'created_at'>[] | null) ?? [];
  const statusCounts = new Map<string, number>();
  for (const p of payRows) {
    statusCounts.set(p.status, (statusCounts.get(p.status) ?? 0) + 1);
    if (p.status === 'PAID') base.totalPaid += Number(p.amount);
  }
  base.paymentStatusBreakdown = Array.from(statusCounts, ([label, count]) => ({ label, count }));
  base.spendByMonth = bucketByMonth(
    payRows
      .filter((p) => p.status === 'PAID')
      .map((p) => ({ at: p.created_at, value: Number(p.amount) })),
  );

  base.walletBalance = Number(wallet.wallet?.balance ?? 0);
  base.totalCredits = wallet.totalCredits;
  base.totalDebits = wallet.totalDebits;
  return base;
}
