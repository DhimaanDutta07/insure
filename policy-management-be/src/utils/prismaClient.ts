//src/utils/prismaClient.ts
import { PrismaClient } from '@prisma/client';

declare global {
    var prisma: PrismaClient;
}

const prisma = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'PRODUCTION') {
    globalThis.prisma = prisma;
}

export default prisma;
