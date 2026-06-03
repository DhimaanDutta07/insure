"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.policyTypeController = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
// Validation schemas
const createPolicyTypeSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
});
const updatePolicyTypeSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less").optional(),
});
exports.policyTypeController = {
    // Get all policy types
    async getAllPolicyTypes(req, res) {
        try {
            const policyTypes = await prisma.policyType.findMany({
                select: {
                    id: true,
                    name: true,
                    _count: {
                        select: {
                            policies: true
                        }
                    }
                },
                orderBy: {
                    name: 'asc',
                },
            });
            res.json(policyTypes);
        }
        catch (error) {
            console.error("Error fetching policy types:", error);
            res.status(500).json({ error: "Failed to fetch policy types" });
        }
    },
    // Get single policy type by ID
    async getPolicyTypeById(req, res) {
        try {
            const policyType = await prisma.policyType.findUnique({
                where: { id: req.params.id },
                select: {
                    id: true,
                    name: true,
                    _count: {
                        select: {
                            policies: true
                        }
                    }
                },
            });
            if (!policyType) {
                return res.status(404).json({ error: "Policy type not found" });
            }
            res.json(policyType);
        }
        catch (error) {
            console.error("Error fetching policy type:", error);
            res.status(500).json({ error: "Failed to fetch policy type" });
        }
    },
    // Create new policy type
    async createPolicyType(req, res) {
        try {
            const data = createPolicyTypeSchema.parse(req.body);
            const policyType = await prisma.policyType.create({
                data: {
                    name: data.name,
                },
                select: {
                    id: true,
                    name: true,
                },
            });
            res.status(201).json(policyType);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({ error: error.errors });
            }
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                return res.status(409).json({ error: "Policy type name already exists" });
            }
            console.error("Error creating policy type:", error);
            res.status(500).json({ error: "Failed to create policy type" });
        }
    },
    // Update policy type
    async updatePolicyType(req, res) {
        try {
            const data = updatePolicyTypeSchema.parse(req.body);
            const policyType = await prisma.policyType.update({
                where: { id: req.params.id },
                data: data,
                select: {
                    id: true,
                    name: true,
                },
            });
            res.json(policyType);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({ error: error.errors });
            }
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    return res.status(409).json({ error: "Policy type name already exists" });
                }
                if (error.code === 'P2025') {
                    return res.status(404).json({ error: "Policy type not found" });
                }
            }
            console.error("Error updating policy type:", error);
            res.status(500).json({ error: "Failed to update policy type" });
        }
    },
    // Delete policy type
    async deletePolicyType(req, res) {
        try {
            // Check if policy type has associated policies
            const policyType = await prisma.policyType.findUnique({
                where: { id: req.params.id },
                include: {
                    _count: {
                        select: {
                            policies: true
                        }
                    }
                }
            });
            if (!policyType) {
                return res.status(404).json({ error: "Policy type not found" });
            }
            if (policyType._count.policies > 0) {
                return res.status(400).json({
                    error: `Cannot delete policy type. It has ${policyType._count.policies} associated policies.`
                });
            }
            await prisma.policyType.delete({
                where: { id: req.params.id },
            });
            res.status(204).send();
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                return res.status(404).json({ error: "Policy type not found" });
            }
            console.error("Error deleting policy type:", error);
            res.status(500).json({ error: "Failed to delete policy type" });
        }
    },
};
