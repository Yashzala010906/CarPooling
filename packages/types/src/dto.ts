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
}

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
