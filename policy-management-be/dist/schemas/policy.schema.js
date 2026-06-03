"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDocumentLinking = exports.validateCoreEntities = exports.validatePolicyUpdate = exports.validatePolicyCreation = exports.paginatedPolicyResponseSchema = exports.paginationSchema = exports.policyResponseSchema = exports.updatePolicySchema = exports.insurancePolicySchema = exports.policyNameSchema = exports.policyGroupSchema = exports.policyTypeSchema = exports.companySchema = exports.policyFormValueSchema = exports.nomineeAndPaymentSchema = exports.insuredMemberSchema = exports.proposerSchema = exports.documentSchema = exports.InsuranceCategoryEnum = exports.MaritalStatusEnum = exports.GenderEnum = exports.FileTypeEnum = exports.DocumentCategoryEnum = exports.PolicyCreationStatusEnum = void 0;
const zod_1 = require("zod");
// Import Prisma enums for consistency
const client_1 = require("@prisma/client");
// Convert Prisma enums to Zod enums
// export const PolicyTypeEnum = z.enum([
//   "HEALTH_INSURANCE",
//   "MOTOR_INSURANCE", 
//   "LIFE_INSURANCE",
// ]);
exports.PolicyCreationStatusEnum = zod_1.z.nativeEnum(client_1.PolicyCreationStatus);
exports.DocumentCategoryEnum = zod_1.z.nativeEnum(client_1.DocumentCategory);
exports.FileTypeEnum = zod_1.z.nativeEnum(client_1.FileType);
exports.GenderEnum = zod_1.z.nativeEnum(client_1.Gender);
exports.MaritalStatusEnum = zod_1.z.nativeEnum(client_1.MaritalStatus);
exports.InsuranceCategoryEnum = zod_1.z.nativeEnum(client_1.InsuranceCategory);
// Document Schema with proper validation for two-phase approach
exports.documentSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    file_name: zod_1.z.string().optional(),
    original_name: zod_1.z.string().optional(),
    relative_path: zod_1.z.string().optional(),
    category: exports.DocumentCategoryEnum.optional(),
    file_type: exports.FileTypeEnum.optional(),
    uploaded_by: zod_1.z.string().uuid().optional(),
    uploaded_at: zod_1.z.string().datetime().optional(),
    created_at: zod_1.z.string().datetime().optional(),
    // For member documents - ID-based linking
    insured_member_id: zod_1.z.string().uuid().optional(),
    // For member documents - index-based linking (fallback)
    member_index: zod_1.z.number().optional(),
});
// Helper for date validation (accepts ISO 8601 and YYYY-MM-DD)
const dateOrDateTime = zod_1.z.string().refine((val) => {
    // Accepts YYYY-MM-DD or ISO 8601
    return (/^\d{4}-\d{2}-\d{2}$/.test(val) ||
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|([+-]\d{2}:\d{2}))?$/.test(val));
}, {
    message: 'Invalid date or datetime format. Use YYYY-MM-DD or ISO 8601.'
});
// Helper for mobile validation (E.164 or 10-digit Indian)
const mobileNumber = zod_1.z.string().refine((val) => {
    return (/^\+?[1-9]\d{1,14}$/.test(val) || // E.164
        /^\d{10}$/.test(val) // 10-digit
    );
}, {
    message: 'Invalid mobile number format.'
});
// Proposer Schema with nested documents
exports.proposerSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    proposer_salutation: zod_1.z.string().max(50).optional(),
    full_name: zod_1.z.string().min(1).max(255).optional(),
    date_of_birth: dateOrDateTime.optional(),
    gender: exports.GenderEnum.optional(),
    marital_status: exports.MaritalStatusEnum.optional(),
    mobile: mobileNumber.optional(),
    alternate_mobile: mobileNumber.optional(),
    email: zod_1.z.string().email().optional(),
    address: zod_1.z.string().max(500).optional(),
    kyc_id: zod_1.z.string().max(50).optional(),
    occupation: zod_1.z.string().max(100).optional(),
    nationality: zod_1.z.string().max(50).optional(),
    documents: zod_1.z.array(exports.documentSchema).optional(),
    created_at: zod_1.z.string().datetime().optional(),
    updated_at: zod_1.z.string().datetime().optional(),
});
// Insured Member Schema with nested documents and ID-based linking
exports.insuredMemberSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    insured_member_salutation: zod_1.z.string().max(50).optional(),
    name: zod_1.z.string().min(1).max(255).optional(),
    relation_to_proposer: zod_1.z.string().max(50).optional(),
    date_of_birth: dateOrDateTime.optional(),
    gender: exports.GenderEnum.optional(),
    pre_existing: zod_1.z.boolean().optional(),
    insured_member_medical_condition: zod_1.z.boolean().optional(),
    insured_member_medical_remarks: zod_1.z.string().max(1000).optional(),
    proposer_id: zod_1.z.string().uuid().optional(),
    documents: zod_1.z.array(exports.documentSchema).optional(),
    created_at: zod_1.z.string().datetime().optional(),
    updated_at: zod_1.z.string().datetime().optional(),
});
// Nominee and Payment Schema
exports.nomineeAndPaymentSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    nominee_salutation: zod_1.z.string().max(50).optional(),
    nominee_name: zod_1.z.string().max(255).optional(),
    nominee_relation: zod_1.z.string().max(50).optional(),
    nominee_dob: dateOrDateTime.optional(),
    payment_mode: zod_1.z.string().max(50).optional(),
    payment_reference: zod_1.z.string().max(100).optional(),
    bank_name: zod_1.z.string().max(255).optional(),
    bank_account_number: zod_1.z.string().max(50).optional(),
    bank_ifsc_code: zod_1.z.string().max(20).optional(),
    bank_branch_name: zod_1.z.string().max(255).optional(),
    created_at: zod_1.z.string().datetime().optional(),
    updated_at: zod_1.z.string().datetime().optional(),
});
// Policy Form Value Schema
exports.policyFormValueSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    field_name: zod_1.z.string().max(100).optional(),
    value: zod_1.z.string().max(500).optional(),
});
// Company Schema (for response)
exports.companySchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    name: zod_1.z.string().optional(),
    category: exports.InsuranceCategoryEnum.optional(),
});
// Policy Type Schema (for response)
exports.policyTypeSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    name: zod_1.z.string().optional(),
});
// Policy Group Schema (for response)
exports.policyGroupSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    name: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
});
// Policy Name Schema (for response)
exports.policyNameSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    name: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    policy_group_id: zod_1.z.string().uuid().optional(),
});
// Main Schema for Policy Creation with two-phase support
exports.insurancePolicySchema = zod_1.z.object({
    policy_salutation: zod_1.z.string().max(50).optional(),
    policy_number: zod_1.z.string().max(100).optional(),
    customer_name: zod_1.z.string().min(1).max(255).optional(),
    // type: PolicyTypeEnum.optional(),
    company_id: zod_1.z.string().uuid().optional().nullable(),
    policy_name_id: zod_1.z.string().uuid().optional().nullable(),
    policy_type_id: zod_1.z.string().uuid().optional().nullable(),
    policy_group_id: zod_1.z.string().uuid().optional().nullable(),
    created_by: zod_1.z.string().uuid().optional(),
    insurer_name: zod_1.z.string().max(255).optional(),
    product_name: zod_1.z.string().max(255).optional(),
    plan_type: zod_1.z.string().max(100).optional(),
    deductible_amount: zod_1.z.number().min(0).optional(),
    deductible_amount_status: zod_1.z.boolean().optional(),
    sum_insured: zod_1.z.number().min(0).optional(),
    start_date: zod_1.z.string().datetime().optional(),
    end_date: zod_1.z.string().datetime().optional(),
    tenure_years: zod_1.z.number().min(0).max(100).optional(),
    issued_date: zod_1.z.string().datetime().optional(),
    premium_amount: zod_1.z.number().min(0).optional(),
    declaration_accepted: zod_1.z.boolean().optional(),
    system_ip: zod_1.z.string().ip().optional(),
    medical_condition: zod_1.z.boolean().optional(),
    medical_remarks: zod_1.z.string().max(1000).optional(),
    policy_creation_status: exports.PolicyCreationStatusEnum.optional(),
    gst_status: zod_1.z.boolean().optional(),
    remarks: zod_1.z.string().max(1000).optional(),
    premium_amount_gst: zod_1.z.number().optional(),
    memberDocsMeta: zod_1.z.array(zod_1.z.object({
        originalname: zod_1.z.string(),
        member_index: zod_1.z.number(),
        member_id: zod_1.z.string().uuid().nullable().optional(),
        member_name: zod_1.z.string(),
    })).optional(),
    emi_amount: zod_1.z.number().optional(),
    commission_add_on_percentage: zod_1.z.number().optional(),
    // Nested relations
    proposer: exports.proposerSchema.optional(),
    members: zod_1.z.array(exports.insuredMemberSchema).optional(),
    insured_members: zod_1.z.array(exports.insuredMemberSchema).optional(), // Alias for members
    nominee_payment: exports.nomineeAndPaymentSchema.optional(),
    form_values: zod_1.z.array(exports.policyFormValueSchema).optional(),
    documents: zod_1.z.array(exports.documentSchema).optional(),
});
// Schema for updating existing policy with document management
exports.updatePolicySchema = exports.insurancePolicySchema.partial().extend({
    // For updates, we need to track which documents to delete
    documents_to_delete: zod_1.z.array(zod_1.z.string().uuid()).optional(),
    // For members, we need to track which ones to delete
    members_to_delete: zod_1.z.array(zod_1.z.string().uuid()).optional(),
    // For insured members, we need to track which ones to delete
    insured_members_to_delete: zod_1.z.array(zod_1.z.string().uuid()).optional(),
    // For removed document IDs (robust approach)
    removedDocumentIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
    emi_amount: zod_1.z.number().optional(),
    commission_add_on_percentage: zod_1.z.number().optional(),
});
// Schema for policy response (includes all relations)
exports.policyResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    policy_salutation: zod_1.z.string().optional(),
    policy_number: zod_1.z.string().optional(),
    customer_name: zod_1.z.string().optional(),
    // type: PolicyTypeEnum.optional(),
    company_id: zod_1.z.string().uuid().optional().nullable(),
    policy_name_id: zod_1.z.string().uuid().optional().nullable(),
    policy_type_id: zod_1.z.string().uuid().optional().nullable(),
    policy_group_id: zod_1.z.string().uuid().optional().nullable(),
    created_by: zod_1.z.string().uuid().optional(),
    created_at: zod_1.z.string().datetime().optional(),
    updated_at: zod_1.z.string().datetime().optional(),
    insurer_name: zod_1.z.string().optional(),
    product_name: zod_1.z.string().optional(),
    plan_type: zod_1.z.string().optional(),
    deductible_amount: zod_1.z.number().optional(),
    deductible_amount_status: zod_1.z.boolean().optional(),
    sum_insured: zod_1.z.number().optional(),
    start_date: zod_1.z.string().datetime().optional(),
    end_date: zod_1.z.string().datetime().optional(),
    tenure_years: zod_1.z.coerce.number().optional(),
    issued_date: zod_1.z.string().datetime().optional(),
    premium_amount: zod_1.z.number().optional(),
    declaration_accepted: zod_1.z.boolean().optional(),
    system_ip: zod_1.z.string().optional(),
    medical_condition: zod_1.z.boolean().optional(),
    medical_remarks: zod_1.z.string().optional(),
    policy_creation_status: exports.PolicyCreationStatusEnum.optional(),
    gst_status: zod_1.z.boolean().optional(),
    remarks: zod_1.z.string().optional(),
    premium_amount_gst: zod_1.z.number().optional(),
    emi_amount: zod_1.z.number().optional(),
    commission_add_on_percentage: zod_1.z.number().optional(),
    // Related entities
    company: exports.companySchema.optional(),
    type_details: exports.policyTypeSchema.optional(),
    policyGroup: exports.policyGroupSchema.optional(),
    policyName: exports.policyNameSchema.optional(),
    proposer: exports.proposerSchema.optional(),
    members: zod_1.z.array(exports.insuredMemberSchema).optional(),
    insured_members: zod_1.z.array(exports.insuredMemberSchema).optional(), // Alias for members
    nominee_payment: exports.nomineeAndPaymentSchema.optional(),
    form_values: zod_1.z.array(exports.policyFormValueSchema).optional(),
    documents: zod_1.z.array(exports.documentSchema).optional(),
});
// Pagination schema
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(25),
    search: zod_1.z.string().optional(),
    type: zod_1.z.string().optional(),
    policy_creation_status: zod_1.z.string().optional(),
    from: zod_1.z.string().optional(),
    to: zod_1.z.string().optional(),
});
// Paginated response schema
exports.paginatedPolicyResponseSchema = zod_1.z.object({
    data: zod_1.z.array(exports.policyResponseSchema),
    pagination: zod_1.z.object({
        total: zod_1.z.number(),
        page: zod_1.z.number(),
        limit: zod_1.z.number(),
        pages: zod_1.z.number(),
    }),
});
// Validation helpers
const validatePolicyCreation = (data) => {
    return exports.insurancePolicySchema.safeParse(data);
};
exports.validatePolicyCreation = validatePolicyCreation;
const validatePolicyUpdate = (data) => {
    return exports.updatePolicySchema.safeParse(data);
};
exports.validatePolicyUpdate = validatePolicyUpdate;
// Two-phase validation helpers
const validateCoreEntities = (data) => {
    return zod_1.z.object({
        policy_number: zod_1.z.string().min(1, 'Policy number is required'),
        customer_name: zod_1.z.string().optional(),
        proposer: exports.proposerSchema,
        // insured_members: z.array(insuredMemberSchema).min(1, 'At least one insured member is required'),
        // nominee_payment: nomineeAndPaymentSchema.optional(),
    }).safeParse(data);
};
exports.validateCoreEntities = validateCoreEntities;
const validateDocumentLinking = (data) => {
    return zod_1.z.object({
        documents: zod_1.z.array(exports.documentSchema).optional(),
        proposer: zod_1.z.object({
            documents: zod_1.z.array(exports.documentSchema).optional(),
        }).optional(),
        insured_members: zod_1.z.array(zod_1.z.object({
            documents: zod_1.z.array(exports.documentSchema).optional(),
        })).optional(),
    }).safeParse(data);
};
exports.validateDocumentLinking = validateDocumentLinking;
