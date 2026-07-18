import { Controller } from '@nestjs/common';

import { NotificationService } from './notification.service';

/**
 * Ride/booking/trip/payment notifications (bonus)
 * TODO: define endpoints. Guarded globally by JwtAuthGuard;
 * use @Public() to expose a route, @Roles(UserRole.COMPANY_ADMIN) for admin-only.
 */
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}
}
