"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
if (process.env.NODE_ENV !== 'PRODUCTION') {
    globalThis.prisma = prisma;
}
exports.default = prisma;
