import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RideStatus, type Prisma, type Vehicle } from '@carpool/database';
import type {
  Location,
  Paginated,
  Ride as RideEntity,
  Vehicle as VehicleEntity,
} from '@carpool/types';

import { toRideEntity, toVehicleEntity, type RideWithRelations } from './ride.mapper';
import { RideRepository } from './ride.repository';
import type { CreateRideDto } from './dto/create-ride.dto';
import type { MyRidesQueryDto } from './dto/my-rides-query.dto';
import type { UpdateRideDto } from './dto/update-ride.dto';

/** Ride statuses a driver is still allowed to edit. */
const EDITABLE_STATUSES: RideStatus[] = [RideStatus.DRAFT, RideStatus.PUBLISHED];

/** Whitelist of sortable columns for GET /rides/my-rides. */
const SORTABLE_FIELDS = ['departureAt', 'createdAt'] as const;

/**
 * Ride publishing use cases (spec 5.3): publish, read, update, cancel.
 * Search/matching (spec 5.2) belongs to a later phase.
 */
@Injectable()
export class RideService {
  constructor(private readonly rideRepository: RideRepository) {}

  /** Publishes a ride for the authenticated driver after all business rules pass. */
  async publishRide(driverId: string, dto: CreateRideDto): Promise<RideEntity> {
    const departureAt = this.parseDeparture(dto.departureAt);
    this.assertRouteIsDistinct(dto.origin, dto.destination);

    const vehicle = await this.getOwnedVehicle(dto.vehicleId, driverId);
    this.assertSeatsFitVehicle(dto.seatsTotal, vehicle);

    const ride = await this.rideRepository.create({
      driverId,
      vehicleId: vehicle.id,
      originAddress: dto.origin.address,
      originLat: dto.origin.lat,
      originLng: dto.origin.lng,
      destinationAddress: dto.destination.address,
      destinationLat: dto.destination.lat,
      destinationLng: dto.destination.lng,
      departureAt,
      seatsTotal: dto.seatsTotal,
      seatsAvailable: dto.seatsTotal,
      farePerSeat: dto.farePerSeat,
      isRecurring: dto.isRecurring ?? false,
      notes: dto.notes,
      routeDistanceKm: dto.routeDistanceKm,
      estimatedDurationMins: dto.estimatedDurationMins,
      status: RideStatus.PUBLISHED,
    });
    return toRideEntity(ride);
  }

  /** Any authenticated employee may look up a ride (used by the success page and later phases). */
  async getRideById(id: string): Promise<RideEntity> {
    return toRideEntity(await this.getRideOrThrow(id));
  }

  /** Paginated list of the authenticated driver's own rides. */
  async getMyRides(driverId: string, query: MyRidesQueryDto): Promise<Paginated<RideEntity>> {
    const sortBy = SORTABLE_FIELDS.includes(query.sortBy as (typeof SORTABLE_FIELDS)[number])
      ? (query.sortBy as (typeof SORTABLE_FIELDS)[number])
      : 'departureAt';

    const [rides, total] = await this.rideRepository.findManyByDriver({
      driverId,
      status: query.status as RideStatus | undefined,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: { [sortBy]: query.sortOrder },
    });

    return {
      items: rides.map(toRideEntity),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  /** Updates an editable ride owned by the driver; rules re-run on the merged result. */
  async updateRide(driverId: string, id: string, dto: UpdateRideDto): Promise<RideEntity> {
    const ride = await this.getOwnRideOrThrow(id, driverId);
    if (!EDITABLE_STATUSES.includes(ride.status)) {
      throw new ConflictException(`A ${ride.status.toLowerCase()} ride can no longer be edited`);
    }

    const departureAt = this.parseDeparture(dto.departureAt ?? ride.departureAt.toISOString());

    const origin: Location = dto.origin ?? {
      address: ride.originAddress,
      lat: ride.originLat,
      lng: ride.originLng,
    };
    const destination: Location = dto.destination ?? {
      address: ride.destinationAddress,
      lat: ride.destinationLat,
      lng: ride.destinationLng,
    };
    this.assertRouteIsDistinct(origin, destination);

    const vehicle = await this.getOwnedVehicle(dto.vehicleId ?? ride.vehicleId, driverId);

    // Preserve seats already booked when the driver changes the seat count.
    const bookedSeats = ride.seatsTotal - ride.seatsAvailable;
    const seatsTotal = dto.seatsTotal ?? ride.seatsTotal;
    this.assertSeatsFitVehicle(seatsTotal, vehicle);
    if (seatsTotal < bookedSeats) {
      throw new ConflictException(
        `Cannot reduce seats below the ${bookedSeats} already booked for this ride`,
      );
    }

    const data: Prisma.RideUncheckedUpdateInput = {
      vehicleId: vehicle.id,
      originAddress: origin.address,
      originLat: origin.lat,
      originLng: origin.lng,
      destinationAddress: destination.address,
      destinationLat: destination.lat,
      destinationLng: destination.lng,
      departureAt,
      seatsTotal,
      seatsAvailable: seatsTotal - bookedSeats,
      ...(dto.farePerSeat !== undefined ? { farePerSeat: dto.farePerSeat } : {}),
      ...(dto.isRecurring !== undefined ? { isRecurring: dto.isRecurring } : {}),
      ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      ...(dto.routeDistanceKm !== undefined ? { routeDistanceKm: dto.routeDistanceKm } : {}),
      ...(dto.estimatedDurationMins !== undefined
        ? { estimatedDurationMins: dto.estimatedDurationMins }
        : {}),
    };
    return toRideEntity(await this.rideRepository.update(id, data));
  }

  /**
   * DELETE /rides/:id cancels rather than hard-deletes: bookings, trips, and
   * reports reference rides in later phases, so rows must stay addressable.
   */
  async cancelRide(driverId: string, id: string): Promise<RideEntity> {
    const ride = await this.getOwnRideOrThrow(id, driverId);
    if (ride.status === RideStatus.CANCELLED) {
      throw new ConflictException('Ride is already cancelled');
    }
    if (ride.status === RideStatus.IN_PROGRESS || ride.status === RideStatus.COMPLETED) {
      throw new ConflictException(
        `A ${ride.status.toLowerCase().replace('_', '-')} ride cannot be cancelled`,
      );
    }
    return toRideEntity(await this.rideRepository.update(id, { status: RideStatus.CANCELLED }));
  }

  /**
   * The driver's active vehicles for the Offer Ride form. Temporary seam:
   * swap the frontend to GET /vehicles once VehicleModule (Member 1) lands.
   */
  async getVehicleOptions(driverId: string): Promise<VehicleEntity[]> {
    const vehicles = await this.rideRepository.findActiveVehiclesByOwner(driverId);
    return vehicles.map(toVehicleEntity);
  }

  // ─────────────────────── Business rules ───────────────────────

  /** Departure must include a time component and lie in the future. */
  private parseDeparture(departureAt: string): Date {
    if (!/T\d{2}:\d{2}/.test(departureAt)) {
      throw new BadRequestException('Departure time is required');
    }
    const departure = new Date(departureAt);
    if (Number.isNaN(departure.getTime())) {
      throw new BadRequestException('Departure date is invalid');
    }
    if (departure.getTime() <= Date.now()) {
      throw new BadRequestException('Departure date cannot be in the past');
    }
    return departure;
  }

  /** Pickup and destination cannot be identical (by address or coordinates). */
  private assertRouteIsDistinct(origin: Location, destination: Location): void {
    const sameAddress =
      origin.address.trim().toLowerCase() === destination.address.trim().toLowerCase();
    const sameCoordinates =
      Math.abs(origin.lat - destination.lat) < 1e-6 &&
      Math.abs(origin.lng - destination.lng) < 1e-6;
    if (sameAddress || sameCoordinates) {
      throw new BadRequestException('Pickup and destination cannot be identical');
    }
  }

  /** Vehicle must exist, be active, and belong to the authenticated driver. */
  private async getOwnedVehicle(vehicleId: string, driverId: string): Promise<Vehicle> {
    const vehicle = await this.rideRepository.findVehicleById(vehicleId);
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    if (vehicle.ownerId !== driverId) {
      throw new ForbiddenException('Vehicle does not belong to you');
    }
    if (!vehicle.isActive) {
      throw new BadRequestException('Vehicle is inactive');
    }
    return vehicle;
  }

  /** Offered seats must fit the vehicle, keeping one seat for the driver. */
  private assertSeatsFitVehicle(seatsTotal: number, vehicle: Vehicle): void {
    const maxSeats = vehicle.seatingCapacity - 1;
    if (seatsTotal > maxSeats) {
      throw new BadRequestException(
        `This vehicle can offer at most ${maxSeats} seat${maxSeats === 1 ? '' : 's'} (driver occupies one)`,
      );
    }
  }

  private async getRideOrThrow(id: string): Promise<RideWithRelations> {
    const ride = await this.rideRepository.findById(id);
    if (!ride) {
      throw new NotFoundException('Ride not found');
    }
    return ride;
  }

  private async getOwnRideOrThrow(id: string, driverId: string): Promise<RideWithRelations> {
    const ride = await this.getRideOrThrow(id);
    if (ride.driverId !== driverId) {
      throw new ForbiddenException('You can only manage your own rides');
    }
    return ride;
  }
}
