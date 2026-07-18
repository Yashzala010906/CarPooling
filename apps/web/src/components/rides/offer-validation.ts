import type { Vehicle } from '@carpool/types';

import type { OfferRideDraft } from '@/stores/ride.store';

/** Per-field messages keyed by OfferRideDraft field. */
export type OfferFieldErrors = Partial<Record<keyof OfferRideDraft, string>>;

/** Seats offerable for a vehicle — the driver occupies one. */
export function maxOfferableSeats(vehicle: Vehicle): number {
  return Math.max(1, vehicle.seatingCapacity - 1);
}

/** Combines the date + time inputs into a Date, or null while incomplete. */
export function combineDeparture(date: string, time: string): Date | null {
  if (!date || !time) return null;
  const departure = new Date(`${date}T${time}`);
  return Number.isNaN(departure.getTime()) ? null : departure;
}

/**
 * Step 1 rules, mirroring RideService: route fields present and distinct,
 * departure date/time present and in the future.
 */
export function validateRouteStep(draft: OfferRideDraft): OfferFieldErrors {
  const errors: OfferFieldErrors = {};
  const pickup = draft.pickupAddress.trim();
  const destination = draft.destinationAddress.trim();

  if (!pickup) errors.pickupAddress = 'Pickup is required';
  if (!destination) errors.destinationAddress = 'Destination is required';
  if (pickup && destination && pickup.toLowerCase() === destination.toLowerCase()) {
    errors.destinationAddress = 'Pickup and destination cannot be identical';
  }

  if (!draft.departureDate) errors.departureDate = 'Date is required';
  if (!draft.departureTime) errors.departureTime = 'Time is required';
  const departure = combineDeparture(draft.departureDate, draft.departureTime);
  if (departure && departure.getTime() <= Date.now()) {
    errors.departureTime = 'Departure must be in the future';
  }
  return errors;
}

/** Step 2 rules: vehicle chosen, seats within the vehicle, fare a non-negative number. */
export function validateVehicleStep(
  draft: OfferRideDraft,
  vehicle: Vehicle | undefined,
): OfferFieldErrors {
  const errors: OfferFieldErrors = {};

  if (!draft.vehicleId || !vehicle) {
    errors.vehicleId = 'Select a vehicle for this ride';
  } else if (draft.seatsTotal < 1) {
    errors.seatsTotal = 'Available seats must be greater than zero';
  } else if (draft.seatsTotal > maxOfferableSeats(vehicle)) {
    errors.seatsTotal = `This vehicle can offer at most ${maxOfferableSeats(vehicle)} seats`;
  }

  if (draft.farePerSeat.trim() === '' || Number.isNaN(Number(draft.farePerSeat))) {
    errors.farePerSeat = 'Enter a fare per seat';
  } else if (Number(draft.farePerSeat) < 0) {
    errors.farePerSeat = 'Fare cannot be negative';
  }

  if (draft.notes.length > 500) {
    errors.notes = 'Notes must be 500 characters or fewer';
  }
  return errors;
}
