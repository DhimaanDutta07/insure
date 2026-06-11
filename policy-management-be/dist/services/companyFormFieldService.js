"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.companyFormFieldService = void 0;
const prismaClient_1 = __importDefault(require("../utils/prismaClient"));
exports.companyFormFieldService = {
    // Create a new company form field
    async createCompanyFormField(data) {
        return prismaClient_1.default.companyFormField.create({ data });
    },
    // Get all form fields for a company
    async getCompanyFormFields(companyId) {
        return prismaClient_1.default.companyFormField.findMany({
            where: { company_id: companyId },
            orderBy: { order: 'asc' },
        });
    },
    // Get a form field by ID
    async getCompanyFormFieldById(id) {
        return prismaClient_1.default.companyFormField.findUnique({ where: { id } });
    },
    // Update a form field
    async updateCompanyFormField(id, data) {
        return prismaClient_1.default.companyFormField.update({ where: { id }, data });
    },
    // Delete a form field
    async deleteCompanyFormField(id) {
        return prismaClient_1.default.companyFormField.delete({ where: { id } });
    },
};
