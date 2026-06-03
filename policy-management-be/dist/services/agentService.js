"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.agentService = {
    // Create a new agent
    async createAgent(data) {
        return prisma.agent.create({ data });
    },
    // Get all agents
    async getAllAgents() {
        return prisma.agent.findMany({ orderBy: { createdAt: 'desc' } });
    },
    // Get agent by ID
    async getAgentById(id) {
        return prisma.agent.findUnique({ where: { id } });
    },
    // Update agent
    async updateAgent(id, data) {
        return prisma.agent.update({ where: { id }, data });
    },
    // Delete agent
    async deleteAgent(id) {
        return prisma.agent.delete({ where: { id } });
    },
};
