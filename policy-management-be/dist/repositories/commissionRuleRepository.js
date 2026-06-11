"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commissionRuleRepository = void 0;
const prismaClient_1 = __importDefault(require("../utils/prismaClient"));
const client_1 = require("@prisma/client");
const AppError_1 = require("../utils/AppError");
const lruCache_1 = require("../utils/lruCache");
exports.commissionRuleRepository = {
    findAll: async (limit = 100) => prismaClient_1.default.commissionRule.findMany({ take: limit, orderBy: { createdAt: 'desc' } }),
    // Fast duplicate check using composite fields
    findByCompositeKey: async (params) => {
        return prismaClient_1.default.commissionRule.findFirst({
            where: {
                policy_name_id: params.policy_name_id,
                policyStatus: params.policyStatus,
                deductibleType: params.deductibleType,
                ageCondition: params.ageCondition,
                ...(params.productType !== undefined && { productType: params.productType }),
                ...(params.siCondition !== undefined && { siCondition: params.siCondition }),
            },
        });
    },
    findById: async (id) => prismaClient_1.default.commissionRule.findUnique({ where: { id } }),
    create: async (data) => prismaClient_1.default.commissionRule.create({ data }),
    update: async (id, data) => {
        const result = await prismaClient_1.default.commissionRule.update({ where: { id }, data });
        // Invalidate cache when rule is updated
        lruCache_1.commissionStatsCache.deleteByPrefix('commissionRules');
        return result;
    },
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
    // New search and pagination method - OPTIMIZED with inline search
    searchAndPaginate: async (params) => {
        const { search, policyStatus, deductibleType, ageCondition, productType, siCondition, page = 1, limit = 10 } = params;
        try {
            const whereClauses = [];
            if (search) {
                whereClauses.push(client_1.Prisma.sql `pn.name ILIKE ${'%' + search + '%'}`);
            }
            if (policyStatus && policyStatus !== 'all') {
                whereClauses.push(client_1.Prisma.sql `cr."policyStatus" = ${policyStatus}`);
            }
            if (deductibleType && deductibleType !== 'all') {
                whereClauses.push(client_1.Prisma.sql `cr."deductibleType" = ${deductibleType}`);
            }
            if (ageCondition && ageCondition !== 'all') {
                whereClauses.push(client_1.Prisma.sql `cr."ageCondition" = ${ageCondition}`);
            }
            if (productType && productType !== 'all') {
                whereClauses.push(client_1.Prisma.sql `cr."productType" = ${productType}`);
            }
            if (siCondition && siCondition !== 'all') {
                whereClauses.push(client_1.Prisma.sql `cr."siCondition" = ${siCondition}`);
            }
            const whereSql = whereClauses.length > 0 ? client_1.Prisma.sql `WHERE ${client_1.Prisma.join(whereClauses, ' AND ')}` : client_1.Prisma.sql ``;
            const skip = (page - 1) * limit;
            const [dataRows, countRows] = await Promise.all([
                prismaClient_1.default.$queryRaw `
          SELECT cr.*, pn.id as "policyName.id", pn.name as "policyName.name"
          FROM "commission_rules" cr
          LEFT JOIN "policy_names" pn ON cr."policy_name_id" = pn.id
          ${whereSql}
          ORDER BY cr."createdAt" DESC
          LIMIT ${limit} OFFSET ${skip}
        `,
                prismaClient_1.default.$queryRaw `
          SELECT COUNT(*)::int as total
          FROM "commission_rules" cr
          LEFT JOIN "policy_names" pn ON cr."policy_name_id" = pn.id
          ${whereSql}
        `,
            ]);
            const data = dataRows.map((row) => ({
                ...row,
                policyName: row['policyName.name'] ? { id: row['policyName.id'], name: row['policyName.name'] } : null,
            }));
            const total = Number(countRows[0]?.total) || 0;
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
            console.log('[Repository] Deleting commission rule with id:', id);
            const deleted = await prismaClient_1.default.commissionRule.delete({ where: { id } });
            console.log('[Repository] Successfully deleted rule:', deleted.id);
            // Invalidate cache when rule is deleted
            lruCache_1.commissionStatsCache.deleteByPrefix('commissionRules');
            return { success: true, data: deleted };
        }
        catch (error) {
            console.error('[Repository] Error deleting commission rule:', error);
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
    // Upsert a commission rule for a product with optional sub-classifications
    upsertByProduct: async (policyNameId, commissionPercent, productType, policyStatus, siCondition) => {
        const whereClause = { policy_name_id: policyNameId };
        if (productType !== undefined && productType !== null && productType !== '')
            whereClause.productType = productType;
        if (policyStatus !== undefined && policyStatus !== null && policyStatus !== '')
            whereClause.policyStatus = policyStatus;
        // Only add siCondition to whereClause if it's explicitly provided (not empty string)
        if (siCondition !== undefined && siCondition !== null && siCondition !== '')
            whereClause.siCondition = siCondition;
        console.log('[Upsert] Where clause:', whereClause);
        const existing = await prismaClient_1.default.commissionRule.findFirst({
            where: whereClause,
        });
        if (existing) {
            // Update the specific rule
            const result = await prismaClient_1.default.commissionRule.update({
                where: { id: existing.id },
                data: { commissionPercent },
            });
            console.log('[Upsert] Updated existing rule:', { id: existing.id, newPercent: commissionPercent });
            // Invalidate cache
            lruCache_1.commissionStatsCache.deleteByPrefix('commissionRules');
            return result;
        }
        // Create a new rule with the specified parameters or defaults
        const result = await prismaClient_1.default.commissionRule.create({
            data: {
                policy_name_id: policyNameId,
                policyStatus: (policyStatus && policyStatus !== '' ? policyStatus : 'Fresh'),
                deductibleType: 'ALL_SI',
                ageCondition: 'LESS_THAN_60',
                commissionPercent,
                productType: (productType && productType !== '' ? productType : null),
                siCondition: (siCondition && siCondition !== '' ? siCondition : null),
                is_active: true,
            },
        });
        console.log('[Upsert] Created new rule:', { id: result.id, percent: commissionPercent });
        // Invalidate cache
        lruCache_1.commissionStatsCache.deleteByPrefix('commissionRules');
        return result;
    },
    // Get commission dashboard statistics - ULTRA-OPTIMIZED for sub-500ms performance
    // Now filters by policy term dates (start_date to end_date) instead of creation dates
    // Supports year-based filtering
    getCommissionDashboardStats: async (timeRange, year) => {
        try {
            let startDate;
            let endDate = null;
            // Set date range based on timeRange parameter
            const now = new Date();
            if (timeRange === 'year' && year) {
                // Year-based filtering
                startDate = new Date(year, 0, 1); // January 1st of the year
                endDate = new Date(year, 11, 31, 23, 59, 59); // December 31st of the year
            }
            else {
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
                    case 'all':
                    default:
                        startDate = new Date(0); // Beginning of time - shows ALL commission ever earned
                }
            }
            // Build the end date condition with proper PostgreSQL date format
            const startDateStr = startDate.toISOString().replace('T', ' ').replace('Z', '');
            const endDateStr = endDate ? endDate.toISOString().replace('T', ' ').replace('Z', '') : '';
            const endDateCondition = endDate ? `AND p.start_date <= '${endDateStr}'` : '';
            const limitClause = timeRange === 'all' ? '' : 'LIMIT 12';
            // ✅ ULTRA-OPTIMIZATION: Single raw SQL query with all aggregations
            // Now filters by policy term dates (start_date to end_date) for accurate revenue by time period
            // INCLUDES ALL POLICIES (not just leaf policies) to show total revenue across all terms
            const query = `
        WITH 
        -- Get all commission data from journal (all policies, filtered by term dates)
        journal_data AS (
          SELECT 
            cj.policy_id,
            cj."commissionAmount" as commission_amount,
            cj."calculatedAt" as calculated_at,
            p.company_id,
            p.policy_name_id,
            p.start_date,
            p.end_date,
            p.created_at as policy_created_at,
            p.gst_status
          FROM "commission_journal" cj
          LEFT JOIN "policy" p ON cj.policy_id = p.id
          WHERE p.start_date >= '${startDateStr}'
            ${endDateCondition}
        ),
        -- Live commission from policy + commission_rules (no stored value dependency)
        policy_commission AS (
          SELECT 
            p.id as policy_id,
            ROUND(CAST(
              (p.premium_amount * CASE WHEN p.start_date IS NOT NULL AND p.start_date < '2025-09-22'::date THEN 0.82 WHEN p.start_date IS NOT NULL THEN 1.0 WHEN p.gst_status THEN 0.82 ELSE 1.0 END * cr."commissionPercent" / 100.0)
            AS numeric), 2) as commission_amount,
            p.created_at as calculated_at,
            p.company_id,
            p.policy_name_id,
            p.start_date,
            p.end_date,
            p.created_at as policy_created_at,
            p.gst_status
          FROM "policy" p
          LEFT JOIN LATERAL (
            SELECT cr."commissionPercent"
            FROM "commission_rules" cr
            WHERE cr.policy_name_id = p.policy_name_id
              AND cr.is_active = true
              AND cr."policyStatus" = p.policy_creation_status
              AND (
                cr."siCondition" IS NULL
                OR cr."siCondition" = CASE WHEN p.sum_insured >= 1000000 THEN 'GREATER_EQUAL_10_LAKHS'::si_condition ELSE 'LESS_THAN_10_LAKHS'::si_condition END
              )
              AND (cr.deductible_status IS NULL OR cr.deductible_status = p.deductible_amount_status)
            ORDER BY 
              CASE WHEN cr."siCondition" IS NOT NULL THEN 0 ELSE 1 END,
              cr."createdAt" DESC
            LIMIT 1
          ) cr ON true
          WHERE p.start_date >= '${startDateStr}'
            ${endDateCondition}
            AND p.premium_amount > 0
            AND NOT EXISTS (SELECT 1 FROM "commission_journal" cj2 WHERE cj2.policy_id = p.id AND cj2."calculatedAt" >= '${startDateStr}')
        ),
        -- Combine both sources
        all_commission AS (
          SELECT * FROM journal_data
          UNION ALL
          SELECT * FROM policy_commission
        ),
        -- Aggregate by company (all policies)
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
        -- Aggregate by policy name (all policies)
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
        -- Aggregate by month (using policy start_date for accurate term-based revenue)
        monthly_agg AS (
          SELECT 
            TO_CHAR(ac.start_date, 'YYYY-MM') as month_key,
            SUM(ac.commission_amount) as total_commission,
            COUNT(DISTINCT ac.policy_id) as policy_count
          FROM all_commission ac
          GROUP BY TO_CHAR(ac.start_date, 'YYYY-MM')
          ORDER BY month_key
          ${limitClause}
        )
        SELECT 
          -- Total commission
          COALESCE(SUM(commission_amount), 0) as total_commission,
          -- Count only visible policies (leaf policies - no children)
          COUNT(DISTINCT CASE 
            WHEN NOT EXISTS (
              SELECT 1 FROM "policy" child 
              WHERE child."parent_policy_id" = ac.policy_id
            ) 
            THEN ac.policy_id 
            ELSE NULL 
          END) as total_policies,
          -- Total tax paid (GST amount) - 18% of premium where GST status is true
          -- Only for leaf policies (visible in policy panel)
          COALESCE(SUM(
            CASE 
              WHEN ac.gst_status = true AND NOT EXISTS (
                SELECT 1 FROM "policy" child 
                WHERE child."parent_policy_id" = ac.policy_id
              )
              THEN (SELECT p.premium_amount FROM "policy" p WHERE p.id = ac.policy_id LIMIT 1) * 0.18
              ELSE 0
            END
          ), 0) as total_tax_paid,
          -- Average commission rate
          COALESCE(AVG(
            CASE 
              WHEN commission_amount > 0 AND (SELECT p.premium_amount FROM "policy" p WHERE p.id = ac.policy_id LIMIT 1) > 0
              THEN (commission_amount / (SELECT p.premium_amount FROM "policy" p WHERE p.id = ac.policy_id LIMIT 1)) * 100
              ELSE NULL
            END
          ), 0) as avg_commission_rate,
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
        FROM all_commission ac
      `;
            const result = await prismaClient_1.default.$queryRawUnsafe(query);
            // Parse the result
            const row = result[0];
            // Count unique products and companies from the aggregated data
            const productsCount = row.commission_by_policy_name ? row.commission_by_policy_name.length : 0;
            const companiesCount = row.commission_by_company ? row.commission_by_company.length : 0;
            return {
                totalCommission: Number(row.total_commission) || 0,
                totalPolicies: Number(row.total_policies) || 0,
                totalTaxPaid: Number(row.total_tax_paid) || 0,
                avgCommissionRate: Number(row.avg_commission_rate) || 0,
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
