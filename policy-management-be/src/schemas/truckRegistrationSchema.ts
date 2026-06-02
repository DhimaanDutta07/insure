// import { z } from "zod";
// import { Truck_Status } from "@prisma/client";

// // Truck Registration Schema for POST request
// export const CreateTruckRegistrationSchema = z.object({
//   truck_number: z.string().min(1, "Truck number is required"),
//   photo: z.string().min(1, "Photo is required"),
//   token: z.string().optional(),
//   inspected_by: z.string().uuid().optional(), // Added inspected_by field as optional
// });

// export type CreateTruckRegistration = z.infer<typeof CreateTruckRegistrationSchema>;

// // Response Schema
// export const TruckRegistrationResponseSchema = z.object({
//   id: z.string().uuid(),
//   truck_id: z.string().uuid(),
//   // vendor_id: z.string().uuid(),
//   token_number: z.string().optional(),
//   photo: z.string(),
//   material_id: z.string().uuid().optional().nullable(),
//   // po_id: z.string().uuid("Invalid purchase order ID format").optional(),
//   arrival_time: z.date().optional().nullable(),
//   weight_in: z.number().optional().nullable(),
//   weight_out: z.number().optional().nullable(),
//   status: z.nativeEnum(Truck_Status).default("Queued"),
//   inspected_by: z.string().uuid(), // Added inspected_by field as required
//   inspector: z.object({  // Add inspector object
//     id: z.string().uuid(),
//     name: z.string()
//   }).optional()
// });

// export type TruckRegistrationResponse = z.infer<typeof TruckRegistrationResponseSchema>;