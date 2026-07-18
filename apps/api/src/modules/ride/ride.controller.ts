import { Controller } from '@nestjs/common';

import { RideService } from './ride.service';

/**
 * Search, publish, route confirmation, matching (spec 5.2, 5.3)
 * TODO: define endpoints. Guarded globally by JwtAuthGuard;
 * use @Public() to expose a route, @Roles(UserRole.COMPANY_ADMIN) for admin-only.
 */
@Controller('rides')
export class RideController {
  constructor(private readonly rideService: RideService) {}
}
