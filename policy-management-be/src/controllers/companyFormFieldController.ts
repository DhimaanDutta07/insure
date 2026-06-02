import { Request, Response } from 'express';
import { companyFormFieldService } from '../services/companyFormFieldService';
import { companyFormFieldSchema, companyFormFieldUpdateSchema } from '../schemas/companyFormFieldSchema';
import { z } from 'zod';

export const companyFormFieldController = {
  async createCompanyFormField(req: Request, res: Response) {
    try {
      const data = companyFormFieldSchema.parse(req.body);
      const formField = await companyFormFieldService.createCompanyFormField(data);
      res.status(201).json(formField);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create form field' });
      }
    }
  },

  async getCompanyFormFields(req: Request, res: Response) {
    try {
      const companyId = req.params.companyId as string;
      const fields = await companyFormFieldService.getCompanyFormFields(companyId);
      res.json(fields);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch form fields' });
    }
  },

  async getCompanyFormFieldById(req: Request, res: Response) {
    try {
      const formField = await companyFormFieldService.getCompanyFormFieldById(req.params.id as string);
      if (!formField) return res.status(404).json({ error: 'Form field not found' });
      res.json(formField);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch form field' });
    }
  },

  async updateCompanyFormField(req: Request, res: Response) {
    try {
      const data = companyFormFieldUpdateSchema.parse(req.body);
      const formField = await companyFormFieldService.updateCompanyFormField(req.params.id as string, data);
      res.json(formField);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to update form field' });
      }
    }
  },

  async deleteCompanyFormField(req: Request, res: Response) {
    try {
      await companyFormFieldService.deleteCompanyFormField(req.params.id as string);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete form field' });
    }
  },
}; 