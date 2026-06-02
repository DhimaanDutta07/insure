import { z } from 'zod';

export const agentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().nullable().optional(),
  description: z.string().optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
});

export const agentUpdateSchema = agentSchema.partial();