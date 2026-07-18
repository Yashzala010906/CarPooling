import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

/**
 * Trip chat between driver and passengers (spec 5.4)
 * TODO: implement business logic.
 */
@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}
}
