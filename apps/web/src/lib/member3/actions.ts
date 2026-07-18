'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { callRpc, insertRow } from '@/lib/supabase/db';
import type { PaymentMethod, PaymentRow } from '@/lib/supabase/database.types';
import { mapRpcError } from './lifecycle';

/**
 * Server Actions for every Member 3 mutation. Each one authenticates the caller,
 * validates input with Zod, then delegates to a SECURITY DEFINER RPC (or an
 * RLS-guarded insert) so all authorization and money math happen in the
 * database. Never trusts client-provided user ids, amounts, or statuses.
 */

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

const uuid = z.string().uuid('Invalid id.');

async function requireClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase: null, user: null } as const;
  return { supabase, user } as const;
}

// ───────────────────────── Trip lifecycle ────────────────────────────

export async function startTripAction(tripId: string): Promise<ActionResult> {
  const id = uuid.safeParse(tripId);
  if (!id.success) return { ok: false, error: 'Invalid trip.' };

  const { supabase } = await requireClient();
  if (!supabase) return { ok: false, error: 'You must be signed in.' };

  const { error } = await callRpc(supabase, 'start_trip', { p_trip_id: id.data });
  if (error) return { ok: false, error: mapRpcError(error.message) };

  revalidatePath('/trips');
  revalidatePath(`/trips/${id.data}`);
  return { ok: true, data: undefined };
}

const endTripSchema = z.object({
  tripId: uuid,
  distanceKm: z.number().min(0).max(100000).optional(),
});

export async function endTripAction(input: {
  tripId: string;
  distanceKm?: number;
}): Promise<ActionResult> {
  const parsed = endTripSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid input.' };

  const { supabase } = await requireClient();
  if (!supabase) return { ok: false, error: 'You must be signed in.' };

  const { error } = await callRpc(supabase, 'end_trip', {
    p_trip_id: parsed.data.tripId,
    p_final_fare: null,
    p_distance_km: parsed.data.distanceKm ?? null,
  });
  if (error) return { ok: false, error: mapRpcError(error.message) };

  revalidatePath('/trips');
  revalidatePath(`/trips/${parsed.data.tripId}`);
  return { ok: true, data: undefined };
}

export async function cancelTripAction(tripId: string): Promise<ActionResult> {
  const id = uuid.safeParse(tripId);
  if (!id.success) return { ok: false, error: 'Invalid trip.' };

  const { supabase } = await requireClient();
  if (!supabase) return { ok: false, error: 'You must be signed in.' };

  const { error } = await callRpc(supabase, 'cancel_trip', { p_trip_id: id.data });
  if (error) return { ok: false, error: mapRpcError(error.message) };

  revalidatePath('/trips');
  revalidatePath(`/trips/${id.data}`);
  return { ok: true, data: undefined };
}

// ─────────────────────────────── Chat ────────────────────────────────

const messageSchema = z.object({
  tripId: uuid,
  content: z.string().trim().min(1, 'Message is empty.').max(2000, 'Message is too long.'),
});

export async function sendMessageAction(input: {
  tripId: string;
  content: string;
}): Promise<ActionResult> {
  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid message.' };
  }

  const { supabase, user } = await requireClient();
  if (!supabase || !user) return { ok: false, error: 'You must be signed in.' };

  // RLS enforces that the sender is a legitimate trip participant.
  const { error } = await insertRow(supabase, 'messages', {
    trip_id: parsed.data.tripId,
    sender_id: user.id,
    content: parsed.data.content,
  });
  if (error) return { ok: false, error: 'Could not send message.' };

  return { ok: true, data: undefined };
}

// ───────────────────────────── Payments ──────────────────────────────

export async function payTripFromWalletAction(
  tripId: string,
): Promise<ActionResult<{ paymentId: string }>> {
  const id = uuid.safeParse(tripId);
  if (!id.success) return { ok: false, error: 'Invalid trip.' };

  const { supabase } = await requireClient();
  if (!supabase) return { ok: false, error: 'You must be signed in.' };

  const { data, error } = await callRpc(supabase, 'pay_trip_from_wallet', { p_trip_id: id.data });
  if (error || !data) return { ok: false, error: mapRpcError(error?.message) };

  revalidatePath(`/trips/${id.data}`);
  revalidatePath('/wallet');
  revalidatePath('/transactions');
  return { ok: true, data: { paymentId: data.id } };
}

const createPaymentSchema = z.object({
  tripId: uuid,
  method: z.enum(['CASH', 'CARD', 'UPI', 'WALLET']),
});

export async function createTripPaymentAction(input: {
  tripId: string;
  method: PaymentMethod;
}): Promise<ActionResult<{ payment: PaymentRow }>> {
  const parsed = createPaymentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid payment request.' };

  const { supabase } = await requireClient();
  if (!supabase) return { ok: false, error: 'You must be signed in.' };

  const { data, error } = await callRpc(supabase, 'create_trip_payment', {
    p_trip_id: parsed.data.tripId,
    p_method: parsed.data.method,
  });
  if (error || !data) return { ok: false, error: mapRpcError(error?.message) };

  return { ok: true, data: { payment: data } };
}

// ───────────────────────────── Wallet ────────────────────────────────

const rechargeSchema = z.object({
  amount: z.number().positive('Enter a valid amount.').max(100000, 'Amount exceeds the limit.'),
  method: z.enum(['CASH', 'CARD', 'UPI', 'WALLET']).default('CARD'),
});

export async function rechargeWalletAction(input: {
  amount: number;
  method?: PaymentMethod;
}): Promise<ActionResult<{ balance: number }>> {
  const parsed = rechargeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid amount.' };
  }

  const { supabase } = await requireClient();
  if (!supabase) return { ok: false, error: 'You must be signed in.' };

  const { data, error } = await callRpc(supabase, 'recharge_wallet', {
    p_amount: parsed.data.amount,
    p_method: parsed.data.method,
    p_reference: null,
  });
  if (error || !data) return { ok: false, error: mapRpcError(error?.message) };

  revalidatePath('/wallet');
  revalidatePath('/transactions');
  return { ok: true, data: { balance: Number(data.balance) } };
}
