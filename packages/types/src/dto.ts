import type { Location } from './entities';
import type { PaymentMethod } from './enums';

/**
 * Request payload contracts shared between web and api.
 * The API layer re-validates these with class-validator DTOs.
 */

export interface RegisterRequest {
  companyCode: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SearchRideRequest {
  origin: Location;
  destination: Location;
  travelDate: string;
  travelTime: string;
  seats: number;
  isRecurring?: boolean;
}

export interface PublishRideRequest {
  vehicleId: string;
  origin: Location;
  destination: Location;
  departureAt: string;
  seatsTotal: number;
  farePerSeat: number;
  isRecurring?: boolean;
  /** Driver notes shown to passengers (drop-off specifics, preferences). */
  notes?: string;
  /** Route distance in km from the maps provider, when available. */
  routeDistanceKm?: number;
  /** Estimated travel time in minutes from the maps provider, when available. */
  estimatedDurationMins?: number;
}

/** Partial update of a published ride; same rules re-validated server-side. */
export type UpdateRideRequest = Partial<PublishRideRequest>;

export interface CreateBookingRequest {
  rideId: string;
  seats: number;
}

export interface CreateVehicleRequest {
  model: string;
  registrationNumber: string;
  seatingCapacity: number;
  fuelType?: string;
  mileageKmPerLitre?: number;
}

export interface RechargeWalletRequest {
  amount: number;
}

export interface CreatePaymentRequest {
  bookingId: string;
  method: PaymentMethod;
}

export interface SendChatMessageRequest {
  tripId: string;
  content: string;
}
