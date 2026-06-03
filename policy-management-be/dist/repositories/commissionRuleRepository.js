"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commissionRuleRepository = void 0;
const prismaClient_1 = __importDefault(require("../utils/prismaClient"));
const client_1 = require("@prisma/client");
const AppError_1 = require("../utils/AppError");
exports.commissionRuleRepository = {
    findAll: async () => prismaClient_1.default.commissionRule.findMany(),
    findById: async (id) => prismaClient_1.default.commissionRule.findUnique({ where: { id } }),
    create: async (data) => prismaClient_1.default.commissionRule.create({ data }),
    update: async (id, data) => prismaClient_1.default.commissionRule.update({ where: { id }, data }),
    // New method for updating CommissionRule status
    updateCommissionRuleStatus: async (ruleId, isActive) => {
        try {
            return await prismaClient_1.default.commissionRule.update({
                where: { id: ruleId },
                data: { is_active: isActive },
            });
        }
        catch (err) {
            if (err.code === 'P2025') {
                throw new AppError_1.AppError(404, "ClientError", "Commission rule not found");
            }
            throw new AppError_1.AppError(500, "ServerError", "Error updating commission rule status", err);
        }
    },
    // New search and pagination method
    searchAndPaginate: async (params) => {
        const { search, policyStatus, deductibleType, ageCondition, page = 1, limit = 10 } = params;
        try {
            let whereConditions = {};
            // Handle search - primarily search by policy name
            if (search) {
                // First, try to find policy names that match the search
                const matchingPolicies = await prismaClient_1.default.policyName.findMany({
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
                }
                else {
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
                whereConditions.policyStatus = policyStatus;
            }
            if (deductibleType && deductibleType !== 'all') {
                whereConditions.deductibleType = deductibleType;
            }
            if (ageCondition && ageCondition !== 'all') {
                whereConditions.ageCondition = ageCondition;
            }
            // Calculate pagination
            const skip = (page - 1) * limit;
            // Get total count
            const total = await prismaClient_1.default.commissionRule.count({
                where: whereConditions,
            });
            // Get paginated data with policy name
            const data = await prismaClient_1.default.commissionRule.findMany({
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
        }
        catch (error) {
            console.error('Error in searchAndPaginate:', error);
            throw error;
        }
    },
    delete: async (id) => {
        try {
            const deleted = await prismaClient_1.default.commissionRule.delete({ where: { id } });
            return { success: true, data: deleted };
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
                return {
                    success: false,
                    error: 'Cannot delete commission rule because it is associated with other records.',
                };
            }
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
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
    updateCommissionRulesStatusByPolicyName: async (policyNameId, isActive) => {
        try {
            const result = await prismaClient_1.default.commissionRule.updateMany({
                where: { policy_name_id: policyNameId },
                data: { is_active: isActive },
            });
            return result;
        }
        catch (err) {
            if (err.code === 'P2025') {
                throw new AppError_1.AppError(404, "ClientError", "No commission rules found for this product");
            }
            throw new AppError_1.AppError(500, "ServerError", "Error updating commission rules status", err);
        }
    },
    // Find first active commission rule for a policy name (simplified lookup)
    findFirstByPolicyName: async (policyNameId) => {
        return prismaClient_1.default.commissionRule.findFirst({
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
    upsertByProduct: async (policyNameId, commissionPercent) => {
        const existing = await prismaClient_1.default.commissionRule.findFirst({
            where: { policy_name_id: policyNameId },
        });
        if (existing) {
            // Update all rules for this product with the new percentage
            await prismaClient_1.default.commissionRule.updateMany({
                where: { policy_name_id: policyNameId },
                data: { commissionPercent },
            });
            // Return the first updated rule
            return prismaClient_1.default.commissionRule.findFirst({
                where: { policy_name_id: policyNameId },
            });
        }
        // Create a default rule if none exists
        return prismaClient_1.default.commissionRule.create({
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
    // Get commission dashboard statistics - ULTRA-OPTIMIZED for sub-500ms performance
    getCommissionDashboardStats: async (timeRange) => {
        try {
            const now = new Date();
            let startDate;
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
            // ✅ ULTRA-OPTIMIZATION: Single raw SQL query with all aggregations
            const result = await prismaClient_1.default.$queryRaw `
        WITH 
        -- Get all commission data from journal (only leaf policies)
        journal_data AS (
          SELECT 
            cj.policy_id,
            cj."commissionAmount" as commission_amount,
            cj."calculatedAt" as calculated_at,
            p.company_id,
            p.policy_name_id,
            p.created_at as policy_created_at
          FROM "commission_journal" cj
          LEFT JOIN "policy" p ON cj.policy_id = p.id
          WHERE cj."calculatedAt" >= ${startDate}
            AND NOT EXISTS (
              SELECT 1 FROM "policy" child 
              WHERE child."parent_policy_id" = p.id
            )
        ),
        -- Get policies with calculated commission not in journal (only leaf policies)
        policy_commission AS (
          SELECT 
            p.id as policy_id,
            p."calculated_commission_amount" as commission_amount,
            p.created_at as calculated_at,
            p.company_id,
            p.policy_name_id,
            p.created_at as policy_created_at
          FROM "policy" p
          WHERE p.created_at >= ${startDate}
            AND p."calculated_commission_amount" > 0
            AND p.id NOT IN (SELECT DISTINCT policy_id FROM "commission_journal" WHERE "calculatedAt" >= ${startDate})
            AND NOT EXISTS (
              SELECT 1 FROM "policy" child 
              WHERE child."parent_policy_id" = p.id
            )
        ),
        -- Combine both sources
        all_commission AS (
          SELECT * FROM journal_data
          UNION ALL
          SELECT * FROM policy_commission
        ),
        -- Aggregate by company (only leaf policies)
        company_agg AS (
          SELECT 
            ac.company_id,
            COALESCE(c.name, 'Unknown') as company_name,
            SUM(ac.commission_amount) as total_commission,
            COUNT(DISTINCT ac.policy_id) as policy_count
          FROM all_commission ac
          LEFT JOIN "company" c ON ac.company_id = c.id
          WHERE ac.company_id IS NOT NULL
          GROUP BY ac.company_id, c.name
        ),
        -- Aggregate by policy name (only leaf policies)
        policy_name_agg AS (
          SELECT 
            ac.policy_name_id,
            COALESCE(pn.name, 'Unknown') as policy_name,
            SUM(ac.commission_amount) as total_commission,
            COUNT(DISTINCT ac.policy_id) as policy_count
          FROM all_commission ac
          LEFT JOIN "policy_names" pn ON ac.policy_name_id = pn.id
          WHERE ac.policy_name_id IS NOT NULL
          GROUP BY ac.policy_name_id, pn.name
        ),
        -- Aggregate by month
        monthly_agg AS (
          SELECT 
            TO_CHAR(ac.calculated_at, 'YYYY-MM') as month_key,
            SUM(ac.commission_amount) as total_commission,
            COUNT(DISTINCT ac.policy_id) as policy_count
          FROM all_commission ac
          GROUP BY TO_CHAR(ac.calculated_at, 'YYYY-MM')
          ORDER BY month_key
          LIMIT 12
        )
        SELECT 
          -- Total commission
          COALESCE(SUM(commission_amount), 0) as total_commission,
          COUNT(DISTINCT policy_id) as total_policies,
          -- Commission by company (JSON)
          (
            SELECT json_agg(json_build_object(
              'companyId', company_id,
              'companyName', company_name,
              'totalCommission', total_commission,
              'policyCount', policy_count
            ))
            FROM company_agg
          ) as commission_by_company,
          -- Commission by policy name (JSON)
          (
            SELECT json_agg(json_build_object(
              'policyNameId', policy_name_id,
              'policyName', policy_name,
              'totalCommission', total_commission,
              'policyCount', policy_count
            ))
            FROM policy_name_agg
          ) as commission_by_policy_name,
          -- Monthly commission (JSON)
          (
            SELECT json_agg(json_build_object(
              'month', month_key,
              'total_commission', total_commission,
              'policy_count', policy_count
            ))
            FROM monthly_agg
          ) as monthly_commission
        FROM all_commission
      `;
            // Parse the result
            const row = result[0];
            // Count unique products and companies from the aggregated data
            const productsCount = row.commission_by_policy_name ? row.commission_by_policy_name.length : 0;
            const companiesCount = row.commission_by_company ? row.commission_by_company.length : 0;
            return {
                totalCommission: Number(row.total_commission) || 0,
                totalPolicies: Number(row.total_policies) || 0,
                productsCount,
                companiesCount,
                commissionByCompany: row.commission_by_company || [],
                commissionByPolicyName: row.commission_by_policy_name || [],
                monthlyCommission: row.monthly_commission || [],
                timeRange,
            };
        }
        catch (error) {
            console.error('Error in getCommissionDashboardStats:', error);
            throw new AppError_1.AppError(500, "ServerError", "Error fetching commission dashboard statistics", error);
        }
    },
};
