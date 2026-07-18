import type { Prisma, Vehicle } from '@carpool/database';
import type {
  Ride as RideEntity,
  RideStatus,
  User as UserEntity,
  UserRole,
  Vehicle as VehicleEntity,
} from '@carpool/types';

/** Prisma ride row with the relations the API returns. */
export type RideWithRelations = Prisma.RideGetPayload<{
  include: { vehicle: true; driver: true };
}>;

/** Maps a Prisma vehicle row to the shared Vehicle contract. */
export function toVehicleEntity(vehicle: Vehicle): VehicleEntity {
  return {
    id: vehicle.id,
    ownerId: vehicle.ownerId,
    model: vehicle.model,
    registrationNumber: vehicle.registrationNumber,
    seatingCapacity: vehicle.seatingCapacity,
    fuelType: vehicle.fuelType,
    mileageKmPerLitre: vehicle.mileageKmPerLitre,
    isActive: vehicle.isActive,
    createdAt: vehicle.createdAt.toISOString(),
    updatedAt: vehicle.updatedAt.toISOString(),
  };
}

/** Maps a Prisma driver row to the shared User contract (never leaks passwordHash). */
function toDriverEntity(driver: RideWithRelations['driver']): UserEntity {
  return {
    id: driver.id,
    companyId: driver.companyId,
    role: driver.role as UserRole,
    email: driver.email,
    phone: driver.phone,
    firstName: driver.firstName,
    lastName: driver.lastName,
    avatarUrl: driver.avatarUrl,
    isActive: driver.isActive,
    createdAt: driver.createdAt.toISOString(),
    updatedAt: driver.updatedAt.toISOString(),
  };
}

/**
 * Maps a Prisma ride row (flat columns, Decimal fare, Date fields) to the
 * shared Ride contract (nested origin/destination, plain numbers, ISO strings).
 */
export function toRideEntity(ride: RideWithRelations): RideEntity {
  return {
    id: ride.id,
    driverId: ride.driverId,
    driver: toDriverEntity(ride.driver),
    vehicleId: ride.vehicleId,
    vehicle: toVehicleEntity(ride.vehicle),
    origin: {
      address: ride.originAddress,
      lat: ride.originLat,
      lng: ride.originLng,
    },
    destination: {
      address: ride.destinationAddress,
      lat: ride.destinationLat,
      lng: ride.destinationLng,
    },
    departureAt: ride.departureAt.toISOString(),
    seatsTotal: ride.seatsTotal,
    seatsAvailable: ride.seatsAvailable,
    farePerSeat: Number(ride.farePerSeat),
    isRecurring: ride.isRecurring,
    routePolyline: ride.routePolyline,
    notes: ride.notes,
    routeDistanceKm: ride.routeDistanceKm,
    estimatedDurationMins: ride.estimatedDurationMins,
    status: ride.status as RideStatus,
    createdAt: ride.createdAt.toISOString(),
    updatedAt: ride.updatedAt.toISOString(),
  };
}
