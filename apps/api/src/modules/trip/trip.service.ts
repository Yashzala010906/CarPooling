import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

/**
 * Trip lifecycle, live tracking, ride history (spec 5.4, 5.5, 5.7)
 * TODO: implement business logic.
 */
@Injectable()
export class TripService {
  constructor(private readonly prisma: PrismaService) {}
}
