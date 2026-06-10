"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaDirect = void 0;
//src/utils/prismaClient.ts
const client_1 = require("@prisma/client");
const prisma = globalThis.prisma || new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});
// Create a separate client for seeding that uses direct connection to avoid pool timeout
exports.prismaDirect = new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
        db: {
            url: process.env.DIRECT_URL || process.env.DATABASE_URL,
        },
    },
});
if (process.env.NODE_ENV !== 'PRODUCTION') {
    globalThis.prisma = prisma;
}
exports.default = prisma;
