import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { callRpc } from '@/lib/supabase/db';
import { isSupabaseConfigured } from '@/lib/supabase/config';

/**
 * POST /api/payments/verify
 * Server-side verification of a Razorpay checkout result.
 *
 * Payment success MUST NOT depend on a client "success" message. The browser
 * posts { paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature };
 * we recompute the HMAC-SHA256 signature with the server-only key secret and,
 * only if it matches, settle the payment via the idempotent settle_payment RPC.
 *
 * When RAZORPAY_KEY_SECRET is not configured the endpoint returns 501 so the
 * integration is clearly "structure present, credentials required" rather than
 * silently trusting the client.
 */

const bodySchema = z.object({
  paymentId: z.string().uuid(),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  if (ba.length !== bb.length || ba.length === 0) return false;
  return timingSafeEqual(ba, bb);
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'Payment verification is not configured. Set RAZORPAY_KEY_SECRET.' },
      { status: 501 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid verification payload' }, { status: 422 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;

  // Razorpay signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret).
  const expected = createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (!safeEqualHex(expected, razorpaySignature)) {
    await callRpc(supabase, 'fail_payment', {
      p_payment_id: paymentId,
      p_reason: 'Signature mismatch',
    });
    return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 });
  }

  // settle_payment is idempotent — duplicate callbacks won't double-charge.
  const { data, error } = await callRpc(supabase, 'settle_payment', {
    p_payment_id: paymentId,
    p_provider_payment_id: razorpayPaymentId,
  });
  if (error) {
    return NextResponse.json({ error: 'Could not settle payment' }, { status: 400 });
  }

  return NextResponse.json({ ok: true, payment: data }, { status: 200 });
}
