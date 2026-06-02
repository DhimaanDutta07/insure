import { Request, Response } from 'express';
import { commissionService } from '../services/commissionService';
import { commissionSchema, commissionUpdateSchema } from '../schemas/commissionSchema';
import { z } from 'zod';
import prisma from '../utils/prismaClient';

export const commissionController = {
  async createCommission(req: Request, res: Response) {
    try {
      const data = commissionSchema.parse(req.body);
      const commission = await commissionService.createCommission({
        ...data,
        description: data.description ?? null,
      });
      res.status(201).json(commission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  },

  async getAllCommissions(req: Request, res: Response) {
    try {
      const commissions = await commissionService.getAllCommissions();
      res.status(200).json(commissions);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getCommissionById(req: Request, res: Response) {
    try {
      const commission = await commissionService.getCommissionById(req.params.id as string);
      if (!commission) return res.status(404).json({ error: 'Commission not found' });
      res.status(200).json(commission);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async updateCommission(req: Request, res: Response) {
    try {
      const data = commissionUpdateSchema.parse(req.body);
      const commission = await commissionService.updateCommission(req.params.id as string, data);
      res.status(200).json(commission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  },

  async deleteCommission(req: Request, res: Response) {
    try {
      const result = await commissionService.deleteCommission(req.params.id as string);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get commission rules for a specific policy name
  async getCommissionRulesByPolicyName(req: Request, res: Response) {
    try {
      const policyNameId = req.params.policyNameId as string;
      
      const commissionRules = await prisma.commissionRule.findMany({
        where: {
          policy_name_id: policyNameId,
          is_active: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.status(200).json(commissionRules);
    } catch (error) {
      console.error('Error fetching commission rules:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
}; 