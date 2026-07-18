import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

/**
 * Trips, distance, fuel, cost analytics (spec 5.9)
 * TODO: implement business logic.
 */
@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}
}
