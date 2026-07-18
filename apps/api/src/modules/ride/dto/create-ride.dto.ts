import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import type { PublishRideRequest } from '@carpool/types';

import { LocationDto } from './location.dto';

/** Payload for POST /rides — publish a ride (spec 5.3). */
export class CreateRideDto implements PublishRideRequest {
  @IsString()
  @IsNotEmpty()
  vehicleId!: string;

  @ValidateNested()
  @Type(() => LocationDto)
  origin!: LocationDto;

  @ValidateNested()
  @Type(() => LocationDto)
  destination!: LocationDto;

  /** ISO 8601 date-time. The time component is enforced by RideService. */
  @IsDateString()
  departureAt!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Available seats must be greater than zero' })
  seatsTotal!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Fare cannot be negative' })
  farePerSeat!: number;

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
