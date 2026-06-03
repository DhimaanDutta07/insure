"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commissionRepository = void 0;
const prismaClient_1 = __importDefault(require("../utils/prismaClient"));
const client_1 = require("@prisma/client");
exports.commissionRepository = {
    findAll: async () => prismaClient_1.default.commission.findMany(),
    findById: async (id) => prismaClient_1.default.commission.findUnique({ where: { id } }),
    create: async (data) => prismaClient_1.default.commission.create({ data }),
    update: async (id, data) => prismaClient_1.default.commission.update({ where: { id }, data }),
    delete: async (id) => {
        try {
            const deletedCommission = await prismaClient_1.default.commission.delete({
                where: { id },
            });
            return { success: true, data: deletedCommission };
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
                return {
                    success: false,
                    error: 'Cannot delete commission because it is associated with one or more revenues.',
                };
            }
            // Handle other potential errors (e.g., record not found)
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                return {
                    success: false,
                    error: 'Commission not found.',
                };
            }
            // Log unexpected errors and throw them to be handled by higher layers if needed
            console.error('Unexpected error deleting commission:', error);
            throw error; // Or return a generic error: { success: false, error: 'An unexpected error occurred.' }
        }
    },
};
