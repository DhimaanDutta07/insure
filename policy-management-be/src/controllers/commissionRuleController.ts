import { Request, Response } from 'express';
import { commissionRuleService } from '../services/commissionRuleService';
import { commissionRuleSchema, commissionRuleUpdateSchema, commissionRuleSearchSchema } from '../schemas/commissionRuleSchema';
import { z } from 'zod';
import { asyncTryCatch } from '../utils/errorHandler';

// CommissionRule status validation schema
const commissionRuleStatusSchema = z.object({ is_active: z.boolean() });

export const commissionRuleController = {
  async createCommissionRule(req: Request, res: Response) {
    try {
      const data = commissionRuleSchema.parse(req.body);
      const rule = await commissionRuleService.createCommissionRule(data);
      res.status(201).json(rule);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
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
      const result = await commissionRuleService.deleteCommissionRule(req.params.id as string);
      if (result.success === false) {
        return res.status(400).json({ error: result.error });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: 'Internal server error' });
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
};
