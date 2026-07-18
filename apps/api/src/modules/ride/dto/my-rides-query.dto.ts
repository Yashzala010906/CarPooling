import { IsEnum, IsOptional } from 'class-validator';
import { RideStatus } from '@carpool/types';

import { PaginationDto } from '@/common/dto/pagination.dto';

/** Query params for GET /rides/my-rides. */
export class MyRidesQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(RideStatus)
  status?: RideStatus;
}
