import { PrismaClient, Commission } from '@prisma/client';

const prisma = new PrismaClient();

export const commissionService = {
  // Create a new commission
  async createCommission(data: Omit<Commission, 'id' | 'createdAt' | 'updatedAt'>): Promise<Commission> {
    return prisma.commission.create({ data });
  },

  // Get all commissions
  async getAllCommissions(): Promise<Commission[]> {
    return prisma.commission.findMany({ orderBy: { createdAt: 'desc' } });
  },

  // Get commission by ID
  async getCommissionById(id: string): Promise<Commission | null> {
    return prisma.commission.findUnique({ where: { id } });
  },

  // Update commission
  async updateCommission(id: string, data: Partial<Omit<Commission, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Commission> {
    return prisma.commission.update({ where: { id }, data });
  },

  // Delete commission
  async deleteCommission(id: string): Promise<Commission> {
    return prisma.commission.delete({ where: { id } });
  },
}; 