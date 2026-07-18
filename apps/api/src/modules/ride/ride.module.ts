import { Module } from '@nestjs/common';

import { RideController } from './ride.controller';
import { RideRepository } from './ride.repository';
import { RideService } from './ride.service';

@Module({
  controllers: [RideController],
  providers: [RideService, RideRepository],
  exports: [RideService],
})
export class RideModule {}
