import { z } from 'zod';

export const commissionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

export const commissionUpdateSchema = commissionSchema.partial(); 