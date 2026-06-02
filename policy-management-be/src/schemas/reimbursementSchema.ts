import { z } from "zod";

export const reimbursementSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export const reimbursementUpdateSchema = reimbursementSchema.partial();
