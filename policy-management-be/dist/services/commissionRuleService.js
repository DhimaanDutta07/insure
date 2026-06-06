"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commissionRuleService = void 0;
const commissionRuleRepository_1 = require("../repositories/commissionRuleRepository");
const AppError_1 = require("../utils/AppError");
const lruCache_1 = require("../utils/lruCache");
exports.commissionRuleService = {
    async createCommissionRule(data) {
        // Check for duplicate rule with targeted DB query instead of loading all rules
        const existing = await commissionRuleRepository_1.commissionRuleRepository.findByCompositeKey({
            policy_name_id: data.policy_name_id,
            policyStatus: data.policyStatus,
            deductibleType: data.deductibleType,
            ageCondition: data.ageCondition,
        });
        if (existing) {
            throw new Error('A commission rule with the same conditions already exists.');
        }
        lruCache_1.commissionStatsCache.deleteByPrefix('commissionRules');
        return commissionRuleRepository_1.commissionRuleRepository.create(data);
    },
    async getAllCommissionRules() {
        const cached = lruCache_1.commissionStatsCache.get('commissionRules:all');
        if (cached)
            return cached;
        const rules = await commissionRuleRepository_1.commissionRuleRepository.findAll(500);
        lruCache_1.commissionStatsCache.set('commissionRules:all', rules, 300000);
        return rules;
    },
    async getCommissionRuleById(id) {
        return commissionRuleRepository_1.commissionRuleRepository.findById(id);
    },
    async updateCommissionRule(id, data) {
        return commissionRuleRepository_1.commissionRuleRepository.update(id, data);
    },
    async deleteCommissionRule(id) {
        return commissionRuleRepository_1.commissionRuleRepository.delete(id);
    },
    // New search and pagination method
    async searchCommissionRules(params) {
        return commissionRuleRepository_1.commissionRuleRepository.searchAndPaginate(params);
    },
    // New method for updating CommissionRule status
    async updateCommissionRuleStatusService(ruleId, isActive) {
        try {
            // Check if rule exists
            const existingRule = await commissionRuleRepository_1.commissionRuleRepository.findById(ruleId);
            if (!existingRule) {
                throw new AppError_1.AppError(404, "ClientError", "Commission rule not found");
            }
            // Update the status
            const updatedRule = await commissionRuleRepository_1.commissionRuleRepository.updateCommissionRuleStatus(ruleId, isActive);
            if (!updatedRule) {
                throw new AppError_1.AppError(404, "ClientError", "Commission rule not found");
            }
            return updatedRule;
        }
        catch (err) {
            if (err instanceof AppError_1.AppError)
                throw err;
            throw new AppError_1.AppError(500, "ServerError", "Failed to update commission rule status", err);
        }
    },
    // Bulk update is_active for all rules by policy_name_id
    async updateCommissionRulesStatusByPolicyNameService(policyNameId, isActive) {
        // Optionally, check if policyNameId exists or has rules
        const result = await commissionRuleRepository_1.commissionRuleRepository.updateCommissionRulesStatusByPolicyName(policyNameId, isActive);
        return result;
    },
    // Get commission dashboard statistics
    async getCommissionDashboardStats(timeRange) {
        return commissionRuleRepository_1.commissionRuleRepository.getCommissionDashboardStats(timeRange);
    },
    // Simplified: get commission percentage for a product
    async getCommissionByProduct(policyNameId) {
        return commissionRuleRepository_1.commissionRuleRepository.findFirstByPolicyName(policyNameId);
    },
    // Simplified: upsert commission percentage for a product
    async upsertCommissionByProduct(policyNameId, commissionPercent) {
        return commissionRuleRepository_1.commissionRuleRepository.upsertByProduct(policyNameId, commissionPercent);
    },
};
