//userQuerySchema.ts
import { z } from "zod";

// Zod Schema for Query Parameters Validation
export const userQuerySchema = z.object({
    limit: z.string().optional().default("10"), // Default limit: 10
    offset: z.string().optional().default("0"), // Default offset: 0
    withCount: z.string().optional().default("false"), // Convert to boolean later
    orderBy: z.string().optional().default(JSON.stringify({ created_at: "desc" })), // Default sorting
  });