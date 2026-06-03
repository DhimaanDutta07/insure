"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commissionService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.commissionService = {
    // Create a new commission
    async createCommission(data) {
        return prisma.commission.create({ data });
    },
    // Get all commissions
    async getAllCommissions() {
        return prisma.commission.findMany({ orderBy: { createdAt: 'desc' } });
    },
    // Get commission by ID
    async getCommissionById(id) {
        return prisma.commission.findUnique({ where: { id } });
    },
    // Update commission
    async updateCommission(id, data) {
        return prisma.commission.update({ where: { id }, data });
    },
    // Delete commission
    async deleteCommission(id) {
        return prisma.commission.delete({ where: { id } });
    },
};
