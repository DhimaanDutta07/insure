import { z } from 'zod';

export const companySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.enum(['HEALTH', 'LIFE']),
  description: z.string().optional(),
});

export const companyUpdateSchema = companySchema.partial(); 