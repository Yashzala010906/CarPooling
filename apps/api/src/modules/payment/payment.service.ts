import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

/**
 * Cash/card/UPI/wallet payments via Razorpay test mode (spec 5.6)
 * TODO: implement business logic.
 */
@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}
}
