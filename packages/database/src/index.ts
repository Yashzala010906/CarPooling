import { PrismaClient } from '@prisma/client';

/**
 * Singleton PrismaClient — reused across hot reloads in development
 * so we do not exhaust the connection pool.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export * from '@prisma/client';
