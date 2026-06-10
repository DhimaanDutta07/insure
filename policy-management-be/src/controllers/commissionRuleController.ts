import { Request, Response } from 'express';
import { commissionRuleService } from '../services/commissionRuleService';
import { commissionRuleSchema, commissionRuleUpdateSchema, commissionRuleSearchSchema } from '../schemas/commissionRuleSchema';
import { z } from 'zod';
import { asyncTryCatch } from '../utils/errorHandler';
import { commissionStatsCache } from '../utils/lruCache';

// CommissionRule status validation schema
const commissionRuleStatusSchema = z.object({ is_active: z.boolean() });

export const commissionRuleController = {
  async createCommissionRule(req: Request, res: Response) {
    try {
      console.log('[Controller] Creating commission rule with data:', req.body);
      const data = commissionRuleSchema.parse(req.body);
      const rule = await commissionRuleService.createCommissionRule(data);
      res.status(201).json(rule);
    } catch (error: any) {
      console.error('[Controller] Error creating commission rule:', error);
      if (error instanceof z.ZodError) {
        console.log('[Controller] Zod validation errors:', error.errors);
        res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
      } else {
        res.status(400).json({ error: error.message || 'Internal server error' });
      }
    }
  },

  async getAllCommissionRules(req: Request, res: Response) {
    try {
      // Check if search parameters are provided
      const hasSearchParams = req.query.search || req.query.policyStatus || req.query.deductibleType || req.query.ageCondition || req.query.page || req.query.limit;
      
      if (hasSearchParams) {
        // Use search functionality
        const searchParams = commissionRuleSearchSchema.parse(req.query);
        console.log('Search params:', searchParams);
        
        const result = await commissionRuleService.searchCommissionRules(searchParams);
        console.log('Search result:', { total: result.total, page: result.page, totalPages: result.totalPages });
        
        res.status(200).json(result);
      } else {
        // Use original functionality
        const rules = await commissionRuleService.getAllCommissionRules();
        res.status(200).json(rules);
      }
    } catch (error: any) {
      console.error('Error in getAllCommissionRules:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message || 'Internal server error' });
      }
    }
  },

  // Test method to verify basic functionality
  async testGetAllCommissionRules(req: Request, res: Response) {
    try {
      const rules = await commissionRuleService.getAllCommissionRules();
      res.status(200).json({ 
        message: 'Basic functionality works', 
        count: rules.length,
        sample: rules.slice(0, 2) 
      });
    } catch (error: any) {
      console.error('Error in testGetAllCommissionRules:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  },

  async getCommissionRuleById(req: Request, res: Response) {
    try {
      const rule = await commissionRuleService.getCommissionRuleById(req.params.id as string);
      if (!rule) return res.status(404).json({ error: 'Commission rule not found' });
      res.status(200).json(rule);
    } catch (error: any) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async updateCommissionRule(req: Request, res: Response) {
    try {
      const data = commissionRuleUpdateSchema.parse(req.body);
      const rule = await commissionRuleService.updateCommissionRule(req.params.id as string, data);
      res.status(200).json(rule);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(400).json({ error: error.message || 'Internal server error' });
      }
    }
  },

  async deleteCommissionRule(req: Request, res: Response) {
    try {
      await commissionRuleService.deleteCommissionRule(req.params.id as string);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to delete commission rule' });
    }
  },

  // New method for updating CommissionRule status
  updateCommissionRuleStatus: asyncTryCatch(async (req: Request, res: Response) => {
    // Validate UUID format
    const ruleId = z.string().uuid().parse(req.params.id as string);

    // Validate status
    const { is_active } = commissionRuleStatusSchema.parse(req.body);

    const updatedRule = await commissionRuleService.updateCommissionRuleStatusService(ruleId, is_active);

    res.status(200).json(updatedRule);
  }),

  // Bulk update is_active for all rules by policy_name_id
  async updateCommissionRulesStatusByPolicyName(req: Request, res: Response) {
    try {
      const { is_active } = req.body;
      const policyNameId = req.params.policyNameId as string;
      if (typeof is_active !== 'boolean') {
        res.status(400).json({ error: 'is_active must be boolean' });
        return;
      }
      const result = await commissionRuleService.updateCommissionRulesStatusByPolicyNameService(policyNameId, is_active);
      res.status(200).json({ updatedCount: result.count, policy_name_id: policyNameId });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  },

  // Get commission dashboard statistics
  async getCommissionDashboardStats(req: Request, res: Response) {
    try {
      const { timeRange = 'all', year } = req.query;
      
      const stats = await commissionRuleService.getCommissionDashboardStats(
        timeRange as string,
        year ? parseInt(year as string) : undefined
      );
      res.status(200).json(stats);
    } catch (error: any) {
      console.error('Error fetching commission dashboard stats:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  },

  // Simplified: get commission for a specific product (first active rule)
  async getCommissionByProduct(req: Request, res: Response) {
    try {
      const policyNameId = req.params.policyNameId as string;
      const rule = await commissionRuleService.getCommissionByProduct(policyNameId);
      if (!rule) {
        return res.status(200).json({ commissionPercent: 0, rule: null });
      }
      res.status(200).json({ commissionPercent: rule.commissionPercent, rule });
    } catch (error: any) {
      console.error('Error fetching commission by product:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  },

  // Simplified: upsert commission percentage for a product
  async upsertCommissionByProduct(req: Request, res: Response) {
    try {
      const policyNameId = req.params.policyNameId as string;
      const { commissionPercent, productType, policyStatus, siCondition } = req.body;
      if (typeof commissionPercent !== 'number' || commissionPercent < 0 || commissionPercent > 100) {
        return res.status(400).json({ error: 'commissionPercent must be a number between 0 and 100' });
      }
      const rule = await commissionRuleService.upsertCommissionByProduct(policyNameId, commissionPercent, productType, policyStatus, siCondition);
      res.status(200).json({ success: true, rule });
    } catch (error: any) {
      console.error('Error upserting commission by product:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  },

  // Recalculate commissions for all policies with a given policy_name_id
  async recalculateCommissionsForPolicyName(req: Request, res: Response) {
    try {
      const policyNameId = req.params.policyNameId as string;
      const result = await commissionRuleService.recalculateCommissionsForPolicyName(policyNameId);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('Error recalculating commissions for policy name:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  },

  // Calculate commission based on policy details (including sum_insured and status)
  async calculateCommission(req: Request, res: Response) {
    try {
      const { policy_name_id, policy_creation_status, sum_insured, premium_amount, gst_status, deductible_amount_status } = req.body;

      console.log('[Controller] Commission calculation request:', {
        policy_name_id,
        policy_creation_status,
        sum_insured,
        premium_amount,
        gst_status,
        deductible_amount_status,
      });

      if (!policy_name_id || premium_amount === undefined) {
        return res.status(400).json({ error: 'policy_name_id and premium_amount are required' });
      }

      const { calculateAndSetCommission } = await import('../services/policy.service');

      const policyInput: any = {
        policy_name_id,
        policy_creation_status: policy_creation_status || 'Fresh',
        sum_insured: sum_insured || 0,
        premium_amount,
        gst_status: gst_status || false,
        deductible_amount_status: deductible_amount_status || false,
      };

      await calculateAndSetCommission(policyInput);

      console.log('[Controller] Commission calculation result:', {
        calculated_commission_amount: policyInput.calculated_commission_amount,
        _commissionPercent: policyInput._commissionPercent,
        _commissionRuleId: policyInput._commissionRuleId,
        _siCondition: policyInput._siCondition,
        _customSIThreshold: policyInput._customSIThreshold,
        _customSIOperator: policyInput._customSIOperator,
      });

      res.status(200).json({
        calculated_commission_amount: policyInput.calculated_commission_amount,
        base_percentage: policyInput._commissionPercent,
        rule_found: policyInput._commissionPercent > 0,
        si_condition: policyInput._siCondition,
        custom_si_threshold: policyInput._customSIThreshold,
        custom_si_operator: policyInput._customSIOperator,
      });
    } catch (error: any) {
      console.error('Error calculating commission:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  },
};
