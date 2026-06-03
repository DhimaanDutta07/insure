"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenResponseSchema = exports.materialReceiptListResponseSchema = exports.materialReceiptResponseSchema = exports.getMaterialReceiptsByTimePeriodSchema = exports.deleteMaterialReceiptSchema = exports.getMaterialReceiptSchema = exports.updateMaterialReceiptSchema = exports.createMaterialReceiptSchema = void 0;
const zod_1 = require("zod");
// Base schemas for common fields
const baseImageSchema = zod_1.z.object({
    url: zod_1.z.string().url(),
    directUrl: zod_1.z.string().url().optional(),
    isPlaceholder: zod_1.z.boolean().optional(),
});
const baseMaterialReceiptSchema = zod_1.z.object({
    item_group_id: zod_1.z.string().nullable(),
    item_name_id: zod_1.z.string().nullable(),
    remark: zod_1.z.string().nullable(),
    token_number: zod_1.z.string().nullable(),
    site_id: zod_1.z.string().nullable(),
    user_id: zod_1.z.string(),
    created_at: zod_1.z.date(),
    updated_at: zod_1.z.date(),
    is_deleted: zod_1.z.boolean(),
});
// Request schemas
exports.createMaterialReceiptSchema = zod_1.z.object({
    body: zod_1.z.object({
        item_group_id: zod_1.z.string().optional(),
        item_name_id: zod_1.z.string().optional(),
        remark: zod_1.z.string().optional(),
        inward_number: zod_1.z.string(),
        site_id: zod_1.z.string().optional(),
    }),
    files: zod_1.z.array(zod_1.z.any()),
    headers: zod_1.z.object({
        authorization: zod_1.z.string(),
    }),
});
exports.updateMaterialReceiptSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string(),
    }),
    body: zod_1.z.object({
        item_group_id: zod_1.z.string().optional(),
        item_name_id: zod_1.z.string().optional(),
        remark: zod_1.z.string().optional(),
        user_id: zod_1.z.string().optional(),
        token_number: zod_1.z.string().optional(),
        site_id: zod_1.z.string().optional(),
    }),
    files: zod_1.z.array(zod_1.z.any()).optional(),
});
exports.getMaterialReceiptSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string(),
    }),
});
exports.deleteMaterialReceiptSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string(),
    }),
});
exports.getMaterialReceiptsByTimePeriodSchema = zod_1.z.object({
    params: zod_1.z.object({
        timePeriod: zod_1.z.enum(['today', 'yesterday', 'thisWeek', 'thisMonth', 'lastMonth', 'custom', 'last3Days']),
    }),
    query: zod_1.z.object({
        siteId: zod_1.z.string().optional(),
        start: zod_1.z.string().optional(),
        end: zod_1.z.string().optional(),
    }),
});
// Response schemas
exports.materialReceiptResponseSchema = baseMaterialReceiptSchema.extend({
    id: zod_1.z.string(),
    images: zod_1.z.array(baseImageSchema),
});
exports.materialReceiptListResponseSchema = zod_1.z.array(exports.materialReceiptResponseSchema);
exports.tokenResponseSchema = zod_1.z.object({
    inward_number: zod_1.z.string(),
});
