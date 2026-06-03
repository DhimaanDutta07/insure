"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.companyController = void 0;
const companyService_1 = require("../services/companyService");
const companySchema_1 = require("../schemas/companySchema");
const zod_1 = require("zod");
exports.companyController = {
    async createCompany(req, res) {
        try {
            const data = companySchema_1.companySchema.parse(req.body);
            const company = await companyService_1.companyService.createCompany(data);
            res.status(201).json(company);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({ error: error.errors });
            }
            else {
                res.status(500).json({ error: 'Failed to create company' });
            }
        }
    },
    async getAllCompanies(req, res) {
        try {
            const companies = await companyService_1.companyService.getAllCompanies();
            res.json(companies);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch companies" });
        }
    },
    async getCompanyById(req, res) {
        try {
            const company = await companyService_1.companyService.getCompanyById(req.params.id);
            if (!company)
                return res.status(404).json({ error: 'Company not found' });
            res.json(company);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch company' });
        }
    },
    async updateCompany(req, res) {
        try {
            const data = companySchema_1.companyUpdateSchema.parse(req.body);
            const company = await companyService_1.companyService.updateCompany(req.params.id, data);
            res.json(company);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({ error: error.errors });
            }
            else {
                res.status(500).json({ error: 'Failed to update company' });
            }
        }
    },
    async deleteCompany(req, res) {
        try {
            await companyService_1.companyService.deleteCompany(req.params.id);
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to delete company' });
        }
    },
    async getCompanyFormFields(req, res) {
        try {
            const id = req.params.id;
            const fields = await companyService_1.companyService.getCompanyFormFields(id);
            res.json(fields);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch form fields" });
        }
    }
};
