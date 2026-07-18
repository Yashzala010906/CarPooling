import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Max, MaxLength, Min } from 'class-validator';
import type { Location } from '@carpool/types';

/** Nested address + coordinates payload for ride origin/destination. */
export class LocationDto implements Location {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  address!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;
}
