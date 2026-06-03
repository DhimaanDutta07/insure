"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.companyFormFieldController = void 0;
const companyFormFieldService_1 = require("../services/companyFormFieldService");
const companyFormFieldSchema_1 = require("../schemas/companyFormFieldSchema");
const zod_1 = require("zod");
exports.companyFormFieldController = {
    async createCompanyFormField(req, res) {
        try {
            const data = companyFormFieldSchema_1.companyFormFieldSchema.parse(req.body);
            const formField = await companyFormFieldService_1.companyFormFieldService.createCompanyFormField(data);
            res.status(201).json(formField);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({ error: error.errors });
            }
            else {
                res.status(500).json({ error: 'Failed to create form field' });
            }
        }
    },
    async getCompanyFormFields(req, res) {
        try {
            const companyId = req.params.companyId;
            const fields = await companyFormFieldService_1.companyFormFieldService.getCompanyFormFields(companyId);
            res.json(fields);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch form fields' });
        }
    },
    async getCompanyFormFieldById(req, res) {
        try {
            const formField = await companyFormFieldService_1.companyFormFieldService.getCompanyFormFieldById(req.params.id);
            if (!formField)
                return res.status(404).json({ error: 'Form field not found' });
            res.json(formField);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch form field' });
        }
    },
    async updateCompanyFormField(req, res) {
        try {
            const data = companyFormFieldSchema_1.companyFormFieldUpdateSchema.parse(req.body);
            const formField = await companyFormFieldService_1.companyFormFieldService.updateCompanyFormField(req.params.id, data);
            res.json(formField);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({ error: error.errors });
            }
            else {
                res.status(500).json({ error: 'Failed to update form field' });
            }
        }
    },
    async deleteCompanyFormField(req, res) {
        try {
            await companyFormFieldService_1.companyFormFieldService.deleteCompanyFormField(req.params.id);
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to delete form field' });
        }
    },
};
