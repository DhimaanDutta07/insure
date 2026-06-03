"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.companyService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.companyService = {
    // Create a new company
    async createCompany(data) {
        return prisma.company.create({ data });
    },
    // Get all companies
    async getAllCompanies() {
        return prisma.company.findMany({ orderBy: { name: 'asc' } });
    },
    // Get company by ID
    async getCompanyById(id) {
        return prisma.company.findUnique({ where: { id } });
    },
    // Update company
    async updateCompany(id, data) {
        return prisma.company.update({ where: { id }, data });
    },
    // Delete company
    async deleteCompany(id) {
        return prisma.company.delete({ where: { id } });
    },
    // Get form fields for a company
    async getCompanyFormFields(companyId) {
        return prisma.companyFormField.findMany({
            where: { company_id: companyId },
            orderBy: { order: 'asc' },
        });
    },
};
