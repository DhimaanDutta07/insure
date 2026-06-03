"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reimbursementUpdateSchema = exports.reimbursementSchema = void 0;
const zod_1 = require("zod");
exports.reimbursementSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required"),
    description: zod_1.z.string().optional(),
});
exports.reimbursementUpdateSchema = exports.reimbursementSchema.partial();
