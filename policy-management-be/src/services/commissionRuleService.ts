import { CommissionRule } from '@prisma/client';
import { commissionRuleRepository } from '../repositories/commissionRuleRepository';
import { AppError } from '../utils/AppError';

export const commissionRuleService = {
  async createCommissionRule(data: Omit<CommissionRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<CommissionRule> {
    // Check for duplicate rule (unique constraint)
    const existing = await commissionRuleRepository.findAll();
    const isDuplicate = existing.some(rule =>
      rule.policy_name_id === data.policy_name_id &&
      rule.policyStatus === data.policyStatus &&
      rule.deductibleType === data.deductibleType &&
      rule.ageCondition === data.ageCondition
    );
    if (isDuplicate) {
      throw new Error('A commission rule with the same conditions already exists.');
    }
    return commissionRuleRepository.create(data);
  },

  async getAllCommissionRules(): Promise<CommissionRule[]> {
    return commissionRuleRepository.findAll();
  },

  async getCommissionRuleById(id: string): Promise<CommissionRule | null> {
    return commissionRuleRepository.findById(id);
  },

  async updateCommissionRule(id: string, data: Partial<Omit<CommissionRule, 'id' | 'createdAt' | 'updatedAt'>>): Promise<CommissionRule> {
    return commissionRuleRepository.update(id, data);
  },

  async deleteCommissionRule(id: string) {
    return commissionRuleRepository.delete(id);
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
  async getCommissionDashboardStats(timeRange: string) {
    return commissionRuleRepository.getCommissionDashboardStats(timeRange);
  },

  // Simplified: get commission percentage for a product
  async getCommissionByProduct(policyNameId: string) {
    return commissionRuleRepository.findFirstByPolicyName(policyNameId);
  },

  // Simplified: upsert commission percentage for a product
  async upsertCommissionByProduct(policyNameId: string, commissionPercent: number) {
    return commissionRuleRepository.upsertByProduct(policyNameId, commissionPercent);
  },
};
