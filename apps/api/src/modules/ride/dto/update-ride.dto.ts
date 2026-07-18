import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import type { UpdateRideRequest } from '@carpool/types';

import { LocationDto } from './location.dto';

/**
 * Payload for PUT /rides/:id — every field optional.
 * Written out by hand (rather than PartialType) to avoid an extra
 * @nestjs/mapped-types dependency; business rules are re-validated on the
 * merged result in RideService.
 */
export class UpdateRideDto implements UpdateRideRequest {
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  origin?: LocationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  destination?: LocationDto;

  @IsOptional()
  @IsDateString()
  departureAt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Available seats must be greater than zero' })
  seatsTotal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Fare cannot be negative' })
  farePerSeat?: number;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  routeDistanceKm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  estimatedDurationMins?: number;
}
