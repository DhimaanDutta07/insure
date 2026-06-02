import { PrismaClient, Agent } from '@prisma/client';

const prisma = new PrismaClient();

export const agentService = {
  // Create a new agent
  async createAgent(data: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>): Promise<Agent> {
    return prisma.agent.create({ data });
  },

  // Get all agents
  async getAllAgents(): Promise<Agent[]> {
    return prisma.agent.findMany({ orderBy: { createdAt: 'desc' } });
  },

  // Get agent by ID
  async getAgentById(id: string): Promise<Agent | null> {
    return prisma.agent.findUnique({ where: { id } });
  },

  // Update agent
  async updateAgent(id: string, data: Partial<Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Agent> {
    return prisma.agent.update({ where: { id }, data });
  },

  // Delete agent
  async deleteAgent(id: string): Promise<Agent> {
    return prisma.agent.delete({ where: { id } });
  },
};