import { z } from 'zod';

// Base schemas for common fields
const baseImageSchema = z.object({
  url: z.string().url(),
  directUrl: z.string().url().optional(),
  isPlaceholder: z.boolean().optional(),
});

const basePolicyReceiptSchema = z.object({
  policy_number: z.string(),
  policy_type: z.string(),
  remark: z.string().nullable(),
  site_id: z.string().nullable(),
  user_id: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
  is_deleted: z.boolean(),
});

// Document categories for validation
const documentCategoryEnum = z.enum([
  'POLICY_DOCUMENT',
  'PROPOSER_DOCUMENT',
  'INSURED_MEMBER_DOCUMENT',
]);

// Request schemas
export const createPolicyReceiptSchema = z.object({
  body: z.object({
    policy_number: z.string(),
    policy_type: z.string(),
    remark: z.string().optional(),
    site_id: z.string().optional(),
    // Optionally, you can add metadata for documents here
  }),
  files: z.object({
    policy_document: z.any().optional(), // Single file
    policyholder_document: z.any().optional(), // Single file
    family_member_documents: z.array(z.any()).optional(), // Multiple files
    images: z.array(z.any()).optional(), // Multiple files
  }),
  headers: z.object({
    authorization: z.string(),
  }),
});

export const updatePolicyReceiptSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    policy_number: z.string().optional(),
    policy_type: z.string().optional(),
    remark: z.string().optional(),
    user_id: z.string().optional(),
    site_id: z.string().optional(),
    // Optionally, you can add metadata for documents here
  }),
  files: z.object({
    policy_document: z.any().optional(),
    policyholder_document: z.any().optional(),
    family_member_documents: z.array(z.any()).optional(),
    images: z.array(z.any()).optional(),
  }).optional(),
});

export const getPolicyReceiptSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const deletePolicyReceiptSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const getPolicyReceiptsByTimePeriodSchema = z.object({
  params: z.object({
    timePeriod: z.enum(['today', 'yesterday', 'thisWeek', 'thisMonth', 'lastMonth', 'custom', 'last3Days']),
  }),
  query: z.object({
    siteId: z.string().optional(),
    start: z.string().optional(),
    end: z.string().optional(),
  }),
});

// Response schemas
export const policyReceiptResponseSchema = basePolicyReceiptSchema.extend({
  id: z.string(),
  images: z.array(baseImageSchema),
  policy_document: z.string().url().optional(),
  policyholder_document: z.string().url().optional(),
  family_member_documents: z.array(z.string().url()).optional(),
});

export const policyReceiptListResponseSchema = z.array(policyReceiptResponseSchema);

// Types
export type CreatePolicyReceiptRequest = z.infer<typeof createPolicyReceiptSchema>;
export type UpdatePolicyReceiptRequest = z.infer<typeof updatePolicyReceiptSchema>;
export type GetPolicyReceiptRequest = z.infer<typeof getPolicyReceiptSchema>;
export type DeletePolicyReceiptRequest = z.infer<typeof deletePolicyReceiptSchema>;
export type GetPolicyReceiptsByTimePeriodRequest = z.infer<typeof getPolicyReceiptsByTimePeriodSchema>;
export type PolicyReceiptResponse = z.infer<typeof policyReceiptResponseSchema>;
export type PolicyReceiptListResponse = z.infer<typeof policyReceiptListResponseSchema>; 