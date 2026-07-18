import { Injectable } from '@nestjs/common';
import type { Prisma, RideStatus, Vehicle } from '@carpool/database';

import { PrismaService } from '@/prisma/prisma.service';
import type { RideWithRelations } from './ride.mapper';

/** Relations eagerly loaded on every ride the API returns. */
const RIDE_INCLUDE = { vehicle: true, driver: true } as const;

/**
 * Data access for the ride module (clean architecture: service → repository → Prisma).
 * Vehicle lookups needed by ride business rules live here as read-only queries so
 * this module stays self-contained and VehicleModule (owned by Member 1) is untouched.
 */
@Injectable()
export class RideRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.RideUncheckedCreateInput): Promise<RideWithRelations> {
    return this.prisma.ride.create({ data, include: RIDE_INCLUDE });
  }

  findById(id: string): Promise<RideWithRelations | null> {
    return this.prisma.ride.findUnique({ where: { id }, include: RIDE_INCLUDE });
  }

  update(id: string, data: Prisma.RideUncheckedUpdateInput): Promise<RideWithRelations> {
    return this.prisma.ride.update({ where: { id }, data, include: RIDE_INCLUDE });
  }

  /** Page of a driver's rides plus the total count, in one transaction. */
  findManyByDriver(params: {
    driverId: string;
    status?: RideStatus;
    skip: number;
    take: number;
    orderBy: Prisma.RideOrderByWithRelationInput;
  }): Promise<[RideWithRelations[], number]> {
    const where: Prisma.RideWhereInput = {
      driverId: params.driverId,
      ...(params.status ? { status: params.status } : {}),
    };
    return this.prisma.$transaction([
      this.prisma.ride.findMany({
        where,
        include: RIDE_INCLUDE,
        orderBy: params.orderBy,
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.ride.count({ where }),
    ]);
  }

  findVehicleById(id: string): Promise<Vehicle | null> {
    return this.prisma.vehicle.findUnique({ where: { id } });
  }

  findActiveVehiclesByOwner(ownerId: string): Promise<Vehicle[]> {
    return this.prisma.vehicle.findMany({
      where: { ownerId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }
}
