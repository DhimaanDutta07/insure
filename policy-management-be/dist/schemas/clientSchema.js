"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientUpdateSchema = exports.clientSchema = void 0;
const zod_1 = require("zod");
exports.clientSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    description: zod_1.z.string().optional(),
    phone: zod_1.z.coerce.number().nullable().optional(),
    status: zod_1.z.enum(['Active', 'Inactive']).optional(),
});
exports.clientUpdateSchema = exports.clientSchema.partial();
