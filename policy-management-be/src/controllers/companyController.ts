import { Request, Response } from "express";
import { companyService } from '../services/companyService';
import { companySchema, companyUpdateSchema } from '../schemas/companySchema';
import { z } from 'zod';

export const companyController = {
  async createCompany(req: Request, res: Response) {
    try {
      const data = companySchema.parse(req.body);
      const company = await companyService.createCompany(data);
      res.status(201).json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create company' });
      }
    }
  },

  async getAllCompanies(req: Request, res: Response) {
    try {
      const companies = await companyService.getAllCompanies();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch companies" });
    }
  },

  async getCompanyById(req: Request, res: Response) {
    try {
      const company = await companyService.getCompanyById(req.params.id as string);
      if (!company) return res.status(404).json({ error: 'Company not found' });
      res.json(company);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch company' });
    }
  },

  async updateCompany(req: Request, res: Response) {
    try {
      const data = companyUpdateSchema.parse(req.body);
      const company = await companyService.updateCompany(req.params.id as string, data);
      res.json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to update company' });
      }
    }
  },

  async deleteCompany(req: Request, res: Response) {
    try {
      await companyService.deleteCompany(req.params.id as string);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete company' });
    }
  },

  async getCompanyFormFields(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const fields = await companyService.getCompanyFormFields(id);
      res.json(fields);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch form fields" });
    }
  }
}; 