import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

/**
 * Ride/booking/trip/payment notifications (bonus)
 * TODO: implement business logic.
 */
@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}
}
