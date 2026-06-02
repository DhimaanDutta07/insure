import { z } from "zod";
import { ClaimantType, ClaimType, ClaimStatus } from "@prisma/client";

export const ClaimantTypeEnum = z.nativeEnum(ClaimantType);
export const ClaimTypeEnum = z.nativeEnum(ClaimType);
export const ClaimStatusEnum = z.nativeEnum(ClaimStatus);

// Schema for individual member in a claim
export const claimMemberSchema = z.object({
  insured_member_id: z.string().uuid(),
  member_claim_amount: z.number().positive().optional(),
  member_remarks: z.string().optional(),
});

// Main claim creation schema with multiple members
export const createClaimSchema = z.object({
  policy_id: z.string().uuid(),
  claimant_type: ClaimantTypeEnum,
  claim_amount: z.number().positive(),
  claim_remarks: z.string().optional(),
  claim_type: ClaimTypeEnum,
  claim_date: z.string().datetime().optional(),
  is_full_claim: z.boolean().default(false),
  
  // ===== APPROVAL WORKFLOW FIELDS =====
  claim_status: ClaimStatusEnum.optional(),
  approved_by: z.string().optional(),
  approved_at: z.string().datetime().optional().nullable(),
  rejection_reason: z.string().optional(),
  
  // ===== MULTIPLE MEMBERS SUPPORT =====
  members: z.array(claimMemberSchema).optional(),
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
export const updateClaimSchema = z.object({
  policy_id: z.string().uuid().optional(),
  claimant_type: ClaimantTypeEnum.optional(),
  claim_amount: z.number().positive().optional(),
  claim_remarks: z.string().optional(),
  claim_type: ClaimTypeEnum.optional(),
  claim_date: z.string().datetime().optional(),
  is_full_claim: z.boolean().optional(),
  
  // ===== APPROVAL WORKFLOW FIELDS =====
  claim_status: ClaimStatusEnum.optional(),
  approved_by: z.string().optional(),
  approved_at: z.string().datetime().optional().nullable(),
  rejection_reason: z.string().optional(),
  
  // ===== MULTIPLE MEMBERS SUPPORT =====
  members: z.array(claimMemberSchema).optional(),
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
export const updateClaimStatusSchema = z.object({
  status: ClaimStatusEnum,
  approved_by: z.string().optional(),
  rejection_reason: z.string().optional(),
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
export const claimResponseSchema = z.object({
  id: z.string(),
  policy_id: z.string(),
  claimant_type: ClaimantTypeEnum,
  claim_amount: z.number().nullable(),
  claim_remarks: z.string().nullable(),
  claim_type: ClaimTypeEnum,
  claim_date: z.date().nullable(),
  is_full_claim: z.boolean(),
  claim_status: ClaimStatusEnum,
  created_at: z.date(),
  updated_at: z.date(),
  created_by: z.string().nullable(),
  approved_by: z.string().nullable(),
  approved_at: z.date().nullable(),
  rejection_reason: z.string().nullable(),
  is_deleted: z.boolean(),
  claim_members: z.array(z.object({
    id: z.string(),
    claim_id: z.string(),
    insured_member_id: z.string(),
    member_claim_amount: z.number().nullable(),
    member_remarks: z.string().nullable(),
    created_at: z.date(),
    insured_member: z.object({
      id: z.string(),
      name: z.string(),
      relation_to_proposer: z.string(),
      date_of_birth: z.date().nullable(),
      gender: z.string().nullable(),
    }),
  })),
  documents: z.array(z.object({
    id: z.string(),
    file_name: z.string(),
    original_name: z.string(),
    relative_path: z.string(),
    file_type: z.string(),
    category: z.string(),
    uploaded_by: z.string().nullable(),
    created_at: z.date(),
  })),
  policy: z.object({
    id: z.string(),
    policy_number: z.string(),
    customer_name: z.string().nullable(),
  }),
});

// Type exports
export type CreateClaimInput = z.infer<typeof createClaimSchema>;
export type UpdateClaimInput = z.infer<typeof updateClaimSchema>;
export type UpdateClaimStatusInput = z.infer<typeof updateClaimStatusSchema>;
export type ClaimResponse = z.infer<typeof claimResponseSchema>;
export type ClaimMemberInput = z.infer<typeof claimMemberSchema>;

// Validation functions following existing pattern
export const validateClaimCreation = (data: unknown) => {
  return createClaimSchema.safeParse(data);
};

export const validateClaimUpdate = (data: unknown) => {
  return updateClaimSchema.safeParse(data);
};

export const validateClaimStatusUpdate = (data: unknown) => {
  return updateClaimStatusSchema.safeParse(data);
}; 