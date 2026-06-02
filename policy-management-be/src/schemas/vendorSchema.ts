// import { z } from 'zod';

// // Define the VendorStatus enum
// export const VendorStatusEnum = z.enum(["Active", "Inactive"]);
// export type VendorStatus = z.infer<typeof VendorStatusEnum>;

// // Regex patterns for stricter validation
// const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;  // Format: ABCDE1234F
// const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/; // 15-digit GST format

// // Base vendor schema
// export const vendorSchema = z.object({
//   id: z.string().uuid(),
//   name: z.string().min(3).max(255).trim(),
//   phone: z.string().min(5).max(100).trim(),
//   email: z.string().email().max(255).trim(),
//   pan_no: z.string().trim().length(10).regex(panRegex, "Invalid PAN format"),
//   gst: z.string().length(15).regex(gstRegex, "Invalid GST format"),
//   msme: z.string().length(19, "MSME number must be exactly 19 characters"),
//   status: VendorStatusEnum.default('Active'),
//   created_at: z.date().optional(),
//   updated_at: z.date().optional()
// });

// // Schema for creating a new vendor
// export const vendorCreateSchema = vendorSchema
//   .omit({ id: true, created_at: true, updated_at: true });

// // Schema for updating an existing vendor
// export const vendorUpdateSchema = vendorSchema
//   .partial()
//   .omit({ pan_no: true, gst: true, msme: true, created_at: true, updated_at: true });

// // Schema for query parameters
// export const vendorQuerySchema = z.object({
//   page: z.coerce.number().positive().default(1),
//   limit: z.coerce.number().positive().default(10),
//   status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
//   name: z.string().optional(),
//   searchTerm: z.string().optional()
// });

// // Define types from schemas
// export type Vendor = z.infer<typeof vendorSchema>;
// export type VendorCreate = z.infer<typeof vendorCreateSchema>;
// export type VendorUpdate = z.infer<typeof vendorUpdateSchema>;
// export type VendorQuery = z.infer<typeof vendorQuerySchema>;
