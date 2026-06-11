//src/utils/prismaClient.ts
import { PrismaClient } from '@prisma/client';

declare global {
    var prisma: PrismaClient;
    var prismaDirect: PrismaClient;
}

const prisma = globalThis.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Create a separate client for seeding that uses direct connection to avoid pool timeout
// Use singleton pattern to prevent connection pool exhaustion
const prismaDirect = globalThis.prismaDirect || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

if (process.env.NODE_ENV !== 'PRODUCTION') {
    globalThis.prisma = prisma;
    globalThis.prismaDirect = prismaDirect;
}

export default prisma;
export { prismaDirect };
