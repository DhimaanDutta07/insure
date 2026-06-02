import { z } from 'zod';

export const companyFormFieldSchema = z.object({
  company_id: z.string().uuid(),
  label: z.string().min(1, 'Label is required'),
  field_type: z.string().min(1, 'Field type is required'),
  is_required: z.boolean(),
  order: z.number().int().min(0),
});

export const companyFormFieldUpdateSchema = companyFormFieldSchema.partial(); 