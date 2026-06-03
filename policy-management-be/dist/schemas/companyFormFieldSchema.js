"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.companyFormFieldUpdateSchema = exports.companyFormFieldSchema = void 0;
const zod_1 = require("zod");
exports.companyFormFieldSchema = zod_1.z.object({
    company_id: zod_1.z.string().uuid(),
    label: zod_1.z.string().min(1, 'Label is required'),
    field_type: zod_1.z.string().min(1, 'Field type is required'),
    is_required: zod_1.z.boolean(),
    order: zod_1.z.number().int().min(0),
});
exports.companyFormFieldUpdateSchema = exports.companyFormFieldSchema.partial();
