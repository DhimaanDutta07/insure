import { z } from "zod";

// Base schema for raw material validation
export const rawMaterialSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3).max(100).trim(),
  description: z.string().trim().optional(),
  starch: z.number().min(0).max(100).nonnegative(), // Percentage of starch (0-100%)
  moisture: z.number().min(0).max(100).nonnegative(), // Percentage of moisture (0-100%)
  tfm: z.number().min(0).max(100).nonnegative(), // Percentage of tfm (0-100%)
  category: z.string(),
  subCategory: z.string(),
  created_at: z.date().optional()
});

// Schema for creating a new raw material
export const rawMaterialCreateSchema = rawMaterialSchema.omit({ id: true, created_at: true });

// Schema for updating an existing raw material
export const rawMaterialUpdateSchema = rawMaterialSchema.partial().omit({ id: true, created_at: true });

// Schema to validate query parameters for listing raw materials
export const rawMaterialQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  name: z.string().optional()
});

// Schema to validate search parameters
export const rawMaterialSearchSchema = z.object({
  name: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10)
});

export const combinedRawMaterialQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  name: z.string().optional(),
  searchTerm: z.string().optional(), // For full search across multiple fields
});

// Type for the combined query
export type CombinedRawMaterialQuery = z.infer<typeof combinedRawMaterialQuerySchema>;
// Schema for the response DTO
export const rawMaterialResponseSchema = rawMaterialSchema;

// Type definitions derived from the schemas for use in the application
export type RawMaterial = z.infer<typeof rawMaterialSchema>;
export type RawMaterialCreate = z.infer<typeof rawMaterialCreateSchema>;
export type RawMaterialUpdate = z.infer<typeof rawMaterialUpdateSchema>;
export type RawMaterialQuery = z.infer<typeof rawMaterialQuerySchema>;
export type RawMaterialSearch = z.infer<typeof rawMaterialSearchSchema>;
export type RawMaterialResponse = z.infer<typeof rawMaterialResponseSchema>;