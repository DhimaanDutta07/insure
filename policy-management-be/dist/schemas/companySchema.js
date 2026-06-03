"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.companyUpdateSchema = exports.companySchema = void 0;
const zod_1 = require("zod");
exports.companySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    category: zod_1.z.enum(['HEALTH', 'LIFE']),
    description: zod_1.z.string().optional(),
});
exports.companyUpdateSchema = exports.companySchema.partial();
