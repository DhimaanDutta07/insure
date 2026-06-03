"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commissionController = void 0;
const commissionService_1 = require("../services/commissionService");
const commissionSchema_1 = require("../schemas/commissionSchema");
const zod_1 = require("zod");
const prismaClient_1 = __importDefault(require("../utils/prismaClient"));
exports.commissionController = {
    async createCommission(req, res) {
        try {
            const data = commissionSchema_1.commissionSchema.parse(req.body);
            const commission = await commissionService_1.commissionService.createCommission({
                ...data,
                description: data.description ?? null,
            });
            res.status(201).json(commission);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({ error: error.errors });
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    },
    async getAllCommissions(req, res) {
        try {
            const commissions = await commissionService_1.commissionService.getAllCommissions();
            res.status(200).json(commissions);
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    async getCommissionById(req, res) {
        try {
            const commission = await commissionService_1.commissionService.getCommissionById(req.params.id);
            if (!commission)
                return res.status(404).json({ error: 'Commission not found' });
            res.status(200).json(commission);
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    async updateCommission(req, res) {
        try {
            const data = commissionSchema_1.commissionUpdateSchema.parse(req.body);
            const commission = await commissionService_1.commissionService.updateCommission(req.params.id, data);
            res.status(200).json(commission);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({ error: error.errors });
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    },
    async deleteCommission(req, res) {
        try {
            const result = await commissionService_1.commissionService.deleteCommission(req.params.id);
            res.status(200).json(result);
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    // Get commission rules for a specific policy name
    async getCommissionRulesByPolicyName(req, res) {
        try {
            const policyNameId = req.params.policyNameId;
            const commissionRules = await prismaClient_1.default.commissionRule.findMany({
                where: {
                    policy_name_id: policyNameId,
                    is_active: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
            res.status(200).json(commissionRules);
        }
        catch (error) {
            console.error('Error fetching commission rules:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
};
