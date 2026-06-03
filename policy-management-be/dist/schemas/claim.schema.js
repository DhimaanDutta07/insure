"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateClaimStatusUpdate = exports.validateClaimUpdate = exports.validateClaimCreation = exports.claimResponseSchema = exports.updateClaimStatusSchema = exports.updateClaimSchema = exports.createClaimSchema = exports.claimMemberSchema = exports.ClaimStatusEnum = exports.ClaimTypeEnum = exports.ClaimantTypeEnum = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.ClaimantTypeEnum = zod_1.z.nativeEnum(client_1.ClaimantType);
exports.ClaimTypeEnum = zod_1.z.nativeEnum(client_1.ClaimType);
exports.ClaimStatusEnum = zod_1.z.nativeEnum(client_1.ClaimStatus);
// Schema for individual member in a claim
exports.claimMemberSchema = zod_1.z.object({
    insured_member_id: zod_1.z.string().uuid(),
    member_claim_amount: zod_1.z.number().positive().optional(),
    member_remarks: zod_1.z.string().optional(),
});
// Main claim creation schema with multiple members
exports.createClaimSchema = zod_1.z.object({
    policy_id: zod_1.z.string().uuid(),
    claimant_type: exports.ClaimantTypeEnum,
    claim_amount: zod_1.z.number().positive(),
    claim_remarks: zod_1.z.string().optional(),
    claim_type: exports.ClaimTypeEnum,
    claim_date: zod_1.z.string().datetime().optional(),
    is_full_claim: zod_1.z.boolean().default(false),
    // ===== APPROVAL WORKFLOW FIELDS =====
    claim_status: exports.ClaimStatusEnum.optional(),
    approved_by: zod_1.z.string().optional(),
    approved_at: zod_1.z.string().datetime().optional().nullable(),
    rejection_reason: zod_1.z.string().optional(),
    // ===== MULTIPLE MEMBERS SUPPORT =====
    members: zod_1.z.array(exports.claimMemberSchema).optional(),
}).refine((data) => {
    // For INSURED_MEMBER, require at least one member
    if (data.claimant_type === 'INSURED_MEMBER') {
        return data.members && data.members.length > 0;
    }
    // For SELF, members are optional
    return true;
}, {
    message: "At least one member must be selected for insured member claims",
    path: ["members"],
}).refine((data) => {
    // If status is Rejected, rejection_reason is required
    if (data.claim_status === 'Rejected' && !data.rejection_reason) {
        return false;
    }
    return true;
}, {
    message: "Rejection reason is required when status is Rejected",
    path: ["rejection_reason"],
}).refine((data) => {
    // If status is Approved or Rejected, approved_by is required
    if ((data.claim_status === 'Approved' || data.claim_status === 'Rejected') && !data.approved_by) {
        return false;
    }
    return true;
}, {
    message: "Approver name is required when status is Approved or Rejected",
    path: ["approved_by"],
});
// Schema for updating claims
exports.updateClaimSchema = zod_1.z.object({
    policy_id: zod_1.z.string().uuid().optional(),
    claimant_type: exports.ClaimantTypeEnum.optional(),
    claim_amount: zod_1.z.number().positive().optional(),
    claim_remarks: zod_1.z.string().optional(),
    claim_type: exports.ClaimTypeEnum.optional(),
    claim_date: zod_1.z.string().datetime().optional(),
    is_full_claim: zod_1.z.boolean().optional(),
    // ===== APPROVAL WORKFLOW FIELDS =====
    claim_status: exports.ClaimStatusEnum.optional(),
    approved_by: zod_1.z.string().optional(),
    approved_at: zod_1.z.string().datetime().optional().nullable(),
    rejection_reason: zod_1.z.string().optional(),
    // ===== MULTIPLE MEMBERS SUPPORT =====
    members: zod_1.z.array(exports.claimMemberSchema).optional(),
}).refine((data) => {
    // For INSURED_MEMBER, require at least one member
    if (data.claimant_type === 'INSURED_MEMBER') {
        return data.members && data.members.length > 0;
    }
    // For SELF, members are optional
    return true;
}, {
    message: "At least one member must be selected for insured member claims",
    path: ["members"],
}).refine((data) => {
    // If status is Rejected, rejection_reason is required
    if (data.claim_status === 'Rejected' && !data.rejection_reason) {
        return false;
    }
    return true;
}, {
    message: "Rejection reason is required when status is Rejected",
    path: ["rejection_reason"],
}).refine((data) => {
    // If status is Approved or Rejected, approved_by is required
    if ((data.claim_status === 'Approved' || data.claim_status === 'Rejected') && !data.approved_by) {
        return false;
    }
    return true;
}, {
    message: "Approver name is required when status is Approved or Rejected",
    path: ["approved_by"],
});
// Schema for updating claim status only
exports.updateClaimStatusSchema = zod_1.z.object({
    status: exports.ClaimStatusEnum,
    approved_by: zod_1.z.string().optional(),
    rejection_reason: zod_1.z.string().optional(),
}).refine((data) => {
    // If status is Rejected, rejection_reason is required
    if (data.status === 'Rejected' && !data.rejection_reason) {
        return false;
    }
    return true;
}, {
    message: "Rejection reason is required when status is Rejected",
    path: ["rejection_reason"],
}).refine((data) => {
    // If status is Approved or Rejected, approved_by is required
    if ((data.status === 'Approved' || data.status === 'Rejected') && !data.approved_by) {
        return false;
    }
    return true;
}, {
    message: "Approver name is required when status is Approved or Rejected",
    path: ["approved_by"],
});
// Response schema for claims
exports.claimResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    policy_id: zod_1.z.string(),
    claimant_type: exports.ClaimantTypeEnum,
    claim_amount: zod_1.z.number().nullable(),
    claim_remarks: zod_1.z.string().nullable(),
    claim_type: exports.ClaimTypeEnum,
    claim_date: zod_1.z.date().nullable(),
    is_full_claim: zod_1.z.boolean(),
    claim_status: exports.ClaimStatusEnum,
    created_at: zod_1.z.date(),
    updated_at: zod_1.z.date(),
    created_by: zod_1.z.string().nullable(),
    approved_by: zod_1.z.string().nullable(),
    approved_at: zod_1.z.date().nullable(),
    rejection_reason: zod_1.z.string().nullable(),
    is_deleted: zod_1.z.boolean(),
    claim_members: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        claim_id: zod_1.z.string(),
        insured_member_id: zod_1.z.string(),
        member_claim_amount: zod_1.z.number().nullable(),
        member_remarks: zod_1.z.string().nullable(),
        created_at: zod_1.z.date(),
        insured_member: zod_1.z.object({
            id: zod_1.z.string(),
            name: zod_1.z.string(),
            relation_to_proposer: zod_1.z.string(),
            date_of_birth: zod_1.z.date().nullable(),
            gender: zod_1.z.string().nullable(),
        }),
    })),
    documents: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        file_name: zod_1.z.string(),
        original_name: zod_1.z.string(),
        relative_path: zod_1.z.string(),
        file_type: zod_1.z.string(),
        category: zod_1.z.string(),
        uploaded_by: zod_1.z.string().nullable(),
        created_at: zod_1.z.date(),
    })),
    policy: zod_1.z.object({
        id: zod_1.z.string(),
        policy_number: zod_1.z.string(),
        customer_name: zod_1.z.string().nullable(),
    }),
});
// Validation functions following existing pattern
const validateClaimCreation = (data) => {
    return exports.createClaimSchema.safeParse(data);
};
exports.validateClaimCreation = validateClaimCreation;
const validateClaimUpdate = (data) => {
    return exports.updateClaimSchema.safeParse(data);
};
exports.validateClaimUpdate = validateClaimUpdate;
const validateClaimStatusUpdate = (data) => {
    return exports.updateClaimStatusSchema.safeParse(data);
};
exports.validateClaimStatusUpdate = validateClaimStatusUpdate;
