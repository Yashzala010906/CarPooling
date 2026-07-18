import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

/**
 * Ride booking and cancellation (spec 5.2)
 * TODO: implement business logic.
 */
@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) {}
}
