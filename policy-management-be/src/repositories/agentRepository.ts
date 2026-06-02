import prisma from '../utils/prismaClient';
import { Agent } from '@prisma/client';

// export const agentRepository = {
//   findAll: async () => prisma.agent.findMany(),
//   findById: async (id: string) => prisma.agent.findUnique({ where: { id } }),
//   create: async (data: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>) => 
//     prisma.agent.create({ data }),
//   update: async (id: string, data: Partial<Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>>) => 
//     prisma.agent.update({ where: { id }, data }),
//   delete: async (id: string) => prisma.agent.delete({ where: { id } }),
// };
export const createAgent = async (data: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>): Promise<Agent> => {
    return prisma.agent.create({ data });
  };
  
  export const getAllAgents = async (): Promise<Agent[]> => {
    return prisma.agent.findMany();
  };
  
  export const getAgentById = async (id: string): Promise<Agent | null> => {
    return prisma.agent.findUnique({ where: { id } });
  };
  
  export const updateAgent = async (id: string, data: Partial<Agent>): Promise<Agent> => {
    return prisma.agent.update({ where: { id }, data });
  };
  
  export const deleteAgent = async (id: string): Promise<Agent> => {
    return prisma.agent.delete({ where: { id } });
  };