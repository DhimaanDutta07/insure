//src/utils/prismaClient.ts
import { PrismaClient } from '@prisma/client';

declare global {
    var prisma: PrismaClient;
    var prismaDirect: PrismaClient;
}

// Always reuse the global singleton to prevent connection pool exhaustion in
// serverless environments (Vercel). Without this, every cold-start or warm
// invocation creates a brand-new PrismaClient which opens new DB connections.
// connection_limit=10 caps the pool per instance; adjust via DATABASE_URL param.
const prisma = globalThis.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Separate client for scripts/seeds that need a direct (non-pooled) connection.
const prismaDirect = globalThis.prismaDirect ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

// Always assign to global so the singleton survives hot-reload in dev AND
// across serverless invocations in production (where globalThis persists
// within a single instance container).
globalThis.prisma = prisma;
globalThis.prismaDirect = prismaDirect;

export default prisma;
export { prismaDirect };
