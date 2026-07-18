import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

/**
 * Search, publish, route confirmation, matching (spec 5.2, 5.3)
 * TODO: implement business logic.
 */
@Injectable()
export class RideService {
  constructor(private readonly prisma: PrismaService) {}
}
