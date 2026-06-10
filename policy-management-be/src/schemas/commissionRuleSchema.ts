import { z } from 'zod';
import { PolicyCreationStatus, DeductibleType, AgeCondition, ProductType, SICondition } from '@prisma/client';

export const PolicyCreationStatusEnum = z.nativeEnum(PolicyCreationStatus);
export const DeductibleTypeEnum = z.nativeEnum(DeductibleType);
export const AgeConditionEnum = z.nativeEnum(AgeCondition);
export const ProductTypeEnum = z.nativeEnum(ProductType);
export const SIConditionEnum = z.nativeEnum(SICondition);

export const commissionRuleSchema = z.object({
  policy_name_id: z.string().uuid({ message: 'policy_name_id must be a valid UUID' }),
  policyStatus: PolicyCreationStatusEnum,
  deductibleType: DeductibleTypeEnum,
  deductibleStatus: z.boolean().nullable().optional(),
  ageCondition: AgeConditionEnum,
  commissionPercent: z.number().min(0, 'Commission percent must be non-negative'),
  productType: ProductTypeEnum.nullable(),
  siCondition: SIConditionEnum.nullable(),
  customSIThreshold: z.number().nullable(),
  customSIOperator: z.string().nullable(),
  is_active: z.boolean().default(true),
});

export const commissionRuleUpdateSchema = commissionRuleSchema.partial();

// Search schema for commission rules
export const commissionRuleSearchSchema = z.object({
  search: z.string().optional(),
  policyStatus: z.string().optional(),
  deductibleType: z.string().optional(),
  ageCondition: z.string().optional(),
  productType: z.string().optional(),
  siCondition: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
});
