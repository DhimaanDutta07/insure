import { z } from 'zod';

export const QualityInspectionSchema = z.object({
  truck_registration_id: z.string().uuid({
    message: 'Valid truck registration ID is required',
  }),
  material_id: z.string().uuid({
    message: 'Valid material ID is required',
  }),
  starch_percentage: z
    .number()
    .min(0, { message: 'Starch percentage must be at least 0%' })
    .max(100, { message: 'Starch percentage cannot exceed 100%' })
    .optional(),
  moisture_percentage: z
    .number()
    .min(0, { message: 'Moisture percentage must be at least 0%' })
    .max(100, { message: 'Moisture percentage cannot exceed 100%' })
    .optional(),
  tfm_percentage: z
    .number()
    .min(0, { message: 'TFM percentage must be at least 0%' })
    .max(100, { message: 'TFM percentage cannot exceed 100%' })
    .optional(),
  remarks: z.string().optional(),
  result: z.enum(['Accepted', 'Rejected']),
  inspected_by: z.string().uuid({
    message: 'Valid inspector ID is required',
  }),
});

export const CreateQualityInspectionSchema = z.object({
  truck_number: z.string({
    required_error: 'Truck registration number is required',
  }),
  token_number: z.string(),
  material_id: z.string().uuid({
    message: 'Valid material ID is required',
  }).optional(),
  starch_percentage: z
    .number()
    .min(0, { message: 'Starch percentage must be at least 0%' })
    .max(100, { message: 'Starch percentage cannot exceed 100%' })
    .optional(),
  moisture_percentage: z
    .number()
    .min(0, { message: 'Moisture percentage must be at least 0%' })
    .max(100, { message: 'Moisture percentage cannot exceed 100%' })
    .optional(),
  tfm_percentage: z
    .number()
    .min(0, { message: 'TFM percentage must be at least 0%' })
    .max(100, { message: 'TFM percentage cannot exceed 100%' })
    .optional(),
  remarks: z.string().optional(),
  result: z.enum(['Accepted', 'Rejected']),
  inspected_by: z.string().uuid({
    message: 'Valid inspector ID is required',
  }),
});

export type QualityInspection = z.infer<typeof QualityInspectionSchema>;
export type CreateQualityInspection = z.infer<typeof CreateQualityInspectionSchema>;