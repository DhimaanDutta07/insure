"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentUpdateSchema = exports.agentSchema = void 0;
const zod_1 = require("zod");
exports.agentSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    phone: zod_1.z.string().nullable().optional(),
    description: zod_1.z.string().optional(),
    status: zod_1.z.enum(['Active', 'Inactive']).optional(),
});
exports.agentUpdateSchema = exports.agentSchema.partial();
