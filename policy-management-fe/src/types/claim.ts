import { UploadedDocument } from './index';

export interface InsuredMember {
  id: string;
  name?: string;
  relation_to_proposer?: string;
  date_of_birth?: string;
  gender?: string;
  pre_existing?: boolean;
  insured_member_medical_condition?: boolean;
  insured_member_medical_remarks?: string;
}

export interface ClaimMember {
  id: string;
  claim_id: string;
  insured_member_id: string;
  member_claim_amount?: number;
  member_remarks?: string;
  created_at: string;
  insured_member: InsuredMember;
}

export interface Claim {
  id: string;
  policy_id: string;
  claimant_type: 'SELF' | 'INSURED_MEMBER';
  claim_amount: number;
  claim_remarks?: string;
  claim_type: 'HOSPITALIZATION' | 'DAYCARE' | 'PREPOST' | 'CASHLESS' | 'HEALTH_CHECKUP' | 'OTHER';
  claim_date?: string;
  is_full_claim: boolean;
  claim_status: 'Pending' | 'Approved' | 'Rejected' | 'Paid';
  created_at: string;
  updated_at: string;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  is_deleted: boolean;
  
  // ===== MULTIPLE MEMBERS =====
  claim_members: ClaimMember[];
  documents?: UploadedDocument[];
}

export interface CreateClaimData {
  policy_id: string;
  claimant_type: 'SELF' | 'INSURED_MEMBER';
  claim_amount: number;
  claim_remarks?: string;
  claim_type: 'HOSPITALIZATION' | 'DAYCARE' | 'PREPOST' | 'CASHLESS' | 'HEALTH_CHECKUP' | 'OTHER';
  claim_date?: Date | string;
  is_full_claim: boolean;
  // Approval workflow fields
  claim_status?: 'Pending' | 'Approved' | 'Rejected' | 'Paid';
  approved_by?: string;
  approved_at?: Date | string;
  rejection_reason?: string;
  members?: Array<{
    insured_member_id: string;
    member_claim_amount?: number;
    member_remarks?: string;
  }>;
} 