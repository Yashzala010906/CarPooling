/**
 * Trip lifecycle rules — the single source of truth for valid transitions and
 * status → UI mapping. The server RPCs (start_trip/end_trip/cancel_trip)
 * re-validate these on the database side; this mirrors them for the client so
 * buttons are only shown when the action is actually allowed.
 */
import type { PaymentStatus, TripStatus } from '@/lib/supabase/database.types';

export type TripCategory = 'upcoming' | 'active' | 'completed' | 'cancelled';

export const TRIP_STATUS_LABEL: Record<TripStatus, string> = {
  BOOKED: 'Upcoming',
  STARTED: 'Starting',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  PAYMENT_PENDING: 'Payment Pending',
  PAYMENT_COMPLETED: 'Paid',
  CANCELLED: 'Cancelled',
};

/** Tailwind tone per status, consumed by <TripStatusBadge/>. */
export const TRIP_STATUS_TONE: Record<
  TripStatus,
  'success' | 'active' | 'warning' | 'neutral' | 'error'
> = {
  BOOKED: 'neutral',
  STARTED: 'active',
  IN_PROGRESS: 'active',
  COMPLETED: 'success',
  PAYMENT_PENDING: 'warning',
  PAYMENT_COMPLETED: 'success',
  CANCELLED: 'error',
};

export function tripCategory(status: TripStatus): TripCategory {
  switch (status) {
    case 'BOOKED':
      return 'upcoming';
    case 'STARTED':
    case 'IN_PROGRESS':
      return 'active';
    case 'COMPLETED':
    case 'PAYMENT_PENDING':
    case 'PAYMENT_COMPLETED':
      return 'completed';
    case 'CANCELLED':
      return 'cancelled';
  }
}

const ACTIVE: TripStatus[] = ['STARTED', 'IN_PROGRESS'];

export const isTripActive = (s: TripStatus): boolean => ACTIVE.includes(s);
export const canStartTrip = (s: TripStatus): boolean => s === 'BOOKED';
export const canEndTrip = (s: TripStatus): boolean => ACTIVE.includes(s);
export const canCancelTrip = (s: TripStatus): boolean =>
  s !== 'COMPLETED' && s !== 'PAYMENT_COMPLETED' && s !== 'CANCELLED';
export const canTrackTrip = (s: TripStatus): boolean => ACTIVE.includes(s);
export const isTripPayable = (s: TripStatus): boolean =>
  s === 'COMPLETED' || s === 'PAYMENT_PENDING';

/** Ordered lifecycle steps for the trip timeline component. */
export const TRIP_TIMELINE_STEPS: { status: TripStatus; label: string }[] = [
  { status: 'BOOKED', label: 'Booked' },
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'COMPLETED', label: 'Completed' },
  { status: 'PAYMENT_COMPLETED', label: 'Paid' },
];

const TIMELINE_ORDER: TripStatus[] = [
  'BOOKED',
  'STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'PAYMENT_COMPLETED',
];

/** Index of a status within the happy-path timeline (‑1 for CANCELLED). */
export function timelineIndex(status: TripStatus): number {
  if (status === 'PAYMENT_PENDING') return TIMELINE_ORDER.indexOf('COMPLETED');
  return TIMELINE_ORDER.indexOf(status);
}

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  PAID: 'Paid',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
};

export const PAYMENT_STATUS_TONE: Record<
  PaymentStatus,
  'success' | 'warning' | 'error' | 'neutral'
> = {
  PENDING: 'warning',
  PROCESSING: 'warning',
  PAID: 'success',
  FAILED: 'error',
  REFUNDED: 'neutral',
};

/** Maps stable RPC error codes to user-facing messages. */
const RPC_ERROR_MESSAGES: Record<string, string> = {
  TRIP_NOT_FOUND: 'This trip no longer exists.',
  NOT_TRIP_DRIVER: 'Only the trip driver can perform this action.',
  INVALID_TRANSITION: 'That action is not allowed for the current trip status.',
  NO_BOOKING: 'No booking found for this trip.',
  NO_WALLET: 'Wallet not found. Please try again.',
  INSUFFICIENT_FUNDS: 'Insufficient wallet balance. Please recharge and try again.',
  INVALID_AMOUNT: 'The amount is invalid.',
  AMOUNT_TOO_LARGE: 'That amount exceeds the allowed limit.',
  PAYMENT_NOT_FOUND: 'Payment record not found.',
  NOT_PAYMENT_OWNER: 'You are not authorised to modify this payment.',
  ALREADY_PAID: 'This payment has already been completed.',
};

export function mapRpcError(message: string | undefined): string {
  if (!message) return 'Something went wrong. Please try again.';
  for (const [code, friendly] of Object.entries(RPC_ERROR_MESSAGES)) {
    if (message.includes(code)) return friendly;
  }
  return 'Something went wrong. Please try again.';
}
