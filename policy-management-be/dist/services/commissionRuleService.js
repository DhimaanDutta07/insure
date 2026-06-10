"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commissionRuleService = void 0;
const commissionRuleRepository_1 = require("../repositories/commissionRuleRepository");
const AppError_1 = require("../utils/AppError");
const lruCache_1 = require("../utils/lruCache");
const prismaClient_1 = __importDefault(require("../utils/prismaClient"));
exports.commissionRuleService = {
    async createCommissionRule(data) {
        console.log('[Service] Creating commission rule with data:', data);
        // Check for duplicate rule with targeted DB query
        // For custom SI thresholds, include those in the duplicate check
        const whereClause = {
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
        const existing = await prismaClient_1.default.commissionRule.findFirst({
            where: whereClause,
        });
        console.log('[Service] Existing rule found:', existing ? existing.id : 'none');
        if (existing) {
            throw new Error('A commission rule with the same conditions already exists.');
        }
        lruCache_1.commissionStatsCache.deleteByPrefix('commissionRules');
        const result = commissionRuleRepository_1.commissionRuleRepository.create(data);
        console.log('[Service] Rule created successfully');
        return result;
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
        const rule = await commissionRuleRepository_1.commissionRuleRepository.update(id, data);
        // Invalidate cache to ensure fresh data
        lruCache_1.commissionStatsCache.deleteByPrefix('commissionRules');
        // If commissionPercent was updated, recalculate commissions for all policies with this policy_name_id
        if (data.commissionPercent !== undefined && rule.policy_name_id) {
            try {
                const recalcResult = await this.recalculateCommissionsForPolicyName(rule.policy_name_id);
                console.log(`[Commission] Auto-recalculated commissions after rule update for policyNameId ${rule.policy_name_id}:`, recalcResult);
            }
            catch (error) {
                console.error(`[Commission] Error auto-recalculating commissions after rule update for policyNameId ${rule.policy_name_id}:`, error);
            }
        }
        return rule;
    },
    async deleteCommissionRule(id) {
        const result = await commissionRuleRepository_1.commissionRuleRepository.delete(id);
        if (!result.success) {
            throw new Error(result.error);
        }
        lruCache_1.commissionStatsCache.deleteByPrefix('commissionRules');
        return result;
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
    async getCommissionDashboardStats(timeRange, year) {
        return commissionRuleRepository_1.commissionRuleRepository.getCommissionDashboardStats(timeRange, year);
    },
    // Simplified: get commission percentage for a product
    async getCommissionByProduct(policyNameId) {
        return commissionRuleRepository_1.commissionRuleRepository.findFirstByPolicyName(policyNameId);
    },
    // Simplified: upsert commission percentage for a product with optional sub-classifications
    async upsertCommissionByProduct(policyNameId, commissionPercent, productType, policyStatus, siCondition) {
        const rule = await commissionRuleRepository_1.commissionRuleRepository.upsertByProduct(policyNameId, commissionPercent, productType, policyStatus, siCondition);
        // Invalidate cache to ensure fresh data
        lruCache_1.commissionStatsCache.deleteByPrefix('commissionRules');
        // Automatically recalculate commissions for all existing policies with this policy_name_id
        try {
            const recalcResult = await this.recalculateCommissionsForPolicyName(policyNameId);
            console.log(`[Commission] Auto-recalculated commissions for policyNameId ${policyNameId}:`, recalcResult);
        }
        catch (error) {
            console.error(`[Commission] Error auto-recalculating commissions for policyNameId ${policyNameId}:`, error);
        }
        return rule;
    },
    // Recalculate commissions for all policies with a given policy_name_id
    async recalculateCommissionsForPolicyName(policyNameId) {
        const { calculateAndSetCommission } = await Promise.resolve().then(() => __importStar(require('./policy.service')));
        // Find all policies with the given policy_name_id
        const policies = await prismaClient_1.default.policy.findMany({
            where: {
                policy_name_id: policyNameId,
                status: 'Active', // Only update active policies
            },
            select: {
                id: true,
                policy_name_id: true,
                policy_creation_status: true,
                sum_insured: true,
                premium_amount: true,
                gst_status: true,
                calculated_commission_amount: true,
                commission_add_on_percentage: true,
            },
        });
        if (policies.length === 0) {
            return { updatedCount: 0, message: 'No active policies found for this product' };
        }
        let updatedCount = 0;
        for (const policy of policies) {
            try {
                // Create a policy input object for commission calculation
                const policyInput = {
                    policy_name_id: policy.policy_name_id,
                    policy_creation_status: policy.policy_creation_status || 'Fresh',
                    sum_insured: policy.sum_insured || 0,
                    premium_amount: policy.premium_amount,
                    gst_status: policy.gst_status,
                };
                console.log('[Recalculate] Processing policy:', {
                    policyId: policy.id,
                    status: policy.policy_creation_status,
                    sumInsured: policy.sum_insured,
                });
                // Calculate new commission
                await calculateAndSetCommission(policyInput);
                // Update the policy with new commission values
                await prismaClient_1.default.policy.update({
                    where: { id: policy.id },
                    data: {
                        calculated_commission_amount: policyInput.calculated_commission_amount,
                        commission_add_on_percentage: policyInput._commissionPercent,
                    },
                });
                updatedCount++;
                console.log('[Recalculate] Updated policy:', policy.id, 'New commission:', policyInput.calculated_commission_amount);
            }
            catch (error) {
                console.error(`Error recalculating commission for policy ${policy.id}:`, error);
            }
        }
        // Invalidate policy list cache to ensure fresh data
        lruCache_1.policyListCache.clear();
        return {
            updatedCount,
            totalPolicies: policies.length,
            message: `Successfully updated ${updatedCount} out of ${policies.length} policies`,
        };
    },
};
