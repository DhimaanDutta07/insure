import { z } from 'zod';

// Base schemas for common fields
const baseImageSchema = z.object({
  url: z.string().url(),
  directUrl: z.string().url().optional(),
  isPlaceholder: z.boolean().optional(),
});

const baseMaterialReceiptSchema = z.object({
  item_group_id: z.string().nullable(),
  item_name_id: z.string().nullable(),
  remark: z.string().nullable(),
  token_number: z.string().nullable(),
  site_id: z.string().nullable(),
  user_id: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
  is_deleted: z.boolean(),
});

// Request schemas
export const createMaterialReceiptSchema = z.object({
  body: z.object({
    item_group_id: z.string().optional(),
    item_name_id: z.string().optional(),
    remark: z.string().optional(),
    inward_number: z.string(),
    site_id: z.string().optional(),
  }),
  files: z.array(z.any()),
  headers: z.object({
    authorization: z.string(),
  }),
});

export const updateMaterialReceiptSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    item_group_id: z.string().optional(),
    item_name_id: z.string().optional(),
    remark: z.string().optional(),
    user_id: z.string().optional(),
    token_number: z.string().optional(),
    site_id: z.string().optional(),
  }),
  files: z.array(z.any()).optional(),
});

export const getMaterialReceiptSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const deleteMaterialReceiptSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const getMaterialReceiptsByTimePeriodSchema = z.object({
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
export const materialReceiptResponseSchema = baseMaterialReceiptSchema.extend({
  id: z.string(),
  images: z.array(baseImageSchema),
});

export const materialReceiptListResponseSchema = z.array(materialReceiptResponseSchema);

export const tokenResponseSchema = z.object({
  inward_number: z.string(),
});

// Types
export type CreateMaterialReceiptRequest = z.infer<typeof createMaterialReceiptSchema>;
export type UpdateMaterialReceiptRequest = z.infer<typeof updateMaterialReceiptSchema>;
export type GetMaterialReceiptRequest = z.infer<typeof getMaterialReceiptSchema>;
export type DeleteMaterialReceiptRequest = z.infer<typeof deleteMaterialReceiptSchema>;
export type GetMaterialReceiptsByTimePeriodRequest = z.infer<typeof getMaterialReceiptsByTimePeriodSchema>;
export type MaterialReceiptResponse = z.infer<typeof materialReceiptResponseSchema>;
export type MaterialReceiptListResponse = z.infer<typeof materialReceiptListResponseSchema>;
export type TokenResponse = z.infer<typeof tokenResponseSchema>; 