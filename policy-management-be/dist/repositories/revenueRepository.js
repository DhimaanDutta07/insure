"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findRevenuesByTimePeriod = findRevenuesByTimePeriod;
exports.createRevenue = createRevenue;
exports.updateRevenue = updateRevenue;
exports.softDeleteRevenue = softDeleteRevenue;
exports.getRevenueById = getRevenueById;
exports.getAllRevenues = getAllRevenues;
const prismaClient_1 = __importDefault(require("../utils/prismaClient"));
async function findRevenuesByTimePeriod(siteId, period) {
    const today = new Date();
    let startDate, endDate;
    switch (period) {
        case 'last3Days':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 3);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(today);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'thisWeek':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - today.getDay());
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(today);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'thisMonth':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(today);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'lastMonth':
            startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(today.getFullYear(), today.getMonth(), 0);
            endDate.setHours(23, 59, 59, 999);
            break;
        default:
            throw new Error("Invalid time period");
    }
    return prismaClient_1.default.revenue.findMany({
        where: {
            isDeleted: false,
            createdAt: {
                gte: startDate,
                lte: endDate
            },
            ...(siteId ? { siteId } : {}),
        },
        include: {
            policy: true,
            agent: true,
            commission: true,
        },
    });
}
async function createRevenue(data) {
    return prismaClient_1.default.revenue.create({ data });
}
async function updateRevenue(id, data) {
    return prismaClient_1.default.revenue.update({ where: { id }, data });
}
async function softDeleteRevenue(id) {
    return prismaClient_1.default.revenue.update({ where: { id }, data: { isDeleted: true } });
}
async function getRevenueById(id) {
    return prismaClient_1.default.revenue.findUnique({ where: { id } });
}
async function getAllRevenues() {
    return prismaClient_1.default.revenue.findMany({ where: { isDeleted: false } });
}
