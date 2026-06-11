"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.companyService = void 0;
const prismaClient_1 = __importDefault(require("../utils/prismaClient"));
exports.companyService = {
    // Create a new company
    async createCompany(data) {
        return prismaClient_1.default.company.create({ data });
    },
    // Get all companies
    async getAllCompanies() {
        return prismaClient_1.default.company.findMany({ orderBy: { name: 'asc' } });
    },
    // Get company by ID
    async getCompanyById(id) {
        return prismaClient_1.default.company.findUnique({ where: { id } });
    },
    // Update company
    async updateCompany(id, data) {
        return prismaClient_1.default.company.update({ where: { id }, data });
    },
    // Delete company
    async deleteCompany(id) {
        return prismaClient_1.default.company.delete({ where: { id } });
    },
    // Get form fields for a company
    async getCompanyFormFields(companyId) {
        return prismaClient_1.default.companyFormField.findMany({
            where: { company_id: companyId },
            orderBy: { order: 'asc' },
        });
    },
};
