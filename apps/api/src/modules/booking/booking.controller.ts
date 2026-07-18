import { Controller } from '@nestjs/common';

import { BookingService } from './booking.service';

/**
 * Ride booking and cancellation (spec 5.2)
 * TODO: define endpoints. Guarded globally by JwtAuthGuard;
 * use @Public() to expose a route, @Roles(UserRole.COMPANY_ADMIN) for admin-only.
 */
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}
}
