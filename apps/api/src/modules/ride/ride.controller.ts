import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { RideService } from './ride.service';
import { CreateRideDto } from './dto/create-ride.dto';
import { MyRidesQueryDto } from './dto/my-rides-query.dto';
import { UpdateRideDto } from './dto/update-ride.dto';

/**
 * Ride publishing endpoints (spec 5.3). Guarded globally by JwtAuthGuard,
 * so every handler runs with an authenticated user.
 * Search endpoints (spec 5.2) arrive in a later phase.
 */
@Controller('rides')
export class RideController {
  constructor(private readonly rideService: RideService) {}

  /** Publish a ride for the authenticated driver → 201 + created ride. */
  @Post()
  create(@CurrentUser('sub') driverId: string, @Body() dto: CreateRideDto) {
    return this.rideService.publishRide(driverId, dto);
  }

  // Static paths must be declared before ':id' so Nest does not swallow them.

  /** The authenticated driver's rides, paginated and optionally filtered by status. */
  @Get('my-rides')
  myRides(@CurrentUser('sub') driverId: string, @Query() query: MyRidesQueryDto) {
    return this.rideService.getMyRides(driverId, query);
  }

  /** Active vehicles of the driver for the Offer Ride form (seam until GET /vehicles lands). */
  @Get('vehicle-options')
  vehicleOptions(@CurrentUser('sub') driverId: string) {
    return this.rideService.getVehicleOptions(driverId);
  }

  /** Ride details by id → 200, or 404 when unknown. */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rideService.getRideById(id);
  }

  /** Update an editable ride owned by the driver → 200 + updated ride. */
  @Put(':id')
  update(
    @CurrentUser('sub') driverId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRideDto,
  ) {
    return this.rideService.updateRide(driverId, id, dto);
  }

  /** Cancel (soft-delete) a ride owned by the driver → 200 + cancelled ride. */
  @Delete(':id')
  remove(@CurrentUser('sub') driverId: string, @Param('id') id: string) {
    return this.rideService.cancelRide(driverId, id);
  }
}
