"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commissionService = void 0;
const prismaClient_1 = __importDefault(require("../utils/prismaClient"));
exports.commissionService = {
    // Create a new commission
    async createCommission(data) {
        return prismaClient_1.default.commission.create({ data });
    },
    // Get all commissions
    async getAllCommissions() {
        return prismaClient_1.default.commission.findMany({ orderBy: { createdAt: 'desc' } });
    },
    // Get commission by ID
    async getCommissionById(id) {
        return prismaClient_1.default.commission.findUnique({ where: { id } });
    },
    // Update commission
    async updateCommission(id, data) {
        return prismaClient_1.default.commission.update({ where: { id }, data });
    },
    // Delete commission
    async deleteCommission(id) {
        return prismaClient_1.default.commission.delete({ where: { id } });
    },
};
