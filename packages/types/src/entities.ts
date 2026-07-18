import type {
  BookingStatus,
  NotificationType,
  PaymentMethod,
  PaymentStatus,
  RideStatus,
  TripStatus,
  UserRole,
  WalletTransactionType,
} from './enums';

/** Geographic point used across rides, trips, and tracking. */
export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Location extends GeoPoint {
  address: string;
}

export interface Company {
  id: string;
  name: string;
  code: string;
  /** Org-specific settings: fuel cost, cost per km, etc. */
  settings?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  companyId: string;
  role: UserRole;
  email: string;
  phone?: string | null;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  ownerId: string;
  model: string;
  registrationNumber: string;
  seatingCapacity: number;
  fuelType?: string | null;
  mileageKmPerLitre?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavedPlace {
  id: string;
  userId: string;
  label: string;
  location: Location;
}

export interface Ride {
  id: string;
  driverId: string;
  driver?: User;
  vehicleId: string;
  vehicle?: Vehicle;
  origin: Location;
  destination: Location;
  departureAt: string;
  seatsTotal: number;
  seatsAvailable: number;
  farePerSeat: number;
  isRecurring: boolean;
  /** Encoded polyline from the maps provider, for route preview. */
  routePolyline?: string | null;
  /** Driver notes shown to passengers (drop-off specifics, preferences). */
  notes?: string | null;
  /** Route distance in km from the maps provider, when available. */
  routeDistanceKm?: number | null;
  /** Estimated travel time in minutes from the maps provider, when available. */
  estimatedDurationMins?: number | null;
  status: RideStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  rideId: string;
  ride?: Ride;
  passengerId: string;
  passenger?: User;
  seats: number;
  fareTotal: number;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  id: string;
  rideId: string;
  ride?: Ride;
  status: TripStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  distanceKm?: number | null;
  createdAt: string;
  updatedAt: string;
}

/** A single live-tracking ping emitted while a trip is active. */
export interface TripLocation extends GeoPoint {
  id: string;
  tripId: string;
  recordedAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: WalletTransactionType;
  amount: number;
  description?: string | null;
  referenceId?: string | null;
  createdAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  payerId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  tripId: string;
  senderId: string;
  sender?: User;
  content: string;
  sentAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  data?: Record<string, unknown> | null;
  createdAt: string;
}
