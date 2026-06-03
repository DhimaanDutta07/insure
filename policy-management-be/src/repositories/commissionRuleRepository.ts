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

  // Find first active commission rule for a policy name (simplified lookup)
  findFirstByPolicyName: async (policyNameId: string) => {
    return prisma.commissionRule.findFirst({
      where: {
        policy_name_id: policyNameId,
        is_active: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  // Upsert a commission rule for a product (simplified - uses defaults for other fields)
  upsertByProduct: async (policyNameId: string, commissionPercent: number) => {
    const existing = await prisma.commissionRule.findFirst({
      where: { policy_name_id: policyNameId },
    });

    if (existing) {
      // Update all rules for this product with the new percentage
      await prisma.commissionRule.updateMany({
        where: { policy_name_id: policyNameId },
        data: { commissionPercent },
      });
      // Return the first updated rule
      return prisma.commissionRule.findFirst({
        where: { policy_name_id: policyNameId },
      });
    }

    // Create a default rule if none exists
    return prisma.commissionRule.create({
      data: {
        policy_name_id: policyNameId,
        policyStatus: 'Fresh',
        deductibleType: 'ALL_SI',
        ageCondition: 'LESS_THAN_60',
        commissionPercent,
        is_active: true,
      },
    });
  },

  // Get commission dashboard statistics
  getCommissionDashboardStats: async (timeRange: string) => {
    try {
      const now = new Date();
      let startDate: Date;

      // Set date range based on timeRange parameter
      switch (timeRange) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0); // Beginning of time
      }

      // Get total commission amount from CommissionJournal
      const totalCommission = await prisma.commissionJournal.aggregate({
        where: {
          calculatedAt: { gte: startDate },
        },
        _sum: {
          commissionAmount: true,
        },
      });

      // Get total policies with commission from CommissionJournal
      const totalPoliciesWithCommission = await prisma.commissionJournal.count({
        where: {
          calculatedAt: { gte: startDate },
        },
      });

      // Get commission by company from CommissionJournal joined with Policy
      const commissionByCompany = await prisma.commissionJournal.groupBy({
        by: ['policy_id'],
        where: {
          calculatedAt: { gte: startDate },
        },
        _sum: {
          commissionAmount: true,
        },
        _count: {
          id: true,
        },
      });

      // Get company names from policies
      const policyIds = commissionByCompany.map((c: any) => c.policy_id).filter((id: any): id is string => id !== null);
      const policiesForCompany = await prisma.policy.findMany({
        where: { id: { in: policyIds } },
        select: { id: true, company_id: true },
      });

      const policyCompanyMap = new Map(policiesForCompany.map(p => [p.id, p.company_id]));
      const companyIds = Array.from(new Set(policiesForCompany.map(p => p.company_id).filter((id): id is string => id !== null)));
      const companies = await prisma.company.findMany({
        where: { id: { in: companyIds } },
        select: { id: true, name: true },
      });

      const companyMap = new Map(companies.map(c => [c.id, c.name]));

      // Aggregate commission by company
      const companyCommissionMap = new Map<string, { totalCommission: number; policyCount: number }>();
      for (const entry of commissionByCompany) {
        const companyId = policyCompanyMap.get(entry.policy_id);
        if (!companyId) continue;

        if (!companyCommissionMap.has(companyId)) {
          companyCommissionMap.set(companyId, { totalCommission: 0, policyCount: 0 });
        }
        const current = companyCommissionMap.get(companyId)!;
        current.totalCommission += entry._sum.commissionAmount || 0;
        current.policyCount += entry._count.id;
      }

      // Get commission by policy name from CommissionJournal joined with Policy
      const commissionByPolicyName = await prisma.commissionJournal.groupBy({
        by: ['policy_id'],
        where: {
          calculatedAt: { gte: startDate },
        },
        _sum: {
          commissionAmount: true,
        },
        _count: {
          id: true,
        },
      });

      // Get policy names from policies
      const policyIdsForName = commissionByPolicyName.map((p: any) => p.policy_id).filter((id: any): id is string => id !== null);
      const policiesForName = await prisma.policy.findMany({
        where: { id: { in: policyIdsForName } },
        select: { id: true, policy_name_id: true },
      });

      const policyNameIds = Array.from(new Set(policiesForName.map((p: any) => p.policy_name_id).filter((id: any): id is string => id !== null)));
      const policyNames = await prisma.policyName.findMany({
        where: { id: { in: policyNameIds } },
        select: { id: true, name: true },
      });

      const policyNameMap = new Map(policyNames.map((p: any) => [p.id, p.name]));

      // Aggregate commission by policy name
      const policyNameCommissionMap = new Map<string, { totalCommission: number; policyCount: number }>();
      for (const entry of commissionByPolicyName) {
        const policy = policiesForName.find((p: any) => p.id === entry.policy_id);
        if (!policy?.policy_name_id) continue;

        if (!policyNameCommissionMap.has(policy.policy_name_id)) {
          policyNameCommissionMap.set(policy.policy_name_id, { totalCommission: 0, policyCount: 0 });
        }
        const current = policyNameCommissionMap.get(policy.policy_name_id)!;
        current.totalCommission += entry._sum.commissionAmount || 0;
        current.policyCount += entry._count.id;
      }

      // Get monthly commission trends from CommissionJournal
      const journalEntries = await prisma.commissionJournal.findMany({
        where: {
          calculatedAt: { gte: startDate },
        },
        select: {
          calculatedAt: true,
          commissionAmount: true,
        },
        orderBy: {
          calculatedAt: 'desc',
        },
      });

      // Group by month manually
      const monthlyMap = new Map<string, { total_commission: number; policy_count: number }>();

      for (const entry of journalEntries) {
        if (!entry.calculatedAt) continue;

        const date = new Date(entry.calculatedAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, { total_commission: 0, policy_count: 0 });
        }

        const current = monthlyMap.get(monthKey)!;
        current.total_commission += Number(entry.commissionAmount || 0);
        current.policy_count += 1;
      }

      const monthlyCommission = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({
          month,
          total_commission: data.total_commission,
          policy_count: data.policy_count,
        }))
        .slice(0, 12);

      return {
        totalCommission: totalCommission._sum.commissionAmount || 0,
        totalPolicies: totalPoliciesWithCommission,
        commissionByCompany: Array.from(companyCommissionMap.entries()).map(([companyId, data]) => ({
          companyId,
          companyName: companyMap.get(companyId) || 'Unknown',
          totalCommission: data.totalCommission,
          policyCount: data.policyCount,
        })),
        commissionByPolicyName: Array.from(policyNameCommissionMap.entries()).map(([policyNameId, data]) => ({
          policyNameId,
          policyName: policyNameMap.get(policyNameId) || 'Unknown',
          totalCommission: data.totalCommission,
          policyCount: data.policyCount,
        })),
        monthlyCommission: monthlyCommission,
        timeRange,
      };
    } catch (error) {
      console.error('Error in getCommissionDashboardStats:', error);
      throw new AppError(500, "ServerError", "Error fetching commission dashboard statistics", error);
    }
  },
};
