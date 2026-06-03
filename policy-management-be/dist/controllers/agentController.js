"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentController = void 0;
const agentService_1 = require("../services/agentService");
const agentSchema_1 = require("../schemas/agentSchema");
const zod_1 = require("zod");
exports.agentController = {
    async createAgent(req, res) {
        try {
            const data = agentSchema_1.agentSchema.parse(req.body);
            const agent = await agentService_1.agentService.createAgent({
                ...data,
                phone: data.phone ?? null,
                description: data.description ?? null,
                status: data.status || 'Active',
            });
            res.status(201).json(agent);
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
    async getAllAgents(req, res) {
        try {
            const agents = await agentService_1.agentService.getAllAgents();
            res.status(200).json(agents);
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    async getAgentById(req, res) {
        try {
            const agent = await agentService_1.agentService.getAgentById(req.params.id);
            if (!agent)
                return res.status(404).json({ error: 'Agent not found' });
            res.status(200).json(agent);
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    async updateAgent(req, res) {
        try {
            const data = agentSchema_1.agentUpdateSchema.parse(req.body);
            const agent = await agentService_1.agentService.updateAgent(req.params.id, data);
            res.status(200).json(agent);
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
    async deleteAgent(req, res) {
        try {
            await agentService_1.agentService.deleteAgent(req.params.id);
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },
};
