import prisma from '../utils/prismaClient';
import { Prisma, CommissionRule } from '@prisma/client';
import { AppError } from '../utils/AppError';

type DeleteResult =
  | { success: true; data: CommissionRule }
  | { success: false; error: string };

type SearchParams = {
  search?: string;
  policyStatus?: string;
  deductibleType?: string;
  ageCondition?: string;
  page?: number;
  limit?: number;
};

type PaginatedResult = {
  data: CommissionRule[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export const commissionRuleRepository = {
  findAll: async () => prisma.commissionRule.findMany(),
  
  findById: async (id: string) => prisma.commissionRule.findUnique({ where: { id } }),
  
  create: async (data: Omit<CommissionRule, 'id' | 'createdAt' | 'updatedAt'>) =>
    prisma.commissionRule.create({ data }),
    
  update: async (id: string, data: Partial<Omit<CommissionRule, 'id' | 'createdAt' | 'updatedAt'>>) =>
    prisma.commissionRule.update({ where: { id }, data }),
    
  // New method for updating CommissionRule status
  updateCommissionRuleStatus: async (ruleId: string, isActive: boolean): Promise<CommissionRule> => {
    try {
      return await prisma.commissionRule.update({
        where: { id: ruleId },
        data: { is_active: isActive },
      });
    } catch (err) {
      if ((err as any).code === 'P2025') {
        throw new AppError(404, "ClientError", "Commission rule not found");
      }
      throw new AppError(500, "ServerError", "Error updating commission rule status", err);
    }
  },
    
  // New search and pagination method
  searchAndPaginate: async (params: SearchParams): Promise<PaginatedResult> => {
    const { search, policyStatus, deductibleType, ageCondition, page = 1, limit = 10 } = params;
    
    try {
      let whereConditions: Prisma.CommissionRuleWhereInput = {};
      
      // Handle search - primarily search by policy name
      if (search) {
        // First, try to find policy names that match the search
        const matchingPolicies = await prisma.policyName.findMany({
          where: {
            name: {
              contains: search,
            },
          },
          select: {
            id: true,
          },
        });
        
        if (matchingPolicies.length > 0) {
          // Use the found policy IDs
          whereConditions.policy_name_id = {
            in: matchingPolicies.map(p => p.id),
          };
        } else {
          // If no policies found, return empty result
          return {
            data: [],
            total: 0,
            page,
            limit,
            totalPages: 0,
          };
        }
      }
      
      // Handle specific filters
      if (policyStatus && policyStatus !== 'all') {
        whereConditions.policyStatus = policyStatus as any;
      }
      
      if (deductibleType && deductibleType !== 'all') {
        whereConditions.deductibleType = deductibleType as any;
      }
      
      if (ageCondition && ageCondition !== 'all') {
        whereConditions.ageCondition = ageCondition as any;
      }
      
      // Calculate pagination
      const skip = (page - 1) * limit;
      
      // Get total count
      const total = await prisma.commissionRule.count({
        where: whereConditions,
      });
      
      // Get paginated data with policy name
      const data = await prisma.commissionRule.findMany({
        where: whereConditions,
        include: {
          policyName: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      const totalPages = Math.ceil(total / limit);
      
      return {
        data,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      console.error('Error in searchAndPaginate:', error);
      throw error;
    }
  },
  
  delete: async (id: string): Promise<DeleteResult> => {
    try {
      const deleted = await prisma.commissionRule.delete({ where: { id } });
      return { success: true, data: deleted };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        return {
          success: false,
          error: 'Cannot delete commission rule because it is associated with other records.',
        };
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return {
          success: false,
          error: 'Commission rule not found.',
        };
      }
      console.error('Unexpected error deleting commission rule:', error);
      throw error;
    }
  },

  // Bulk update is_active for all rules by policy_name_id
  updateCommissionRulesStatusByPolicyName: async (policyNameId: string, isActive: boolean) => {
    try {
      const result = await prisma.commissionRule.updateMany({
        where: { policy_name_id: policyNameId },
        data: { is_active: isActive },
      });
      return result;
    } catch (err) {
      if ((err as any).code === 'P2025') {
        throw new AppError(404, "ClientError", "No commission rules found for this product");
      }
      throw new AppError(500, "ServerError", "Error updating commission rules status", err);
    }
  },
};
