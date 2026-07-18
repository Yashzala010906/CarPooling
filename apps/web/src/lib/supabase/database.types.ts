/**
 * Hand-written Supabase `Database` type for the Member 3 (Trip Execution &
 * Financial System) schema. Mirrors supabase/migrations/*.sql.
 *
 * When Supabase codegen becomes available run:
 *   supabase gen types typescript --project-id <ref> > database.types.ts
 * …and replace this file. Until then this keeps the SDK fully typed.
 */

export type TripStatus =
  | 'BOOKED'
  | 'STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_COMPLETED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'WALLET';

export type TransactionType = 'PAYMENT' | 'CREDIT' | 'DEBIT' | 'REFUND';

export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

type Timestamps = {
  created_at: string;
  updated_at: string;
};

export interface ProfileRow {
  id: string;
  company_id: string | null;
  role: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RideRow extends Timestamps {
  id: string;
  driver_id: string;
  vehicle_id: string | null;
  origin_address: string;
  origin_lat: number | null;
  origin_lng: number | null;
  destination_address: string;
  destination_lat: number | null;
  destination_lng: number | null;
  departure_at: string;
  seats_total: number;
  seats_available: number;
  fare_per_seat: number;
  vehicle_model: string | null;
  vehicle_registration: string | null;
  route_polyline: string | null;
  status: string;
}

export interface BookingRow extends Timestamps {
  id: string;
  ride_id: string;
  passenger_id: string;
  seats: number;
  fare_total: number;
  status: string;
}

export interface TripRow extends Timestamps {
  id: string;
  ride_id: string;
  driver_id: string;
  status: TripStatus;
  scheduled_start_time: string | null;
  actual_start_time: string | null;
  actual_end_time: string | null;
  final_fare: number | null;
  distance_km: number | null;
}

export interface TripLocationRow {
  id: string;
  trip_id: string;
  driver_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  recorded_at: string;
}

export interface MessageRow {
  id: string;
  trip_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface PaymentRow extends Timestamps {
  id: string;
  user_id: string;
  trip_id: string | null;
  booking_id: string | null;
  amount: number;
  currency: string;
  method: PaymentMethod;
  provider: string | null;
  provider_order_id: string | null;
  provider_payment_id: string | null;
  status: PaymentStatus;
  failure_reason: string | null;
}

export interface WalletRow extends Timestamps {
  id: string;
  user_id: string;
  balance: number;
}

export interface TransactionRow {
  id: string;
  wallet_id: string | null;
  user_id: string;
  trip_id: string | null;
  payment_id: string | null;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  method: PaymentMethod | null;
  description: string | null;
  created_at: string;
}

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  // Marker consumed by supabase-js' type machinery (matches codegen output).
  __InternalSupabase: { PostgrestVersion: '12' };
  public: {
    Tables: {
      profiles: Table<ProfileRow>;
      rides: Table<RideRow>;
      bookings: Table<BookingRow>;
      trips: Table<TripRow>;
      trip_locations: Table<
        TripLocationRow,
        Omit<TripLocationRow, 'id' | 'recorded_at'> & { recorded_at?: string }
      >;
      messages: Table<MessageRow, Omit<MessageRow, 'id' | 'created_at'> & { created_at?: string }>;
      payments: Table<PaymentRow>;
      wallets: Table<WalletRow>;
      transactions: Table<TransactionRow>;
    };
    Views: Record<string, never>;
    Functions: {
      start_trip: {
        Args: { p_trip_id: string };
        Returns: TripRow;
      };
      end_trip: {
        Args: { p_trip_id: string; p_final_fare: number | null; p_distance_km: number | null };
        Returns: TripRow;
      };
      pay_trip_from_wallet: {
        Args: { p_trip_id: string };
        Returns: PaymentRow;
      };
      create_trip_payment: {
        Args: { p_trip_id: string; p_method: PaymentMethod };
        Returns: PaymentRow;
      };
      cancel_trip: {
        Args: { p_trip_id: string };
        Returns: TripRow;
      };
      fail_payment: {
        Args: { p_payment_id: string; p_reason: string | null };
        Returns: PaymentRow;
      };
      recharge_wallet: {
        Args: { p_amount: number; p_method: PaymentMethod; p_reference: string | null };
        Returns: WalletRow;
      };
      settle_payment: {
        Args: { p_payment_id: string; p_provider_payment_id: string | null };
        Returns: PaymentRow;
      };
    };
    Enums: {
      trip_status: TripStatus;
      payment_status: PaymentStatus;
      payment_method: PaymentMethod;
      transaction_type: TransactionType;
      transaction_status: TransactionStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
