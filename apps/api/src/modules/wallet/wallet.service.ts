import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

/**
 * Balance, recharge, wallet payments (spec 5.6)
 * TODO: implement business logic.
 */
@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}
}
