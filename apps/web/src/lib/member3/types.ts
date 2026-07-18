/**
 * Member 3 domain types — composed from the raw Supabase row types with the
 * relations the UI needs. Kept separate from database.types.ts (which mirrors
 * the DB exactly) so pages/components depend on intent, not table shape.
 */
import type {
  BookingRow,
  MessageRow,
  PaymentRow,
  ProfileRow,
  RideRow,
  TransactionRow,
  TripLocationRow,
  TripRow,
  WalletRow,
} from '@/lib/supabase/database.types';

export type ViewerRole = 'DRIVER' | 'PASSENGER';

export interface TripListItem {
  trip: TripRow;
  ride: RideRow | null;
  driver: ProfileRow | null;
  viewerRole: ViewerRole;
}

export interface TripPassenger {
  booking: BookingRow;
  profile: ProfileRow | null;
}

export interface TripDetail {
  trip: TripRow;
  ride: RideRow | null;
  driver: ProfileRow | null;
  passengers: TripPassenger[];
  viewerRole: ViewerRole;
  myBooking: BookingRow | null;
  myPayment: PaymentRow | null;
  lastLocation: TripLocationRow | null;
}

export interface MessageWithSender extends MessageRow {
  sender: Pick<ProfileRow, 'id' | 'first_name' | 'last_name' | 'avatar_url'> | null;
}

export interface WalletSummary {
  wallet: WalletRow | null;
  totalCredits: number;
  totalDebits: number;
  recent: TransactionRow[];
}

export interface AnalyticsSummary {
  totalTrips: number;
  completedTrips: number;
  activeTrips: number;
  upcomingTrips: number;
  cancelledTrips: number;
  totalPaid: number;
  walletBalance: number;
  totalCredits: number;
  totalDebits: number;
  spendByMonth: MonthlyPoint[];
  tripsByMonth: MonthlyPoint[];
  paymentStatusBreakdown: { label: string; count: number }[];
}

export interface MonthlyPoint {
  /** e.g. "Jul" */
  label: string;
  value: number;
}

export function profileName(p?: Pick<ProfileRow, 'first_name' | 'last_name'> | null): string {
  if (!p) return 'Unknown';
  const name = [p.first_name, p.last_name].filter(Boolean).join(' ').trim();
  return name || 'Unknown';
}

export function initials(p?: Pick<ProfileRow, 'first_name' | 'last_name'> | null): string {
  if (!p) return '?';
  const a = p.first_name?.[0] ?? '';
  const b = p.last_name?.[0] ?? '';
  return (a + b || a || '?').toUpperCase();
}

export function routeLabel(ride?: RideRow | null): string {
  if (!ride) return 'Trip';
  const from = ride.origin_address?.split(',')[0] ?? 'Origin';
  const to = ride.destination_address?.split(',')[0] ?? 'Destination';
  return `${from} → ${to}`;
}
