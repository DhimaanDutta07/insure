export interface Site {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phone: string;
  status: 'Active' | 'Inactive';
  web_access: boolean;
  app_access: boolean;
  permissions: {
    app: string[];
    web: string[];
  };
  created_at: string;
  updated_at: string;
  role_id: string;
  sites: Site[];
}

export interface Role {
  id: string;
  role_name: string;
  permissions: Record<string, boolean>;
  is_deleted: boolean;
}

export interface AuthContextType {
  user: User | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string, phoneNumber: string) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  sendOTP: (phone: string) => Promise<void>;
  verifyOTP: (phone: string, otp: string) => Promise<void>;
  setUserSites: (sites: string[]) => Promise<void>;
}

export interface PolicyName {
  id: string;
  name: string;
  description: string | null;
  policy_group_id: string;
  company_id: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface PolicyGroup {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  itemNames?: PolicyName[];
}

export interface Policy {
  id: string;
  policy_salutation?: string;
  policy_number: string;
  customer_name: string;
  company_id: string;
  company?: Company;
  policy_name_id: string;
  policyName?: PolicyName;
  policy_type_id: string;
  type?: PolicyType;
  created_by: string;
  created_at: string;
  updated_at: string;
  insurer_name: string;
  product_name: string;
  plan_type: string;
  deductible_amount?: number;
  deductible_amount_status?: boolean;
  sum_insured: number;
  start_date: string;
  end_date: string;
  tenure_years: number;
  issued_date: string;
  premium_amount: number;
  declaration_accepted: boolean;
  system_ip?: string;
  status?: string;
  proposer?: Proposer;
  members?: InsuredMember[];
  nominee_payment?: NomineeAndPayment;
  revenues?: Revenue[];
  receipts?: PolicyReceipt[];
  form_values?: PolicyFormValue[];
  medical_condition?: boolean;
  medical_remarks?: string;
  policy_creation_status?: 'Fresh' | 'Renewal' | 'Migration' | 'Portablity';
  gst_status?: boolean;
  remarks?: string;
  premium_amount_gst?: number;
  is_deleted?: boolean;
  calculated_commission_amount?: number;
  policyGroup?: string | { name: string };
  documents?: UploadedDocument[];
  reminders?: Reminder[];
}

export interface PolicyReceipt {
  id: string;
  policy_number: string;
  policy_type: string;
  remark?: string | null;
  user_id: string;
  user?: User;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  policy_document_id?: string;
  policy_document?: UploadedDocument;
  images: PolicyReceiptImage[];
}

export interface PolicyReceiptImage {
  id: string;
  url: string;
  policy_receipt_id: string;
  policy_document_id?: string;
  policy_document?: UploadedDocument;
}

export interface UploadedDocument {
  id: string;
  policy_id: string;
  file_name: string;
  original_name: string;
  relative_path: string;
  category: string;
  file_type: string;
  uploaded_by: string;
  uploaded_at: string;
  proposer_id?: string;
  insured_member_id?: string;
}

export interface Proposer {
  id: string;
  proposer_salutation?: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  marital_status: string;
  mobile: string;
  alternate_mobile?: string;
  email: string;
  address: string;
  kyc_id: string;
  occupation: string;
  nationality: string;
  policy_id?: string;
  documents?: UploadedDocument[];
  created_at: string;
  updated_at: string;
}

export interface InsuredMember {
  id: string;
  policy_id: string;
  insured_member_salutation?: string;
  name: string;
  relation_to_proposer: string;
  date_of_birth: string;
  gender: string;
  pre_existing: boolean;
  documents?: UploadedDocument[];
  created_at: string;
  updated_at: string;
}

export interface NomineeAndPayment {
  id: string;
  policy_id: string;
  nominee_salutation?: string;
  nominee_name: string;
  nominee_relation: string;
  nominee_dob: string;
  payment_mode: string;
  payment_reference: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_ifsc_code?: string;
  bank_branch_name?: string;
  created_at: string;
  updated_at: string;
}

export interface PolicyFormValue {
  id: string;
  policy_id: string;
  field_name: string;
  value: string;
}

export interface Reminder {
  id: string;
  policy_id: string;
  remind_on: string;
  type: string;
  status: string;
  channel: string;
  created_at: string;
  sent_at?: string;
}

export interface PolicyType {
  id: string;
  name: string;
}

export interface Company {
  id: string;
  name: string;
  category: string;
  policies?: Policy[];
  form_fields?: CompanyFormField[];
}

export interface CompanyFormField {
  id: string;
  company_id: string;
  label: string;
  field_type: string;
  is_required: boolean;
  order: number;
}

export interface Agent {
  id: string;
  name: string;
  phone?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  revenues?: Revenue[];
}

export interface Commission {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  revenues?: Revenue[];
}

export interface Revenue {
  id: string;
  reimbursementId: string;
  siteId: string;
  area: number;
  month: string;
  clientId: string;
  amount: number;
  camCharge: number;
  gst: number;
  lessTds: number;
  receivable: number;
  receivedInBank: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  policyId: string;
  policy?: Policy;
  agentId: string;
  agent?: Agent;
  commissionId: string;
  commission?: Commission;
}

export interface CommissionRule {
  id: string;
  policy_name_id: string;
  policyStatus: string; // Should match PolicyCreationStatus enum
  deductibleType: string; // Should match DeductibleType enum
  ageCondition: string; // Should match AgeCondition enum
  commissionPercent: number;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  // Optionally, include related PolicyName for easier display
  policyName?: PolicyName;
} 