import prisma from '../utils/prismaClient';
import { Prisma, Commission } from '@prisma/client';

type DeleteResult =
  | { success: true; data: Commission }
  | { success: false; error: string };
export const commissionRepository = {
  findAll: async () => prisma.commission.findMany(),
  findById: async (id: string) => prisma.commission.findUnique({ where: { id }}
  ),
  create: async (data: Omit<Commission, 'id' | 'createdAt' | 'updatedAt'>) => 
    prisma.commission.create({ data }),
  update: async (id: string, data: Partial<Omit<Commission, 'id' | 'createdAt' | 'updatedAt'>>) => 
    prisma.commission.update({ where: { id }, data }),
  delete: async (id: string): Promise<DeleteResult> => {
    try {
      const deletedCommission = await prisma.commission.delete({
        where: { id },
      });
      return { success: true, data: deletedCommission };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        return {
          success: false,
          error: 'Cannot delete commission because it is associated with one or more revenues.',
        };
      }
      // Handle other potential errors (e.g., record not found)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return {
          success: false,
          error: 'Commission not found.',
        };
      }
      // Log unexpected errors and throw them to be handled by higher layers if needed
      console.error('Unexpected error deleting commission:', error);
      throw error; // Or return a generic error: { success: false, error: 'An unexpected error occurred.' }
    }
  },
};