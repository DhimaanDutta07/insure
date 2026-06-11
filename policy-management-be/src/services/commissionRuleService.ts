import { CommissionRule } from '@prisma/client';
import { commissionRuleRepository } from '../repositories/commissionRuleRepository';
import { AppError } from '../utils/AppError';
import { commissionStatsCache, policyListCache, dashboardCache } from '../utils/lruCache';
import prisma from '../utils/prismaClient';

export const commissionRuleService = {
  async createCommissionRule(data: any): Promise<any> {
    console.log('[Service] Creating commission rule with data:', data);

    // Check for duplicate rule with targeted DB query
    // For custom SI thresholds, include those in the duplicate check
    const whereClause: any = {
      policy_name_id: data.policy_name_id,
      policyStatus: data.policyStatus,
      deductibleType: data.deductibleType,
      ageCondition: data.ageCondition,
    };

    if (data.productType !== undefined) {
      whereClause.productType = data.productType;
    }
    if (data.siCondition !== undefined) {
      whereClause.siCondition = data.siCondition;
    }
    if (data.deductibleStatus !== undefined) {
      whereClause.deductibleStatus = data.deductibleStatus;
    }

    // If custom SI fields are present, include them in duplicate check
    if (data.customSIThreshold !== undefined) {
      whereClause.customSIThreshold = data.customSIThreshold;
    }
    if (data.customSIOperator !== undefined) {
      whereClause.customSIOperator = data.customSIOperator;
    }

    console.log('[Service] Checking for existing rule with whereClause:', whereClause);
    const existing = await prisma.commissionRule.findFirst({
      where: whereClause,
    });

    console.log('[Service] Existing rule found:', existing ? existing.id : 'none');

    if (existing) {
      throw new Error('A commission rule with the same conditions already exists.');
    }
    commissionStatsCache.deleteByPrefix('commissionRules');
    const result = commissionRuleRepository.create(data);
    console.log('[Service] Rule created successfully');
    return result;
  },

  async getAllCommissionRules(): Promise<CommissionRule[]> {
    const cached = commissionStatsCache.get('commissionRules:all');
    if (cached) return cached;
    const rules = await commissionRuleRepository.findAll(500);
    commissionStatsCache.set('commissionRules:all', rules, 300_000);
    return rules;
  },

  async getCommissionRuleById(id: string): Promise<CommissionRule | null> {
    return commissionRuleRepository.findById(id);
  },

  async updateCommissionRule(id: string, data: Partial<Omit<CommissionRule, 'id' | 'createdAt' | 'updatedAt'>>): Promise<CommissionRule> {
    const rule = await commissionRuleRepository.update(id, data);

    // Invalidate cache to ensure fresh data
    commissionStatsCache.deleteByPrefix('commissionRules');

    // If commissionPercent was updated, recalculate commissions for all policies with this policy_name_id
    if (data.commissionPercent !== undefined && rule.policy_name_id) {
      try {
        const recalcResult = await this.recalculateCommissionsForPolicyName(rule.policy_name_id);
        console.log(`[Commission] Auto-recalculated commissions after rule update for policyNameId ${rule.policy_name_id}:`, recalcResult);
      } catch (error) {
        console.error(`[Commission] Error auto-recalculating commissions after rule update for policyNameId ${rule.policy_name_id}:`, error);
      }
    }

    return rule;
  },

  async deleteCommissionRule(id: string) {
    const result = await commissionRuleRepository.delete(id);
    if (!result.success) {
      throw new Error(result.error);
    }
    commissionStatsCache.deleteByPrefix('commissionRules');
    return result;
  },

  // New search and pagination method
  async searchCommissionRules(params: {
    search?: string;
    policyStatus?: string;
    deductibleType?: string;
    ageCondition?: string;
    page?: number;
    limit?: number;
  }) {
    return commissionRuleRepository.searchAndPaginate(params);
  },

  // New method for updating CommissionRule status
  async updateCommissionRuleStatusService(
    ruleId: string,
    isActive: boolean
  ): Promise<CommissionRule> {
    try {
      // Check if rule exists
      const existingRule = await commissionRuleRepository.findById(ruleId);
      if (!existingRule) {
        throw new AppError(404, "ClientError", "Commission rule not found");
      }

      // Update the status
      const updatedRule = await commissionRuleRepository.updateCommissionRuleStatus(ruleId, isActive);

      if (!updatedRule) {
        throw new AppError(404, "ClientError", "Commission rule not found");
      }

      return updatedRule;
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(500, "ServerError", "Failed to update commission rule status", err);
    }
  },

  // Bulk update is_active for all rules by policy_name_id
  async updateCommissionRulesStatusByPolicyNameService(policyNameId: string, isActive: boolean) {
    // Optionally, check if policyNameId exists or has rules
    const result = await commissionRuleRepository.updateCommissionRulesStatusByPolicyName(policyNameId, isActive);
    return result;
  },

  // Get commission dashboard statistics
  async getCommissionDashboardStats(timeRange: string, year?: number) {
    const cacheKey = `commission:dashboard:${timeRange}:${year || 'all'}`;
    const cached = commissionStatsCache.get(cacheKey);
    if (cached) return cached;
    const result = await commissionRuleRepository.getCommissionDashboardStats(timeRange, year);
    commissionStatsCache.set(cacheKey, result, 30_000);
    return result;
  },

  // Simplified: get commission percentage for a product
  async getCommissionByProduct(policyNameId: string) {
    return commissionRuleRepository.findFirstByPolicyName(policyNameId);
  },

  // Simplified: upsert commission percentage for a product with optional sub-classifications
  async upsertCommissionByProduct(policyNameId: string, commissionPercent: number, productType?: string, policyStatus?: string, siCondition?: string) {
    const rule = await commissionRuleRepository.upsertByProduct(policyNameId, commissionPercent, productType, policyStatus, siCondition);

    // Invalidate cache to ensure fresh data
    commissionStatsCache.deleteByPrefix('commissionRules');

    // Automatically recalculate commissions for all existing policies with this policy_name_id
    try {
      const recalcResult = await this.recalculateCommissionsForPolicyName(policyNameId);
      console.log(`[Commission] Auto-recalculated commissions for policyNameId ${policyNameId}:`, recalcResult);
    } catch (error) {
      console.error(`[Commission] Error auto-recalculating commissions for policyNameId ${policyNameId}:`, error);
    }

    return rule;
  },

  // Recalculate commissions for all policies with a given policy_name_id
  async recalculateCommissionsForPolicyName(policyNameId: string) {
    const { calculateAndSetCommission } = await import('./policy.service');

    const policies = await prisma.policy.findMany({
      where: { policy_name_id: policyNameId, status: 'Active' },
      select: {
        id: true,
        policy_name_id: true,
        policy_creation_status: true,
        sum_insured: true,
        premium_amount: true,
        gst_status: true,
        deductible_amount_status: true,
      },
    });

    if (!policies.length) {
      return { updatedCount: 0, message: 'No active policies found for this product' };
    }

    let updatedCount = 0;
    const updates: any[] = [];

    for (const policy of policies) {
      try {
        const policyInput: any = {
          policy_name_id: policy.policy_name_id,
          policy_creation_status: policy.policy_creation_status || 'Fresh',
          sum_insured: policy.sum_insured || 0,
          premium_amount: policy.premium_amount,
          gst_status: policy.gst_status,
          deductible_amount_status: policy.deductible_amount_status,
        };

        await calculateAndSetCommission(policyInput);
        updates.push(prisma.policy.update({
          where: { id: policy.id },
          data: {
            calculated_commission_amount: policyInput.calculated_commission_amount,
            commission_add_on_percentage: policyInput._commissionPercent,
          },
        }));
        updatedCount++;
      } catch (error) {
        console.error(`Error recalculating commission for policy ${policy.id}:`, error);
      }
    }

    // Execute all updates in parallel
    await Promise.all(updates);

    // Invalidate caches to ensure fresh data on dashboard
    policyListCache.clear();
    dashboardCache.deleteByPrefix('dashboard:');

    return {
      updatedCount,
      totalPolicies: policies.length,
      message: `Successfully updated ${updatedCount} out of ${policies.length} policies`,
    };
  },
};
