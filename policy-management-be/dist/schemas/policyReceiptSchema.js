"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.policyReceiptListResponseSchema = exports.policyReceiptResponseSchema = exports.getPolicyReceiptsByTimePeriodSchema = exports.deletePolicyReceiptSchema = exports.getPolicyReceiptSchema = exports.updatePolicyReceiptSchema = exports.createPolicyReceiptSchema = void 0;
const zod_1 = require("zod");
// Base schemas for common fields
const baseImageSchema = zod_1.z.object({
    url: zod_1.z.string().url(),
    directUrl: zod_1.z.string().url().optional(),
    isPlaceholder: zod_1.z.boolean().optional(),
});
const basePolicyReceiptSchema = zod_1.z.object({
    policy_number: zod_1.z.string(),
    policy_type: zod_1.z.string(),
    remark: zod_1.z.string().nullable(),
    site_id: zod_1.z.string().nullable(),
    user_id: zod_1.z.string(),
    created_at: zod_1.z.date(),
    updated_at: zod_1.z.date(),
    is_deleted: zod_1.z.boolean(),
});
// Document categories for validation
const documentCategoryEnum = zod_1.z.enum([
    'POLICY_DOCUMENT',
    'PROPOSER_DOCUMENT',
    'INSURED_MEMBER_DOCUMENT',
]);
// Request schemas
exports.createPolicyReceiptSchema = zod_1.z.object({
    body: zod_1.z.object({
        policy_number: zod_1.z.string(),
        policy_type: zod_1.z.string(),
        remark: zod_1.z.string().optional(),
        site_id: zod_1.z.string().optional(),
        // Optionally, you can add metadata for documents here
    }),
    files: zod_1.z.object({
        policy_document: zod_1.z.any().optional(), // Single file
        policyholder_document: zod_1.z.any().optional(), // Single file
        family_member_documents: zod_1.z.array(zod_1.z.any()).optional(), // Multiple files
        images: zod_1.z.array(zod_1.z.any()).optional(), // Multiple files
    }),
    headers: zod_1.z.object({
        authorization: zod_1.z.string(),
    }),
});
exports.updatePolicyReceiptSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string(),
    }),
    body: zod_1.z.object({
        policy_number: zod_1.z.string().optional(),
        policy_type: zod_1.z.string().optional(),
        remark: zod_1.z.string().optional(),
        user_id: zod_1.z.string().optional(),
        site_id: zod_1.z.string().optional(),
        // Optionally, you can add metadata for documents here
    }),
    files: zod_1.z.object({
        policy_document: zod_1.z.any().optional(),
        policyholder_document: zod_1.z.any().optional(),
        family_member_documents: zod_1.z.array(zod_1.z.any()).optional(),
        images: zod_1.z.array(zod_1.z.any()).optional(),
    }).optional(),
});
exports.getPolicyReceiptSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string(),
    }),
});
exports.deletePolicyReceiptSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string(),
    }),
});
exports.getPolicyReceiptsByTimePeriodSchema = zod_1.z.object({
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
exports.policyReceiptResponseSchema = basePolicyReceiptSchema.extend({
    id: zod_1.z.string(),
    images: zod_1.z.array(baseImageSchema),
    policy_document: zod_1.z.string().url().optional(),
    policyholder_document: zod_1.z.string().url().optional(),
    family_member_documents: zod_1.z.array(zod_1.z.string().url()).optional(),
});
exports.policyReceiptListResponseSchema = zod_1.z.array(exports.policyReceiptResponseSchema);
