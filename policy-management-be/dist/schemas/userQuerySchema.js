"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userQuerySchema = void 0;
//userQuerySchema.ts
const zod_1 = require("zod");
// Zod Schema for Query Parameters Validation
exports.userQuerySchema = zod_1.z.object({
    limit: zod_1.z.string().optional().default("10"), // Default limit: 10
    offset: zod_1.z.string().optional().default("0"), // Default offset: 0
    withCount: zod_1.z.string().optional().default("false"), // Convert to boolean later
    orderBy: zod_1.z.string().optional().default(JSON.stringify({ created_at: "desc" })), // Default sorting
});
