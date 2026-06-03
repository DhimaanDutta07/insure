"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAgent = exports.updateAgent = exports.getAgentById = exports.getAllAgents = exports.createAgent = void 0;
const prismaClient_1 = __importDefault(require("../utils/prismaClient"));
// export const agentRepository = {
//   findAll: async () => prisma.agent.findMany(),
//   findById: async (id: string) => prisma.agent.findUnique({ where: { id } }),
//   create: async (data: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>) => 
//     prisma.agent.create({ data }),
//   update: async (id: string, data: Partial<Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>>) => 
//     prisma.agent.update({ where: { id }, data }),
//   delete: async (id: string) => prisma.agent.delete({ where: { id } }),
// };
const createAgent = async (data) => {
    return prismaClient_1.default.agent.create({ data });
};
exports.createAgent = createAgent;
const getAllAgents = async () => {
    return prismaClient_1.default.agent.findMany();
};
exports.getAllAgents = getAllAgents;
const getAgentById = async (id) => {
    return prismaClient_1.default.agent.findUnique({ where: { id } });
};
exports.getAgentById = getAgentById;
const updateAgent = async (id, data) => {
    return prismaClient_1.default.agent.update({ where: { id }, data });
};
exports.updateAgent = updateAgent;
const deleteAgent = async (id) => {
    return prismaClient_1.default.agent.delete({ where: { id } });
};
exports.deleteAgent = deleteAgent;
