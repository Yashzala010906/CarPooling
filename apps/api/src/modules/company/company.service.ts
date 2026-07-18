import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

/**
 * Company administration: employees, org settings (spec 3)
 * TODO: implement business logic.
 */
@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}
}
