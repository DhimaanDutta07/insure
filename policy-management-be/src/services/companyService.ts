import { PrismaClient, Company, CompanyFormField } from '@prisma/client';

const prisma = new PrismaClient();

export const companyService = {
  // Create a new company
  async createCompany(data: Omit<Company, 'id'>): Promise<Company> {
    return prisma.company.create({ data });
  },

  // Get all companies
  async getAllCompanies(): Promise<Company[]> {
    return prisma.company.findMany({ orderBy: { name: 'asc' } });
  },

  // Get company by ID
  async getCompanyById(id: string): Promise<Company | null> {
    return prisma.company.findUnique({ where: { id } });
  },

  // Update company
  async updateCompany(id: string, data: Partial<Omit<Company, 'id'>>): Promise<Company> {
    return prisma.company.update({ where: { id }, data });
  },

  // Delete company
  async deleteCompany(id: string): Promise<Company> {
    return prisma.company.delete({ where: { id } });
  },

  // Get form fields for a company
  async getCompanyFormFields(companyId: string): Promise<CompanyFormField[]> {
    return prisma.companyFormField.findMany({
      where: { company_id: companyId },
      orderBy: { order: 'asc' },
    });
  },
}; 