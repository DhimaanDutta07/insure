import { z } from "zod";

// Schema for creating a weighing inspection
export const CreateWeighingInspectionSchema = z.object({
    truck_number: z.string().min(1, "Truck number is required"),
    token_number: z.string(),
    material_id: z.string().uuid("Valid material ID is required").optional().nullable(),
    gross_weight: z.number().positive("Gross weight must be a positive number"),
    tare_weight: z.number().positive("Tare weight must be a positive number"),
    net_weight: z.number().positive("Net weight must be a positive number"),
    inspected_by: z.string().uuid("Valid inspector ID is required")
  });

// Schema for getting a weighing inspection by ID
export const GetWeighingInspectionByIdSchema = z.object({
  id: z.string().uuid("Valid weighing inspection ID is required")
});

// Export the types for use in other files
export type CreateWeighingInspection = z.infer<typeof CreateWeighingInspectionSchema>;
export type GetWeighingInspectionById = z.infer<typeof GetWeighingInspectionByIdSchema>;