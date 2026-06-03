"use strict";
// import { z } from "zod";
// // Enum for purchase order status
// export const PurchaseOrderStatusEnum = z.enum(
//   ["Pending", "InProgress","Active", "ReOpened", "Completed", "Cancelled", "Expired"],
//   { message: "Invalid status. Must be one of: Pending, Inprogress, Reopened, Completed, Cancelled." }
// );
// // Enum for units
// export const UnitEnum = z.enum(["kg", "tons"], {
//   message: "Invalid unit. Must be one of: kg, tons.",
// });
// // Base schema for common fields
// export const purchaseOrderSchema = z.object({
//   id: z.string().uuid({ message: "Invalid ID. Must be a valid UUID." }),
//   vendor_id: z.string().uuid({ message: "Invalid vendor ID. Must be a valid UUID." }),
//   material_id: z.string().uuid({ message: "Invalid material ID. Must be a valid UUID." }),
//   created_by_id: z.string().uuid({ message: "Invalid created by ID. Must be a valid UUID." }),
//   quantity: z.number().positive({ message: "Quantity must be a positive number." })
//     .refine(val => val <= 1000000, { message: "Quantity exceeds maximum allowed value." }),
//   amount: z.number().positive({ message: "Amount must be a positive number." })
//     .optional()
//     .refine(val => val === undefined || val <= 10000000, { message: "Amount exceeds maximum allowed value." }),
//   received_quantity: z.number().positive({ message: "Received quantity must be a positive number." })
//     .optional()
//     .refine(val => val === undefined || val <= 1000000, { message: "Received quantity exceeds maximum allowed value." }),
//   unit: UnitEnum,
//   status: PurchaseOrderStatusEnum,
//   expiry_date: z.date({ message: "Expiry date must be a valid date." }),
//   issued_at: z.date({ message: "Issued date must be a valid date." }),
//   created_at: z.date({ message: "Created at must be a valid date." }),
//   updated_at: z.date({ message: "Updated at must be a valid date." }),
//   document_path: z.string().max(255, { message: "Document path cannot exceed 255 characters." }).optional(),
//   document_name: z.string().max(100, { message: "Document name cannot exceed 100 characters." }).optional(),
//   po_number: z.string()
//     .max(50, { message: "PO number cannot exceed 50 characters." })
//     .regex(
//       /^PO\/HO\/\d{2}-\d{2}\/\d+$/,
//       { message: "PO number must follow the format PO/HO/YY-YY/###" }
//     )
//     .optional(),
// });
// // Schema for creating a new purchase order
// export const purchaseOrderCreateSchema = purchaseOrderSchema.omit({
//   id: true,
//   created_at: true,
//   updated_at: true,
//   issued_at: true,
// }).extend({
//   created_by_id: z.string().uuid({ message: "Invalid created by ID. Must be a valid UUID." }),
//   document_path: z.string().max(255, { message: "Document path cannot exceed 255 characters." }).optional(),
//   document_name: z.string().max(100, { message: "Document name cannot exceed 100 characters." }).optional(),
//   issued_at: z.date().optional(), // Allow optional override of issued_at
//   po_number: z.string()
//     .max(50, { message: "PO number cannot exceed 50 characters." })
//     .regex(
//       /^PO\/HO\/\d{2}-\d{2}\/\d+$/,
//       { message: "PO number must follow the format PO/HO/YY-YY/###" }
//     )
//     .optional(),
// });
// // Schema for updating an existing purchase order
// export const purchaseOrderUpdateSchema = purchaseOrderSchema.partial().extend({
//   // Add specific validation for update scenario
//   status: PurchaseOrderStatusEnum.optional(),
//   received_quantity: z.number().positive({ message: "Received quantity must be a positive number." })
//     .optional()
//     .refine(val => val === undefined || val <= 1000000, { message: "Received quantity exceeds maximum allowed value." }),
//     po_number: z.string()
//     .max(50, { message: "PO number cannot exceed 50 characters." })
//     .regex(
//       /^PO\/HO\/\d{2}-\d{2}\/\d+$/,
//       { message: "PO number must follow the format PO/HO/YY-YY/###" }
//     )
//     .optional(),
// });
// // Type inference for enums
// export type PurchaseOrderStatus = z.infer<typeof PurchaseOrderStatusEnum>;
// export type PurchaseOrderUnit = z.infer<typeof UnitEnum>;
// // Schema for retrieving a purchase order
// export const purchaseOrderResponseSchema = z.object({
//   id: z.string().uuid({ message: "Invalid ID. Must be a valid UUID." }),
//   vendor_id: z.string().uuid({ message: "Invalid vendor ID. Must be a valid UUID." }),
//   material_id: z.string().uuid({ message: "Invalid material ID. Must be a valid UUID." }),
//   created_by_id: z.string().uuid({ message: "Invalid created by ID. Must be a valid UUID." }),
//   quantity: z.number().positive({ message: "Quantity must be a positive number." }),
//   received_quantity: z.number().positive({ message: "Received quantity must be a positive number." }).optional(),
//   unit: UnitEnum,
//   status: PurchaseOrderStatusEnum,
//   issued_at: z.string().datetime({ message: "Issued date must be a valid ISO 8601 datetime string." }),
//   expiry_date: z.string().datetime({ message: "Expiry date must be a valid ISO 8601 datetime string." }),
//   created_at: z.string().datetime({ message: "Created at must be a valid ISO 8601 datetime string." }),
//   updated_at: z.string().datetime({ message: "Updated at must be a valid ISO 8601 datetime string." }),
//   document_path: z.string().optional(),
//   document_name: z.string().optional(),
//   po_number: z.string().optional(),
//   vendor: z.object({
//     id: z.string().uuid({ message: "Invalid vendor ID. Must be a valid UUID." }),
//     name: z.string().min(1, { message: "Vendor name is required." }),
//   }),
//   material: z.object({
//     id: z.string().uuid({ message: "Invalid material ID. Must be a valid UUID." }),
//     name: z.string().min(1, { message: "Material name is required." }),
//   }),
//   created_by: z.object({
//     id: z.string().uuid({ message: "Invalid user ID. Must be a valid UUID." }),
//     name: z.string().min(1, { message: "User name is required." }),
//   }),
//   unloadings: z
//     .array(
//       z.object({
//         id: z.string().uuid({ message: "Invalid unloading ID. Must be a valid UUID." }),
//         quantity: z.number().positive({ message: "Quantity must be a positive number." }),
//         unloading_date: z.string().datetime({ message: "Unloading date must be a valid ISO 8601 datetime string." }),
//       })
//     )
//     .optional()
//     .default([]),
// });
// // Schema for filtering purchase orders
// export const purchaseOrderFilterSchema = z.object({
//   vendor_id: z.string().uuid({ message: "Invalid vendor ID. Must be a valid UUID." }).optional(),
//   material_id: z.string().uuid({ message: "Invalid material ID. Must be a valid UUID." }).optional(),
//   created_by_id: z.string().uuid({ message: "Invalid created by ID. Must be a valid UUID." }).optional(),
//   status: PurchaseOrderStatusEnum.optional(),
//   fromDate: z.string().datetime({ message: "From date must be a valid ISO 8601 datetime string." }).optional(),
//   toDate: z.string().datetime({ message: "To date must be a valid ISO 8601 datetime string." }).optional(),
//   page: z.coerce.number().int().positive().optional().default(1),
//   limit: z.coerce.number().int().positive().optional().default(10),
//   vendor_name: z.string().optional(),
//   po_number: z.string().optional(),
// });
// // Schema for validating purchase order ID in URL parameters
// export const purchaseOrderIdParamSchema = z.object({
//   id: z.string().uuid({
//     message: "Purchase order ID must be a valid UUID.",
//   }),
// });
