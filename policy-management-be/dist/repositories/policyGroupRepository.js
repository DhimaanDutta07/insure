"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePolicyName = exports.updatePolicyName = exports.getPolicyNameById = exports.getPolicyNamesByGroupId = exports.createPolicyName = exports.deletePolicyGroup = exports.updatePolicyGroup = exports.getPolicyGroupById = exports.getAllPolicyNames = exports.getAllPolicyGroups = exports.createPolicyGroup = void 0;
const prismaClient_1 = __importDefault(require("../utils/prismaClient"));
const createPolicyGroup = async (data) => {
    return prismaClient_1.default.policyGroup.create({ data });
};
exports.createPolicyGroup = createPolicyGroup;
const getAllPolicyGroups = async () => {
    return prismaClient_1.default.policyGroup.findMany({
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
    const results = await prismaClient_1.default.policyName.findMany({
        where: { is_deleted: false },
        include: {
            policyGroup: {
                select: { id: true, name: true, description: true, created_at: true, updated_at: true },
            },
            company: {
                select: { id: true, name: true },
            },
        },
    });
    // Return all results, including those without policyGroup
    // Flatten company data to include company_id directly for frontend compatibility
    return results.map((item) => ({
        ...item,
        company_id: item.company_id, // Ensure company_id is present
        policyGroup: item.policyGroup ? {
            id: item.policyGroup.id,
            name: item.policyGroup.name,
            description: item.policyGroup.description,
            created_at: item.policyGroup.created_at,
            updated_at: item.policyGroup.updated_at,
        } : null,
        company: item.company ? {
            id: item.company.id,
            name: item.company.name,
        } : null,
    }));
};
exports.getAllPolicyNames = getAllPolicyNames;
// Use findFirst when filtering by multiple conditions including is_deleted
const getPolicyGroupById = async (id) => {
    return prismaClient_1.default.policyGroup.findFirst({
        where: { id, is_deleted: false },
    });
};
exports.getPolicyGroupById = getPolicyGroupById;
const updatePolicyGroup = async (id, data) => {
    return prismaClient_1.default.policyGroup.update({
        where: { id },
        data,
    });
};
exports.updatePolicyGroup = updatePolicyGroup;
const deletePolicyGroup = async (id) => {
    return prismaClient_1.default.policyGroup.update({
        where: { id },
        data: { is_deleted: true },
    });
};
exports.deletePolicyGroup = deletePolicyGroup;
const createPolicyName = async (data) => {
    return prismaClient_1.default.policyName.create({ data });
};
exports.createPolicyName = createPolicyName;
const getPolicyNamesByGroupId = async (policyGroupId) => {
    const results = await prismaClient_1.default.policyName.findMany({
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
    return prismaClient_1.default.policyName.findFirst({
        where: { id, is_deleted: false },
    });
};
exports.getPolicyNameById = getPolicyNameById;
const updatePolicyName = async (id, data) => {
    return prismaClient_1.default.policyName.update({
        where: { id },
        data,
    });
};
exports.updatePolicyName = updatePolicyName;
const deletePolicyName = async (id) => {
    return prismaClient_1.default.policyName.update({
        where: { id },
        data: { is_deleted: true },
    });
};
exports.deletePolicyName = deletePolicyName;
