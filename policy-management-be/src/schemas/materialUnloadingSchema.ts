// materialUnloadingSchema.ts
import { z } from "zod";

export const CreateMaterialUnloadingSchema = z.object({
  truck_number: z.string().min(1, "Truck number is required"),
  token_number: z.string(),
  // po_id: z.string().uuid("Invalid purchase order ID format").optional(),
  gross_weight: z.number().min(0, "Gross weight must be greater than or equal to 0"),
  tare_weight: z.number().min(0, "Tare weight must be greater than or equal to 0"),
  net_weight: z.number().min(0, "Net weight must be greater than or equal to 0"),
  starch: z.number().min(0).max(100).default(0),
  moisture: z.number().min(0).max(100).default(0),
  remarks : z.string().optional(),
  tfm: z.number().min(0).max(100).default(0),
  challan_no: z.string().min(1, "Challan number is required").optional(),
  inspected_by: z.string().uuid("Invalid inspector ID format")
});

export type CreateMaterialUnloading = z.infer<typeof CreateMaterialUnloadingSchema>;