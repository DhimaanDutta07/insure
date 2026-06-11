"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentService = void 0;
const prismaClient_1 = __importDefault(require("../utils/prismaClient"));
exports.agentService = {
    // Create a new agent
    async createAgent(data) {
        return prismaClient_1.default.agent.create({ data });
    },
    // Get all agents
    async getAllAgents() {
        return prismaClient_1.default.agent.findMany({ orderBy: { createdAt: 'desc' } });
    },
    // Get agent by ID
    async getAgentById(id) {
        return prismaClient_1.default.agent.findUnique({ where: { id } });
    },
    // Update agent
    async updateAgent(id, data) {
        return prismaClient_1.default.agent.update({ where: { id }, data });
    },
    // Delete agent
    async deleteAgent(id) {
        return prismaClient_1.default.agent.delete({ where: { id } });
    },
};
