"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePolicyName = exports.updatePolicyName = exports.getPolicyNameById = exports.getPolicyNamesByGroupId = exports.createPolicyName = exports.deletePolicyGroup = exports.updatePolicyGroup = exports.getPolicyGroupById = exports.getAllPolicyNames = exports.getAllPolicyGroups = exports.createPolicyGroup = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createPolicyGroup = async (data) => {
    return prisma.policyGroup.create({ data });
};
exports.createPolicyGroup = createPolicyGroup;
const getAllPolicyGroups = async () => {
    return prisma.policyGroup.findMany({
        where: { is_deleted: false },
        include: {
            itemNames: {
                where: { is_deleted: false },
                select: { id: true, name: true, description: true, created_at: true, updated_at: true },
            },
        },
    });
};
exports.getAllPolicyGroups = getAllPolicyGroups;
const getAllPolicyNames = async () => {
    const results = await prisma.policyName.findMany({
        where: { is_deleted: false },
        include: {
            policyGroup: {
                select: { id: true, name: true, description: true, created_at: true, updated_at: true },
            },
        },
    });
    // Filter out null policyGroup and return proper typed objects
    return results
        .filter((item) => item.policyGroup !== null)
        .map((item) => {
        const pg = item.policyGroup;
        return {
            ...item,
            policyGroup: {
                id: pg.id,
                name: pg.name,
                description: pg.description,
                created_at: pg.created_at,
                updated_at: pg.updated_at,
            },
        };
    });
};
exports.getAllPolicyNames = getAllPolicyNames;
// Use findFirst when filtering by multiple conditions including is_deleted
const getPolicyGroupById = async (id) => {
    return prisma.policyGroup.findFirst({
        where: { id, is_deleted: false },
    });
};
exports.getPolicyGroupById = getPolicyGroupById;
const updatePolicyGroup = async (id, data) => {
    return prisma.policyGroup.update({
        where: { id },
        data,
    });
};
exports.updatePolicyGroup = updatePolicyGroup;
const deletePolicyGroup = async (id) => {
    return prisma.policyGroup.update({
        where: { id },
        data: { is_deleted: true },
    });
};
exports.deletePolicyGroup = deletePolicyGroup;
const createPolicyName = async (data) => {
    return prisma.policyName.create({ data });
};
exports.createPolicyName = createPolicyName;
const getPolicyNamesByGroupId = async (policyGroupId) => {
    const results = await prisma.policyName.findMany({
        where: { policy_group_id: policyGroupId, is_deleted: false },
        include: {
            policyGroup: {
                select: { id: true, name: true, description: true, created_at: true, updated_at: true },
            },
        },
    });
    return results
        .filter(item => item.policyGroup !== null)
        .map(item => {
        const pg = item.policyGroup;
        return {
            ...item,
            policyGroup: {
                id: pg.id,
                name: pg.name,
                description: pg.description,
                created_at: pg.created_at,
                updated_at: pg.updated_at,
            },
        };
    });
};
exports.getPolicyNamesByGroupId = getPolicyNamesByGroupId;
// Use findFirst when filtering by multiple conditions including is_deleted
const getPolicyNameById = async (id) => {
    return prisma.policyName.findFirst({
        where: { id, is_deleted: false },
    });
};
exports.getPolicyNameById = getPolicyNameById;
const updatePolicyName = async (id, data) => {
    return prisma.policyName.update({
        where: { id },
        data,
    });
};
exports.updatePolicyName = updatePolicyName;
const deletePolicyName = async (id) => {
    return prisma.policyName.update({
        where: { id },
        data: { is_deleted: true },
    });
};
exports.deletePolicyName = deletePolicyName;
