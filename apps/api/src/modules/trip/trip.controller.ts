import { Controller } from '@nestjs/common';

import { TripService } from './trip.service';

/**
 * Trip lifecycle, live tracking, ride history (spec 5.4, 5.5, 5.7)
 * TODO: define endpoints. Guarded globally by JwtAuthGuard;
 * use @Public() to expose a route, @Roles(UserRole.COMPANY_ADMIN) for admin-only.
 */
@Controller('trips')
export class TripController {
  constructor(private readonly tripService: TripService) {}
}
