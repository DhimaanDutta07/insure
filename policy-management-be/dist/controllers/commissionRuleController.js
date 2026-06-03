"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commissionRuleController = void 0;
const commissionRuleService_1 = require("../services/commissionRuleService");
const commissionRuleSchema_1 = require("../schemas/commissionRuleSchema");
const zod_1 = require("zod");
const errorHandler_1 = require("../utils/errorHandler");
// CommissionRule status validation schema
const commissionRuleStatusSchema = zod_1.z.object({ is_active: zod_1.z.boolean() });
exports.commissionRuleController = {
    async createCommissionRule(req, res) {
        try {
            const data = commissionRuleSchema_1.commissionRuleSchema.parse(req.body);
            const rule = await commissionRuleService_1.commissionRuleService.createCommissionRule(data);
            res.status(201).json(rule);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({ error: error.errors });
            }
            else {
                res.status(400).json({ error: error.message || 'Internal server error' });
            }
        }
    },
    async getAllCommissionRules(req, res) {
        try {
            // Check if search parameters are provided
            const hasSearchParams = req.query.search || req.query.policyStatus || req.query.deductibleType || req.query.ageCondition || req.query.page || req.query.limit;
            if (hasSearchParams) {
                // Use search functionality
                const searchParams = commissionRuleSchema_1.commissionRuleSearchSchema.parse(req.query);
                console.log('Search params:', searchParams);
                const result = await commissionRuleService_1.commissionRuleService.searchCommissionRules(searchParams);
                console.log('Search result:', { total: result.total, page: result.page, totalPages: result.totalPages });
                res.status(200).json(result);
            }
            else {
                // Use original functionality
                const rules = await commissionRuleService_1.commissionRuleService.getAllCommissionRules();
                res.status(200).json(rules);
            }
        }
        catch (error) {
            console.error('Error in getAllCommissionRules:', error);
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({ error: error.errors });
            }
            else {
                res.status(500).json({ error: error.message || 'Internal server error' });
            }
        }
    },
    // Test method to verify basic functionality
    async testGetAllCommissionRules(req, res) {
        try {
            const rules = await commissionRuleService_1.commissionRuleService.getAllCommissionRules();
            res.status(200).json({
                message: 'Basic functionality works',
                count: rules.length,
                sample: rules.slice(0, 2)
            });
        }
        catch (error) {
            console.error('Error in testGetAllCommissionRules:', error);
            res.status(500).json({ error: error.message || 'Internal server error' });
        }
    },
    async getCommissionRuleById(req, res) {
        try {
            const rule = await commissionRuleService_1.commissionRuleService.getCommissionRuleById(req.params.id);
            if (!rule)
                return res.status(404).json({ error: 'Commission rule not found' });
            res.status(200).json(rule);
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    async updateCommissionRule(req, res) {
        try {
            const data = commissionRuleSchema_1.commissionRuleUpdateSchema.parse(req.body);
            const rule = await commissionRuleService_1.commissionRuleService.updateCommissionRule(req.params.id, data);
            res.status(200).json(rule);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({ error: error.errors });
            }
            else {
                res.status(400).json({ error: error.message || 'Internal server error' });
            }
        }
    },
    async deleteCommissionRule(req, res) {
        try {
            const result = await commissionRuleService_1.commissionRuleService.deleteCommissionRule(req.params.id);
            if (result.success === false) {
                return res.status(400).json({ error: result.error });
            }
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    // New method for updating CommissionRule status
    updateCommissionRuleStatus: (0, errorHandler_1.asyncTryCatch)(async (req, res) => {
        // Validate UUID format
        const ruleId = zod_1.z.string().uuid().parse(req.params.id);
        // Validate status
        const { is_active } = commissionRuleStatusSchema.parse(req.body);
        const updatedRule = await commissionRuleService_1.commissionRuleService.updateCommissionRuleStatusService(ruleId, is_active);
        res.status(200).json(updatedRule);
    }),
    // Bulk update is_active for all rules by policy_name_id
    async updateCommissionRulesStatusByPolicyName(req, res) {
        try {
            const { is_active } = req.body;
            const policyNameId = req.params.policyNameId;
            if (typeof is_active !== 'boolean') {
                res.status(400).json({ error: 'is_active must be boolean' });
                return;
            }
            const result = await commissionRuleService_1.commissionRuleService.updateCommissionRulesStatusByPolicyNameService(policyNameId, is_active);
            res.status(200).json({ updatedCount: result.count, policy_name_id: policyNameId });
        }
        catch (error) {
            res.status(500).json({ error: error.message || 'Internal server error' });
        }
    },
    // Get commission dashboard statistics
    async getCommissionDashboardStats(req, res) {
        try {
            const { timeRange = 'all' } = req.query;
            const stats = await commissionRuleService_1.commissionRuleService.getCommissionDashboardStats(timeRange);
            res.status(200).json(stats);
        }
        catch (error) {
            console.error('Error fetching commission dashboard stats:', error);
            res.status(500).json({ error: error.message || 'Internal server error' });
        }
    },
    // Simplified: get commission for a specific product (first active rule)
    async getCommissionByProduct(req, res) {
        try {
            const policyNameId = req.params.policyNameId;
            const rule = await commissionRuleService_1.commissionRuleService.getCommissionByProduct(policyNameId);
            if (!rule) {
                return res.status(200).json({ commissionPercent: 0, rule: null });
            }
            res.status(200).json({ commissionPercent: rule.commissionPercent, rule });
        }
        catch (error) {
            console.error('Error fetching commission by product:', error);
            res.status(500).json({ error: error.message || 'Internal server error' });
        }
    },
    // Simplified: upsert commission percentage for a product
    async upsertCommissionByProduct(req, res) {
        try {
            const policyNameId = req.params.policyNameId;
            const { commissionPercent } = req.body;
            if (typeof commissionPercent !== 'number' || commissionPercent < 0 || commissionPercent > 100) {
                return res.status(400).json({ error: 'commissionPercent must be a number between 0 and 100' });
            }
            const rule = await commissionRuleService_1.commissionRuleService.upsertCommissionByProduct(policyNameId, commissionPercent);
            res.status(200).json({ success: true, rule });
        }
        catch (error) {
            console.error('Error upserting commission by product:', error);
            res.status(500).json({ error: error.message || 'Internal server error' });
        }
    },
};
