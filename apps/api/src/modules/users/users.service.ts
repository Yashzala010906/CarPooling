import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

/**
 * Employee profiles (spec 5.1, 6)
 * TODO: implement business logic.
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
}
