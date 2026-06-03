//src/utils/prismaClient.ts
import { PrismaClient } from '@prisma/client';

declare global {
    var prisma: PrismaClient;
}

const prisma = globalThis.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

if (process.env.NODE_ENV !== 'PRODUCTION') {
    globalThis.prisma = prisma;
}

export default prisma;
