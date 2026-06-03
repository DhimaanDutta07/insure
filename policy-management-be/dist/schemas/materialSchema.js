"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rawMaterialResponseSchema = exports.combinedRawMaterialQuerySchema = exports.rawMaterialSearchSchema = exports.rawMaterialQuerySchema = exports.rawMaterialUpdateSchema = exports.rawMaterialCreateSchema = exports.rawMaterialSchema = void 0;
const zod_1 = require("zod");
// Base schema for raw material validation
exports.rawMaterialSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    name: zod_1.z.string().min(3).max(100).trim(),
    description: zod_1.z.string().trim().optional(),
    starch: zod_1.z.number().min(0).max(100).nonnegative(), // Percentage of starch (0-100%)
    moisture: zod_1.z.number().min(0).max(100).nonnegative(), // Percentage of moisture (0-100%)
    tfm: zod_1.z.number().min(0).max(100).nonnegative(), // Percentage of tfm (0-100%)
    category: zod_1.z.string(),
    subCategory: zod_1.z.string(),
    created_at: zod_1.z.date().optional()
});
// Schema for creating a new raw material
exports.rawMaterialCreateSchema = exports.rawMaterialSchema.omit({ id: true, created_at: true });
// Schema for updating an existing raw material
exports.rawMaterialUpdateSchema = exports.rawMaterialSchema.partial().omit({ id: true, created_at: true });
// Schema to validate query parameters for listing raw materials
exports.rawMaterialQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().optional().default(1),
    limit: zod_1.z.coerce.number().int().positive().optional().default(10),
    name: zod_1.z.string().optional()
});
// Schema to validate search parameters
exports.rawMaterialSearchSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().int().positive().optional().default(1),
    limit: zod_1.z.coerce.number().int().positive().optional().default(10)
});
exports.combinedRawMaterialQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().default(10),
    name: zod_1.z.string().optional(),
    searchTerm: zod_1.z.string().optional(), // For full search across multiple fields
});
// Schema for the response DTO
exports.rawMaterialResponseSchema = exports.rawMaterialSchema;
