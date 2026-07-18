import { Controller } from '@nestjs/common';

import { PaymentService } from './payment.service';

/**
 * Cash/card/UPI/wallet payments via Razorpay test mode (spec 5.6)
 * TODO: define endpoints. Guarded globally by JwtAuthGuard;
 * use @Public() to expose a route, @Roles(UserRole.COMPANY_ADMIN) for admin-only.
 */
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}
}
