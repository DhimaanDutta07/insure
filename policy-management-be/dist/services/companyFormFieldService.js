"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.companyFormFieldService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.companyFormFieldService = {
    // Create a new company form field
    async createCompanyFormField(data) {
        return prisma.companyFormField.create({ data });
    },
    // Get all form fields for a company
    async getCompanyFormFields(companyId) {
        return prisma.companyFormField.findMany({
            where: { company_id: companyId },
            orderBy: { order: 'asc' },
        });
    },
    // Get a form field by ID
    async getCompanyFormFieldById(id) {
        return prisma.companyFormField.findUnique({ where: { id } });
    },
    // Update a form field
    async updateCompanyFormField(id, data) {
        return prisma.companyFormField.update({ where: { id }, data });
    },
    // Delete a form field
    async deleteCompanyFormField(id) {
        return prisma.companyFormField.delete({ where: { id } });
    },
};
