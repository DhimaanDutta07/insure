import { Request, Response } from 'express';
import { agentService } from '../services/agentService';
import { agentSchema, agentUpdateSchema } from '../schemas/agentSchema';
import { z } from 'zod';

export const agentController = {
  async createAgent(req: Request, res: Response) {
    try {
      const data = agentSchema.parse(req.body);
      const agent = await agentService.createAgent({
        ...data,
        phone: data.phone ?? null,
        description: data.description ?? null,
        status: data.status || 'Active',
      });
      res.status(201).json(agent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  },

  async getAllAgents(req: Request, res: Response) {
    try {
      const agents = await agentService.getAllAgents();
      res.status(200).json(agents);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getAgentById(req: Request, res: Response) {
    try {
      const agent = await agentService.getAgentById(req.params.id as string);
      if (!agent) return res.status(404).json({ error: 'Agent not found' });
      res.status(200).json(agent);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async updateAgent(req: Request, res: Response) {
    try {
      const data = agentUpdateSchema.parse(req.body);
      const agent = await agentService.updateAgent(req.params.id as string, data);
      res.status(200).json(agent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  },

  async deleteAgent(req: Request, res: Response) {
    try {
      await agentService.deleteAgent(req.params.id as string);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};