import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

/**
 * Vehicle registration and management (spec 5.8)
 * TODO: implement business logic.
 */
@Injectable()
export class VehicleService {
  constructor(private readonly prisma: PrismaService) {}
}
