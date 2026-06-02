import { z } from 'zod';

export const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  phone: z.coerce.number().nullable().optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
})
export const clientUpdateSchema = clientSchema.partial();