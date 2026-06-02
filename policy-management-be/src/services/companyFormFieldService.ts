import { PrismaClient, CompanyFormField } from '@prisma/client';

const prisma = new PrismaClient();

export const companyFormFieldService = {
  // Create a new company form field
  async createCompanyFormField(data: Omit<CompanyFormField, 'id'>): Promise<CompanyFormField> {
    return prisma.companyFormField.create({ data });
  },

  // Get all form fields for a company
  async getCompanyFormFields(companyId: string): Promise<CompanyFormField[]> {
    return prisma.companyFormField.findMany({
      where: { company_id: companyId },
      orderBy: { order: 'asc' },
    });
  },

  // Get a form field by ID
  async getCompanyFormFieldById(id: string): Promise<CompanyFormField | null> {
    return prisma.companyFormField.findUnique({ where: { id } });
  },

  // Update a form field
  async updateCompanyFormField(id: string, data: Partial<Omit<CompanyFormField, 'id'>>): Promise<CompanyFormField> {
    return prisma.companyFormField.update({ where: { id }, data });
  },

  // Delete a form field
  async deleteCompanyFormField(id: string): Promise<CompanyFormField> {
    return prisma.companyFormField.delete({ where: { id } });
  },
}; 