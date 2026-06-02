import { z } from "zod";

// Import Prisma enums for consistency
import { 
  PolicyCreationStatus, 
  DocumentCategory, 
  FileType, 
  Gender, 
  MaritalStatus,
  InsuranceCategory 
} from "@prisma/client";

// Convert Prisma enums to Zod enums
// export const PolicyTypeEnum = z.enum([
//   "HEALTH_INSURANCE",
//   "MOTOR_INSURANCE", 
//   "LIFE_INSURANCE",
// ]);

export const PolicyCreationStatusEnum = z.nativeEnum(PolicyCreationStatus);
export const DocumentCategoryEnum = z.nativeEnum(DocumentCategory);
export const FileTypeEnum = z.nativeEnum(FileType);
export const GenderEnum = z.nativeEnum(Gender);
export const MaritalStatusEnum = z.nativeEnum(MaritalStatus);
export const InsuranceCategoryEnum = z.nativeEnum(InsuranceCategory);

// Document Schema with proper validation for two-phase approach
export const documentSchema = z.object({
  id: z.string().uuid().optional(),
  file_name: z.string().optional(),
  original_name: z.string().optional(),
  relative_path: z.string().optional(),
  category: DocumentCategoryEnum.optional(),
  file_type: FileTypeEnum.optional(),
  uploaded_by: z.string().uuid().optional(),
  uploaded_at: z.string().datetime().optional(),
  created_at: z.string().datetime().optional(),
  // For member documents - ID-based linking
  insured_member_id: z.string().uuid().optional(),
  // For member documents - index-based linking (fallback)
  member_index: z.number().optional(),
});

// Helper for date validation (accepts ISO 8601 and YYYY-MM-DD)
const dateOrDateTime = z.string().refine(
  (val) => {
    // Accepts YYYY-MM-DD or ISO 8601
    return (
      /^\d{4}-\d{2}-\d{2}$/.test(val) ||
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|([+-]\d{2}:\d{2}))?$/.test(val)
    );
  },
  {
    message: 'Invalid date or datetime format. Use YYYY-MM-DD or ISO 8601.'
  }
);

// Helper for mobile validation (E.164 or 10-digit Indian)
const mobileNumber = z.string().refine(
  (val) => {
    return (
      /^\+?[1-9]\d{1,14}$/.test(val) || // E.164
      /^\d{10}$/.test(val) // 10-digit
    );
  },
  {
    message: 'Invalid mobile number format.'
  }
);

// Proposer Schema with nested documents
export const proposerSchema = z.object({
  id: z.string().uuid().optional(),
  proposer_salutation: z.string().max(50).optional(),
  full_name: z.string().min(1).max(255).optional(),
  date_of_birth: dateOrDateTime.optional(),
  gender: GenderEnum.optional(),
  marital_status: MaritalStatusEnum.optional(),
  mobile: mobileNumber.optional(),
  alternate_mobile: mobileNumber.optional(),
  email: z.string().email().optional(),
  address: z.string().max(500).optional(),
  kyc_id: z.string().max(50).optional(),
  occupation: z.string().max(100).optional(),
  nationality: z.string().max(50).optional(),
  documents: z.array(documentSchema).optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

// Insured Member Schema with nested documents and ID-based linking
export const insuredMemberSchema = z.object({
  id: z.string().uuid().optional(),
  insured_member_salutation: z.string().max(50).optional(),
  name: z.string().min(1).max(255).optional(),
  relation_to_proposer: z.string().max(50).optional(),
  date_of_birth: dateOrDateTime.optional(),
  gender: GenderEnum.optional(),
  pre_existing: z.boolean().optional(),
  insured_member_medical_condition: z.boolean().optional(),
  insured_member_medical_remarks: z.string().max(1000).optional(),
  proposer_id: z.string().uuid().optional(),
  documents: z.array(documentSchema).optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

// Nominee and Payment Schema
export const nomineeAndPaymentSchema = z.object({
  id: z.string().uuid().optional(),
  nominee_salutation: z.string().max(50).optional(),
  nominee_name: z.string().max(255).optional(),
  nominee_relation: z.string().max(50).optional(),
  nominee_dob: dateOrDateTime.optional(),
  payment_mode: z.string().max(50).optional(),
  payment_reference: z.string().max(100).optional(),
  bank_name: z.string().max(255).optional(),
  bank_account_number: z.string().max(50).optional(),
  bank_ifsc_code: z.string().max(20).optional(),
  bank_branch_name: z.string().max(255).optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

// Policy Form Value Schema
export const policyFormValueSchema = z.object({
  id: z.string().uuid().optional(),
  field_name: z.string().max(100).optional(),
  value: z.string().max(500).optional(),
});

// Company Schema (for response)
export const companySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().optional(),
  category: InsuranceCategoryEnum.optional(),
});

// Policy Type Schema (for response)
export const policyTypeSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().optional(),
});

// Policy Group Schema (for response)
export const policyGroupSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
});

// Policy Name Schema (for response)
export const policyNameSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  policy_group_id: z.string().uuid().optional(),
});

// Main Schema for Policy Creation with two-phase support
export const insurancePolicySchema = z.object({
  policy_salutation: z.string().max(50).optional(),
  policy_number: z.string().max(100).optional(),
  customer_name: z.string().min(1).max(255).optional(),
  // type: PolicyTypeEnum.optional(),
  company_id: z.string().uuid().optional().nullable(),
  policy_name_id: z.string().uuid().optional().nullable(),
  policy_type_id: z.string().uuid().optional().nullable(),
  policy_group_id: z.string().uuid().optional().nullable(),
  created_by: z.string().uuid().optional(),
  insurer_name: z.string().max(255).optional(),
  product_name: z.string().max(255).optional(),
  plan_type: z.string().max(100).optional(),
  deductible_amount: z.number().min(0).optional(),
  deductible_amount_status: z.boolean().optional(),
  sum_insured: z.number().min(0).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  tenure_years: z.number().min(0).max(100).optional(),
  issued_date: z.string().datetime().optional(),
  premium_amount: z.number().min(0).optional(),
  declaration_accepted: z.boolean().optional(),
  system_ip: z.string().ip().optional(),
  medical_condition: z.boolean().optional(),
  medical_remarks: z.string().max(1000).optional(),
  policy_creation_status: PolicyCreationStatusEnum.optional(),
  gst_status: z.boolean().optional(),
  remarks: z.string().max(1000).optional(),
  premium_amount_gst: z.number().optional(),
  memberDocsMeta: z.array(z.object({
    originalname: z.string(),
    member_index: z.number(),
    member_id: z.string().uuid().nullable().optional(),
    member_name: z.string(),
  })).optional(),
  emi_amount: z.number().optional(),
  commission_add_on_percentage: z.number().optional(),
  // Nested relations
  proposer: proposerSchema.optional(),
  members: z.array(insuredMemberSchema).optional(),
  insured_members: z.array(insuredMemberSchema).optional(), // Alias for members
  nominee_payment: nomineeAndPaymentSchema.optional(),
  form_values: z.array(policyFormValueSchema).optional(),
  documents: z.array(documentSchema).optional(),
});

// Schema for updating existing policy with document management
export const updatePolicySchema = insurancePolicySchema.partial().extend({
  // For updates, we need to track which documents to delete
  documents_to_delete: z.array(z.string().uuid()).optional(),
  // For members, we need to track which ones to delete
  members_to_delete: z.array(z.string().uuid()).optional(),
  // For insured members, we need to track which ones to delete
  insured_members_to_delete: z.array(z.string().uuid()).optional(),
  // For removed document IDs (robust approach)
  removedDocumentIds: z.array(z.string().uuid()).optional(),
  emi_amount: z.number().optional(),
  commission_add_on_percentage: z.number().optional(),

});

// Schema for policy response (includes all relations)
export const policyResponseSchema = z.object({
  id: z.string().uuid().optional(),
  policy_salutation: z.string().optional(),
  policy_number: z.string().optional(),
  customer_name: z.string().optional(),
  // type: PolicyTypeEnum.optional(),
  company_id: z.string().uuid().optional().nullable(),
  policy_name_id: z.string().uuid().optional().nullable(),
  policy_type_id: z.string().uuid().optional().nullable(),
  policy_group_id: z.string().uuid().optional().nullable(),
  created_by: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  insurer_name: z.string().optional(),
  product_name: z.string().optional(),
  plan_type: z.string().optional(),
  deductible_amount: z.number().optional(),
  deductible_amount_status: z.boolean().optional(),
  sum_insured: z.number().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  tenure_years: z.coerce.number().optional(),
  issued_date: z.string().datetime().optional(),
  premium_amount: z.number().optional(),
  declaration_accepted: z.boolean().optional(),
  system_ip: z.string().optional(),
  medical_condition: z.boolean().optional(),
  medical_remarks: z.string().optional(),
  policy_creation_status: PolicyCreationStatusEnum.optional(),
  gst_status: z.boolean().optional(),
  remarks: z.string().optional(),
  premium_amount_gst: z.number().optional(),
  emi_amount: z.number().optional(),
  commission_add_on_percentage: z.number().optional(),
  
  // Related entities
  company: companySchema.optional(),
  type_details: policyTypeSchema.optional(),
  policyGroup: policyGroupSchema.optional(),
  policyName: policyNameSchema.optional(),
  proposer: proposerSchema.optional(),
  members: z.array(insuredMemberSchema).optional(),
  insured_members: z.array(insuredMemberSchema).optional(), // Alias for members
  nominee_payment: nomineeAndPaymentSchema.optional(),
  form_values: z.array(policyFormValueSchema).optional(),
  documents: z.array(documentSchema).optional(),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(25),
  search: z.string().optional(),
  type: z.string().optional(),
  policy_creation_status: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

// Paginated response schema
export const paginatedPolicyResponseSchema = z.object({
  data: z.array(policyResponseSchema),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    pages: z.number(),
  }),
});

// Export types
export type InsurancePolicyInput = z.infer<typeof insurancePolicySchema>;
export type UpdatePolicyInput = z.infer<typeof updatePolicySchema>;
export type PolicyResponse = z.infer<typeof policyResponseSchema>;
export type ProposerInput = z.infer<typeof proposerSchema>;
export type InsuredMemberInput = z.infer<typeof insuredMemberSchema>;
export type NomineeAndPaymentInput = z.infer<typeof nomineeAndPaymentSchema>;
export type PolicyDocumentInput = z.infer<typeof documentSchema>;
export type PolicyFormValueInput = z.infer<typeof policyFormValueSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type PaginatedPolicyResponse = z.infer<typeof paginatedPolicyResponseSchema>;

// Validation helpers
export const validatePolicyCreation = (data: unknown) => {
  return insurancePolicySchema.safeParse(data);
};

export const validatePolicyUpdate = (data: unknown) => {
  return updatePolicySchema.safeParse(data);
};

// Two-phase validation helpers
export const validateCoreEntities = (data: unknown) => {
  return z.object({
    policy_number: z.string().min(1, 'Policy number is required'),
    customer_name: z.string().optional(),
    proposer: proposerSchema,
    // insured_members: z.array(insuredMemberSchema).min(1, 'At least one insured member is required'),
    // nominee_payment: nomineeAndPaymentSchema.optional(),
  }).safeParse(data);
};

export const validateDocumentLinking = (data: unknown) => {
  return z.object({
    documents: z.array(documentSchema).optional(),
    proposer: z.object({
      documents: z.array(documentSchema).optional(),
    }).optional(),
    insured_members: z.array(z.object({
      documents: z.array(documentSchema).optional(),
    })).optional(),
  }).safeParse(data);
};
