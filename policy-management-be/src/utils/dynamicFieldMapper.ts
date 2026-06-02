import { z } from "zod";
import { 
  PolicyCreationStatus, 
  DocumentCategory, 
  FileType, 
  Gender, 
  MaritalStatus,
  InsuranceCategory 
} from "@prisma/client";
// Lookup services removed - all lookups now handled in repository layer

// ===== GST CALCULATION CONSTANTS =====
const GST_RATE = 0.18; // 18% GST rate - can be made configurable in future

// ===== GST CALCULATION FUNCTIONS =====
function calculateGSTExclusiveAmount(amountIncludingGST: number): number {
  if (!amountIncludingGST || amountIncludingGST <= 0) {
    return 0;
  }
  
  // Calculate base amount (exclusive of GST)
  // Formula: baseAmount = amountIncludingGST / (1 + GST_RATE)
  const baseAmount = amountIncludingGST / (1 + GST_RATE);
  
  // Round to 2 decimal places for precision
  return Math.round(baseAmount * 100) / 100;
}

function calculateGSTAmount(amountIncludingGST: number): number {
  if (!amountIncludingGST || amountIncludingGST <= 0) {
    return 0;
  }
  
  const baseAmount = calculateGSTExclusiveAmount(amountIncludingGST);
  const gstAmount = amountIncludingGST - baseAmount;
  
  // Round to 2 decimal places for precision
  return Math.round(gstAmount * 100) / 100;
}

// ===== COMPREHENSIVE FIELD NAME MAPPING =====

const POLICY_FIELD_MAPPING: Record<string, string> = {
  // Policy Number variations
  'policy_number': 'policy_number',
  'Policy Number': 'policy_number',
  'Policy No': 'policy_number',
  'Policy No.': 'policy_number',
  'PolicyNumber': 'policy_number',
  'policyNumber': 'policy_number',
  
  // Customer Name variations
  'customer_name': 'customer_name',
  'Customer Name': 'customer_name',
  'Customer': 'customer_name',
  'Client Name': 'customer_name',
  'Client': 'customer_name',
  

  // Company Name variations (for backend lookup)
  'company_name': 'company_name',
  'Company Name': 'company_name',
  'Company': 'company_name',
  'insurer_name': 'company_name',
  'Insurer Name': 'company_name',
  'Insurance Company': 'company_name',
  'Provider': 'company_name',
  'Insurer': 'company_name',
  
  // Policy Group Name variations (for backend lookup)
  'policy_group': 'policy_group_name',
  'Policy Group': 'policy_group_name',
  'Group': 'policy_group_name',
  'Group Name': 'policy_group_name',
  
  // Policy Type Name variations (for backend lookup)
    // Type variations
    'type': 'policy_type_name',
    'Type': 'policy_type_name',
    'Insurance Type': 'policy_type_name',
    'Category': 'policy_type_name',
  'policy_type': 'policy_type_name',
  'Policy Type': 'policy_type_name',
  'Type Name': 'policy_type_name',
  'plan_type': 'policy_type_name',
  'Plan Type': 'policy_type_name',
  'Plan': 'policy_type_name',
  
  // Policy Name variations (for backend lookup)
  'policy_name': 'policy_name_name',
  'policy name': 'policy_name_name',
  'product_name': 'policy_name_name',
  'Product': 'policy_name_name',
  'Product Name': 'policy_name_name',
  'Policy Name': 'policy_name_name',
  'Name': 'policy_name_name',
  'PolicyProduct name': 'policy_name_name',
  
  // Product Name variations
  // 'product_name': 'policy_type_name',
  // 'Product Name': 'policy_type_name',
  // 'Product': 'policy_type_name',
  
  // Plan Type variations

  
  // Sum Insured variations
  'sum_insured': 'sum_insured',
  'Sum Insured': 'sum_insured',
  'Coverage': 'sum_insured',
  'Coverage Amount': 'sum_insured',
  
  // Date variations
  'start_date': 'start_date',
  'Start Date': 'start_date',
  'From Date': 'start_date',
  'Coverage Start': 'start_date',
  
  'end_date': 'end_date',
  'End Date': 'end_date',
  'To Date': 'end_date',
  'Coverage End': 'end_date',
  
  // 'issued_date': 'issued_date',
  // 'Issued Date': 'issued_date',
  // 'Issue Date': 'issued_date',
  
  // Tenure variations
  'tenure_years': 'tenure_years',
  'Tenure Years': 'tenure_years',
  'Duration': 'tenure_years',
  'Period': 'tenure_years',
  
  // Premium variations
  'premium_amount': 'premium_amount',
  'Premium Amount': 'premium_amount',
  'Premium': 'premium_amount',
  'Cost': 'premium_amount',
  
  // // Declaration variations
  // 'declaration_accepted': 'declaration_accepted',
  // 'Declaration Accepted': 'declaration_accepted',
  // 'Declaration': 'declaration_accepted',
  
  // Deductible variations
  'deductible_amount': 'deductible_amount',
  'Deductible Amount': 'deductible_amount',
  'Deductible': 'deductible_amount',
  
  'deductible_amount_status': 'deductible_amount_status',
  'Deductible Amount Status': 'deductible_amount_status',
  'Deductible Status': 'deductible_amount_status',
  
  // Medical variations
  'medical_condition': 'medical_condition',
  'Medical Condition': 'medical_condition',
  'Medical': 'medical_condition',
  
  'medical_remarks': 'medical_remarks',
  'Medical Remarks': 'medical_remarks',
  'Medical Notes': 'medical_remarks',
  
  // Status variations
  'policy_creation_status': 'policy_creation_status',
  'Policy Creation Status': 'policy_creation_status',
  'Status': 'policy_creation_status',
  
  // EMI variations
  'emi_amount': 'emi_amount',
  'EMI Amount': 'emi_amount',
  'EMI': 'emi_amount',
  
  // Commission variations
  'commission_add_on_percentage': 'commission_add_on_percentage',
  'Commission Add On Percentage': 'commission_add_on_percentage',
  'Commission': 'commission_add_on_percentage',
  'Commission %': 'commission_add_on_percentage',
  
  // Policy Salutation variations
  'policy_salutation': 'policy_salutation',
  'Policy Salutation': 'policy_salutation',
  
  // GST Status variations
  'gst_status': 'gst_status',
  'GST Status': 'gst_status',
  'GST': 'gst_status',
  'Tax Status': 'gst_status',
  'Tax Inclusive': 'gst_status'
};

const PROPOSER_FIELD_MAPPING: Record<string, string> = {
  // Proposer Full Name variations
  'proposer_full_name': 'proposer.full_name',
  'Proposer Full Name': 'proposer.full_name',
  'Proposer Name': 'proposer.full_name',
  'Primary Insured Name': 'proposer.full_name',
  'Main Applicant Name': 'proposer.full_name',
  'Full Name': 'proposer.full_name',
  
  // Proposer Salutation variations
  'proposer_salutation': 'proposer.proposer_salutation',
  'Proposer Salutation': 'proposer.proposer_salutation',
  'Primary Salutation': 'proposer.proposer_salutation',
  'Main Applicant Salutation': 'proposer.proposer_salutation',
  'Salutation': 'proposer.proposer_salutation',
  
  // Proposer Date of Birth variations
  'proposer_date_of_birth': 'proposer.date_of_birth',
  'Proposer Date of Birth': 'proposer.date_of_birth',
  'Proposer DOB': 'proposer.date_of_birth',
  'Primary DOB': 'proposer.date_of_birth',
  'Main Applicant DOB': 'proposer.date_of_birth',
  'Date of Birth': 'proposer.date_of_birth',
  'DOB': 'proposer.date_of_birth',
  
  // Proposer Gender variations
  'proposer_gender': 'proposer.gender',
  'Proposer Gender': 'proposer.gender',
  'Primary Gender': 'proposer.gender',
  'Main Applicant Gender': 'proposer.gender',
  'Gender': 'proposer.gender',
  
  // Proposer Marital Status variations
  'proposer_marital_status': 'proposer.marital_status',
  'Proposer Marital Status': 'proposer.marital_status',
  'Primary Marital Status': 'proposer.marital_status',
  'Main Applicant Marital Status': 'proposer.marital_status',
  'Marital Status': 'proposer.marital_status',
  
  // Proposer Mobile variations
  'proposer_mobile': 'proposer.mobile',
  'Proposer Mobile': 'proposer.mobile',
  'Primary Mobile': 'proposer.mobile',
  'Main Applicant Mobile': 'proposer.mobile',
  'Mobile': 'proposer.mobile',
  'Phone': 'proposer.mobile',
  
  // Proposer Alternate Mobile variations
  'proposer_alternate_mobile': 'proposer.alternate_mobile',
  'Proposer Alternate Mobile': 'proposer.alternate_mobile',
  'Primary Alternate Mobile': 'proposer.alternate_mobile',
  'Main Applicant Alternate Mobile': 'proposer.alternate_mobile',
  'Alternate Mobile': 'proposer.alternate_mobile',
  'Alternate Phone': 'proposer.alternate_mobile',
  
  // Proposer Email variations
  'proposer_email': 'proposer.email',
  'Proposer Email': 'proposer.email',
  'Primary Email': 'proposer.email',
  'Main Applicant Email': 'proposer.email',
  'Email': 'proposer.email',
  
 
  
  // Proposer KYC ID variations
  'proposer_kyc_id': 'proposer.kyc_id',
  'Proposer KYC ID': 'proposer.kyc_id',
  'Primary KYC ID': 'proposer.kyc_id',
  'Main Applicant KYC ID': 'proposer.kyc_id',
  'KYC ID': 'proposer.kyc_id',
  
  // Proposer Occupation variations
  'proposer_occupation': 'proposer.occupation',
  'Proposer Occupation': 'proposer.occupation',
  'Primary Occupation': 'proposer.occupation',
  'Main Applicant Occupation': 'proposer.occupation',
  'Occupation': 'proposer.occupation',
  
  // Proposer Nationality variations
  'proposer_nationality': 'proposer.nationality',
  'Proposer Nationality': 'proposer.nationality',
  'Primary Nationality': 'proposer.nationality',
  'Main Applicant Nationality': 'proposer.nationality',
  'Nationality': 'proposer.nationality',
   // Proposer Address variations
   'proposer_address': 'proposer.address',
   'Proposer Address': 'proposer.address',
   'Primary Address': 'proposer.address',
   'Main Applicant Address': 'proposer.address',
   'Address': 'proposer.address',
};

const NOMINEE_FIELD_MAPPING: Record<string, string> = {
  // Nominee Name variations
  'nominee_name': 'nominee_payment.nominee_name',
  'Nominee Name': 'nominee_payment.nominee_name',
  'Nominee': 'nominee_payment.nominee_name',
  'Beneficiary Name': 'nominee_payment.nominee_name',
  'Beneficiary': 'nominee_payment.nominee_name',
  
  // Nominee Salutation variations
  'nominee_salutation': 'nominee_payment.nominee_salutation',
  'Nominee Salutation': 'nominee_payment.nominee_salutation',
  'Beneficiary Salutation': 'nominee_payment.nominee_salutation',
  
  // Nominee Relation variations
  'nominee_relation': 'nominee_payment.nominee_relation',
  'Nominee Relation': 'nominee_payment.nominee_relation',
  'Beneficiary Relation': 'nominee_payment.nominee_relation',
  'Nominee Relationship': 'nominee_payment.nominee_relation',
  
  // Nominee Date of Birth variations
  'nominee_date_of_birth': 'nominee_payment.nominee_dob',
  'Nominee Date of Birth': 'nominee_payment.nominee_dob',
  'Nominee DOB': 'nominee_payment.nominee_dob',
  'Beneficiary DOB': 'nominee_payment.nominee_dob',
  
  // Payment Mode variations
  'payment_mode': 'nominee_payment.payment_mode',
  'Payment Mode': 'nominee_payment.payment_mode',
  'Mode of Payment': 'nominee_payment.payment_mode',
  'Payment Method': 'nominee_payment.payment_mode',
  
  // Payment Reference variations
  'payment_reference': 'nominee_payment.payment_reference',
  'Payment Reference': 'nominee_payment.payment_reference',
  'Payment Ref': 'nominee_payment.payment_reference',
  'Transaction Reference': 'nominee_payment.payment_reference',
  'Transaction Ref': 'nominee_payment.payment_reference',
  
  // Bank Name variations
  'bank_name': 'nominee_payment.bank_name',
  'Bank Name': 'nominee_payment.bank_name',
  'Bank': 'nominee_payment.bank_name',
  
  // Bank Account Number variations
  'bank_account_number': 'nominee_payment.bank_account_number',
  'Bank Account Number': 'nominee_payment.bank_account_number',
  'Account Number': 'nominee_payment.bank_account_number',
  'Bank A/C No': 'nominee_payment.bank_account_number',
  
  // Bank IFSC Code variations
  'bank_ifsc_code': 'nominee_payment.bank_ifsc_code',
  'Bank IFSC Code': 'nominee_payment.bank_ifsc_code',
  'IFSC Code': 'nominee_payment.bank_ifsc_code',
  'IFSC': 'nominee_payment.bank_ifsc_code',
  
  // Bank Branch Name variations
  'bank_branch_name': 'nominee_payment.bank_branch_name',
  'Bank Branch Name': 'nominee_payment.bank_branch_name',
  'Branch Name': 'nominee_payment.bank_branch_name',
  'Branch': 'nominee_payment.bank_branch_name',
};

// ===== DATA TRANSFORMATION HELPERS =====

const transformInsuranceType = (value: string) => {
  const typeMapping: Record<string, string> = {
    'Health Insurance': 'HEALTH INSURANCE',
    'Motor Insurance': 'MOTOR INSURANCE',
    'Life Insurance': 'LIFE INSURANCE',
    'HEALTH_INSURANCE': 'HEALTH INSURANCE',
    'MOTOR_INSURANCE': 'MOTOR INSURANCE',
    'LIFE_INSURANCE': 'LIFE INSURANCE',
    'health': 'HEALTH INSURANCE',
    'motor': 'MOTOR INSURANCE',
    'life': 'LIFE INSURANCE',
    'travel': 'TRAVEL INSURANCE',
    'TRAVEL_INSURANCE': 'TRAVEL INSURANCE',
    'Travel Insurance': 'TRAVEL INSURANCE',

  };
  return typeMapping[value] || value;
};

const transformGender = (value: string) => {
  const genderMapping: Record<string, string> = {
    'Male': 'Male',
    'Female': 'Female',
    'Other': 'Other',
    'M': 'Male',
    'F': 'Female',
    'O': 'Other',
    'male': 'Male',
    'female': 'Female',
    'other': 'Other',
  };
  return genderMapping[value] || value;
};

const transformMaritalStatus = (value: string) => {
  const statusMapping: Record<string, string> = {
    'Single': 'Single',
    'Married': 'Married',
    'Divorced': 'Divorced',
    'Widowed': 'Widowed',
    'S': 'Single',
    'M': 'Married',
    'D': 'Divorced',
    'W': 'Widowed',
    'single': 'Single',
    'married': 'Married',
    'divorced': 'Divorced',
    'widowed': 'Widowed',
  };
  return statusMapping[value] || value;
};

const transformBoolean = (value: any) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase().trim();
    return ['true', '1', 'yes', 'y', 'on'].includes(lowerValue);
  }
  return false;
};

const transformDate = (value: any) => {
  if (!value) return undefined;
  
  // Handle Excel serial numbers (Excel dates are serial numbers from 1900-01-01)
  if (typeof value === 'number') {
    // Excel serial number to date conversion
    // Excel dates are days since 1900-01-01 (with some quirks)
    const excelEpoch = new Date(1900, 0, 1);
    const date = new Date(excelEpoch.getTime() + (value - 2) * 24 * 60 * 60 * 1000);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  
  if (typeof value === 'string') {
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return undefined;
      return date.toISOString();
    } catch {
      return undefined;
    }
  }
  
  return value;
};

const transformNumber = (value: any) => {
  if (value === null || value === undefined || value === '') return undefined;
  const num = Number(value);
  return isNaN(num) ? undefined : num;
};

const transformString = (value: any) => {
  if (value === null || value === undefined || value === '') return undefined;
  return String(value);
};

// ===== DYNAMIC MEMBER DETECTION AND MAPPING =====

export function mapExcelFieldsWithDynamicMembers(record: any): any {
  const result: any = {
    
    proposer: {},
    insured_members: [],
    nominee_payment: {},
    form_values: []
  };
  
  console.log('🔍 [MAPPING] Starting field mapping for record:', Object.keys(record));
  
  // First pass: identify all member-related columns
  const insured_memberColumns: { [key: string]: { index: number, field: string } } = {};
  
  Object.keys(record).forEach(excelField => {
    // Detect member columns with various patterns
    const insured_memberPatterns = [
      /^member_(\d+)_(.+)$/i,           // member_0_name, member_1_relation
      /^Member (\d+) (.+)$/i,           // Member 0 Name, Member 1 Relation
      /^Dependent (\d+) (.+)$/i,        // Dependent 0 Name, Dependent 1 Relation
      /^Family Member (\d+) (.+)$/i,    // Family Member 0 Name
      /^insured_members (\d+) (.+)$/i,   // Insured Member 0 Name
      /^Insured Member (\d+) (.+)$/i,   // Insured Member 0 Name
      /^insured_member(\d+)_(.+)$/i,            // insured_member0_name, insured_member1_relation
      /^Insured Member(\d+) (.+)$/i,            // Insured Member0 Name, Insured Member1 Relation
      /^(\d+)_(.+)$/i,                  // 0_name, 1_relation (if it's clearly a member context)
    ];

    // Single member field patterns (without index)
    const singleMemberPatterns = [
      /^Member (.+)$/i,                 // Member Full Name, Member Relation
      /^Family Member (.+)$/i,          // Family Member DOB, Family Member Gender
      /^Insured Member (.+)$/i,         // Insured Member Name, Insured Member Relation
    ];
    
    // Insured Member in sheet insured_members in creation 

    // Check for indexed member patterns first
    for (const pattern of insured_memberPatterns) {
      const match = excelField.match(pattern);
      if (match) {
        const insured_memberIndex = parseInt(match[1]);
        const fieldName = match[2].toLowerCase().replace(/\s+/g, '_');
        console.log(`🔍 [MAPPING] Regex match for "${excelField}": index=${insured_memberIndex}, fieldName="${fieldName}"`);
        
        // Dynamic field mapping for member fields
        const fieldMapping: { [key: string]: string } = {
          // Name variations
          'name': 'name',
          'full_name': 'name',
          'member_name': 'name',
          'Member Full Name': 'name',
          'full name': 'name',
          'Full Name': 'name',
          'dependent_name': 'name',
          'family_member_name': 'name',
          'insured_member_name': 'name',
          
          // Salutation variations
          'salutation': 'insured_member_salutation',
          'Salutation': 'insured_member_salutation',
          'member_salutation': 'insured_member_salutation',
          'Member Salutation': 'insured_member_salutation',
          'dependent_salutation': 'insured_member_salutation',
          'family_member_salutation': 'insured_member_salutation',
          'Family Member Salutation': 'insured_member_salutation',
          'insured_member_salutation': 'insured_member_salutation',
          
          // Relation variations
          'relation': 'relation_to_proposer',
          'Relation': 'relation_to_proposer',
          'relation_to_proposer': 'relation_to_proposer',
          'relationship': 'relation_to_proposer',
          'member_relation': 'relation_to_proposer',
          'Member Relation': 'relation_to_proposer',
          'dependent_relation': 'relation_to_proposer',
          'family_member_relation': 'relation_to_proposer',
          'insured_member_relation': 'relation_to_proposer',
          
          // Date of Birth variations
          'date_of_birth': 'date_of_birth',
          'dob': 'date_of_birth',
          'DOB': 'date_of_birth',
          'birth_date': 'date_of_birth',
          'birthdate': 'date_of_birth',
          'member_dob': 'date_of_birth',
          'dependent_dob': 'date_of_birth',
          'Member DOB': 'date_of_birth',
          'Family Member DOB': 'date_of_birth',
          'family_member_dob': 'date_of_birth',
          'insured_member_dob': 'date_of_birth',
          
          // Gender variations
          'gender': 'gender',
          'sex': 'gender',
          'Gender': 'gender',
          'member_gender': 'gender',
          'dependent_gender': 'gender',
          'family_member_gender': 'gender',
          'Member Gender': 'gender',
          'Family Member Gender': 'gender',
          'insured_member_gender': 'gender',
          
          // // Pre-existing condition variations
          // 'pre_existing': 'pre_existing',
          // 'pre_existing_condition': 'pre_existing',
          // 'existing_condition': 'pre_existing',
          // 'member_pre_existing': 'pre_existing',
          // 'dependent_pre_existing': 'pre_existing',
          // 'family_member_pre_existing': 'pre_existing',
          // 'insured_member_pre_existing': 'pre_existing',
          
          // Medical condition variations
          'medical_condition': 'insured_member_medical_condition',
          'Medical Condition': 'insured_member_medical_condition',
          'health_condition': 'insured_member_medical_condition',
          'medical_status': 'insured_member_medical_condition',
          'health_status': 'insured_member_medical_condition',
          'member_medical_condition': 'insured_member_medical_condition',
          'dependent_medical_condition': 'insured_member_medical_condition',
          'family_member_medical_condition': 'insured_member_medical_condition',
          'Member Medical Condition': 'insured_member_medical_condition',
          'Family Member Medical Condition': 'insured_member_medical_condition',
          'insured_member_medical_condition': 'insured_member_medical_condition',
          
          // Medical remarks variations
          'medical_remarks': 'insured_member_medical_remarks',
          'Medical Remarks': 'insured_member_medical_remarks',
          'health_remarks': 'insured_member_medical_remarks',
          'medical_notes': 'insured_member_medical_remarks',
          'health_notes': 'insured_member_medical_remarks',
          'medical_comments': 'insured_member_medical_remarks',
          'health_comments': 'insured_member_medical_remarks',
          'member_medical_remarks': 'insured_member_medical_remarks',
          'dependent_medical_remarks': 'insured_member_medical_remarks',
          'family_member_medical_remarks': 'insured_member_medical_remarks',
          'Member Medical Remarks': 'insured_member_medical_remarks',
          'Family Member Medical Remarks': 'insured_member_medical_remarks',
          'insured_member_medical_remarks': 'insured_member_medical_remarks',
          
          // // Age variations (if provided instead of DOB)
          // 'age': 'age',
          // 'member_age': 'age',
          // 'dependent_age': 'age',
          // 'family_member_age': 'age',
          // 'insured_member_age': 'age',
          
          // // Contact variations (if needed)
          // 'mobile': 'mobile',
          // 'phone': 'mobile',
          // 'contact': 'mobile',
          // 'member_mobile': 'mobile',
          // 'dependent_mobile': 'mobile',
          // 'family_member_mobile': 'mobile',
          // 'insured_member_mobile': 'mobile',
          
          // // Email variations (if needed)
          // 'email': 'email',
          // 'member_email': 'email',
          // 'dependent_email': 'email',
          // 'family_member_email': 'email',
          // 'insured_member_email': 'email',
          
          // // Address variations (if needed)
          // 'address': 'address',
          // 'member_address': 'address',
          // 'dependent_address': 'address',
          // 'family_member_address': 'address',
          // 'insured_member_address': 'address',
          
          // // Occupation variations (if needed)
          // 'occupation': 'occupation',
          // 'job': 'occupation',
          // 'work': 'occupation',
          // 'member_occupation': 'occupation',
          // 'dependent_occupation': 'occupation',
          // 'family_member_occupation': 'occupation',
          // 'insured_member_occupation': 'occupation',
          
          // // Nationality variations (if needed)
          // 'nationality': 'nationality',
          // 'citizenship': 'nationality',
          // 'member_nationality': 'nationality',
          // 'dependent_nationality': 'nationality',
          // 'family_member_nationality': 'nationality',
          // 'insured_member_nationality': 'nationality',
        };
        
        const dbField = fieldMapping[fieldName] || fieldMapping[match[2]] || fieldName;
        insured_memberColumns[excelField] = { index: insured_memberIndex, field: dbField };
        console.log(`🔍 [MAPPING] Detected member field: "${excelField}" → index: ${insured_memberIndex}, field: ${dbField} (from "${fieldName}" or "${match[2]}")`);
        console.log(`🔍 [MAPPING] Field mapping lookup: fieldMapping["${fieldName}"] = ${fieldMapping[fieldName]}, fieldMapping["${match[2]}"] = ${fieldMapping[match[2]]}`);
        break;
      }
    }

    // Check for single member patterns (without index) - only if not already matched as indexed
    if (!insured_memberColumns[excelField]) {
      for (const pattern of singleMemberPatterns) {
        const match = excelField.match(pattern);
        if (match) {
        const fieldName = match[1].toLowerCase().replace(/\s+/g, '_');
        console.log(`🔍 [MAPPING] Single member regex match for "${excelField}": fieldName="${fieldName}"`);
        
        // Use the same field mapping for single members
        const fieldMapping: { [key: string]: string } = {
          // Name variations
          'name': 'name',
          'full_name': 'name',
          'member_name': 'name',
          'Member Full Name': 'name',
          'full name': 'name',
          'dependent_name': 'name',
          'family_member_name': 'name',
          'insured_member_name': 'name',
          
          // Salutation variations
          'salutation': 'insured_member_salutation',
          'Salutation': 'insured_member_salutation',
          'member_salutation': 'insured_member_salutation',
          'Member Salutation': 'insured_member_salutation',
          'dependent_salutation': 'insured_member_salutation',
          'family_member_salutation': 'insured_member_salutation',
          'Family Member Salutation': 'insured_member_salutation',
          'insured_member_salutation': 'insured_member_salutation',
          
          // Relation variations
          'relation': 'relation_to_proposer',
          'relation_to_proposer': 'relation_to_proposer',
          'relationship': 'relation_to_proposer',
          'member_relation': 'relation_to_proposer',
          'Member Relation': 'relation_to_proposer',
          'dependent_relation': 'relation_to_proposer',
          'family_member_relation': 'relation_to_proposer',
          'insured_member_relation': 'relation_to_proposer',
          
          // Date of Birth variations
          'date_of_birth': 'date_of_birth',
          'dob': 'date_of_birth',
          'birth_date': 'date_of_birth',
          'birthdate': 'date_of_birth',
          'member_dob': 'date_of_birth',
          'dependent_dob': 'date_of_birth',
          'Member DOB': 'date_of_birth',
          'Family Member DOB': 'date_of_birth',
          'family_member_dob': 'date_of_birth',
          'insured_member_dob': 'date_of_birth',
          
          // Gender variations
          'gender': 'gender',
          'sex': 'gender',
          'member_gender': 'gender',
          'dependent_gender': 'gender',
          'family_member_gender': 'gender',
          'Member Gender': 'gender',
          'Family Member Gender': 'gender',
          'insured_member_gender': 'gender',
          
          // Medical condition variations
          'medical_condition': 'insured_member_medical_condition',
          'health_condition': 'insured_member_medical_condition',
          'medical_status': 'insured_member_medical_condition',
          'health_status': 'insured_member_medical_condition',
          'member_medical_condition': 'insured_member_medical_condition',
          'dependent_medical_condition': 'insured_member_medical_condition',
          'family_member_medical_condition': 'insured_member_medical_condition',
          'Member Medical Condition': 'insured_member_medical_condition',
          'Family Member Medical Condition': 'insured_member_medical_condition',
          'insured_member_medical_condition': 'insured_member_medical_condition',
          
          // Medical remarks variations
          'medical_remarks': 'insured_member_medical_remarks',
          'health_remarks': 'insured_member_medical_remarks',
          'medical_notes': 'insured_member_medical_remarks',
          'health_notes': 'insured_member_medical_remarks',
          'medical_comments': 'insured_member_medical_remarks',
          'health_comments': 'insured_member_medical_remarks',
          'member_medical_remarks': 'insured_member_medical_remarks',
          'dependent_medical_remarks': 'insured_member_medical_remarks',
          'family_member_medical_remarks': 'insured_member_medical_remarks',
          'Member Medical Remarks': 'insured_member_medical_remarks',
          'Family Member Medical Remarks': 'insured_member_medical_remarks',
          'insured_member_medical_remarks': 'insured_member_medical_remarks',
        };
        
        const dbField = fieldMapping[fieldName] || fieldMapping[match[1]] || fieldName;
        // For single members, use index 0 (first member)
        insured_memberColumns[excelField] = { index: 0, field: dbField };
        console.log(`🔍 [MAPPING] Detected single member field: "${excelField}" → index: 0, field: ${dbField} (from "${fieldName}" or "${match[1]}")`);
        break;
      }
    }
  }
  });
  
  // Second pass: map all fields
  Object.keys(record).forEach(excelField => {
    const value = record[excelField];
    console.log(`🔍 [MAPPING] Processing Excel field: "${excelField}" = "${value}"`);
    
    // Check if it's a member field
    if (insured_memberColumns[excelField]) {
      const { index, field } = insured_memberColumns[excelField];
      if (!result.insured_members[index]) {
        result.insured_members[index] = {};
      }
      result.insured_members[index][field] = value;
      console.log(`✅ [MAPPING] Mapped member field: "${excelField}" → "insured_members[${index}].${field}" = "${value}"`);
    }
    // Check if it's a policy field
    else if (POLICY_FIELD_MAPPING[excelField]) {
      const standardField = POLICY_FIELD_MAPPING[excelField];
      result[standardField] = value;
      console.log(`✅ [MAPPING] Mapped policy field: "${excelField}" → "${standardField}" = "${value}"`);
    }
    // Check if it's a proposer field
    else if (PROPOSER_FIELD_MAPPING[excelField]) {
      const standardField = PROPOSER_FIELD_MAPPING[excelField];
      const [object, field] = standardField.split('.');
      if (object === 'proposer') {
        result.proposer[field] = value;
        console.log(`✅ [MAPPING] Mapped proposer field: "${excelField}" → "proposer.${field}" = "${value}"`);
      }
    }
    // Check if it's a nominee field
    else if (NOMINEE_FIELD_MAPPING[excelField]) {
      const standardField = NOMINEE_FIELD_MAPPING[excelField];
      const [object, field] = standardField.split('.');
      if (object === 'nominee_payment') {
        result.nominee_payment[field] = value;
        console.log(`✅ [MAPPING] Mapped nominee field: "${excelField}" → "nominee_payment.${field}" = "${value}"`);
      }
    }
    // Handle form values (custom fields)
    else if (excelField.toLowerCase().includes('form_') || 
             excelField.toLowerCase().includes('custom_') ||
             excelField.toLowerCase().includes('additional_')) {
      result.form_values.push({
        field_name: excelField,
        value: value
      });
      console.log(`📝 [MAPPING] Added form field: "${excelField}" = "${value}"`);
    }
    // Unmapped field
    else {
      console.log(`❌ [MAPPING] Unmapped field: "${excelField}" = "${value}"`);
    }
  });
  
  // Clean up empty objects and filter out empty members
  if (Object.keys(result.proposer).length === 0) {
    delete result.proposer;
  }
  
  // Filter out empty member objects and ensure proper structure
  result.insured_members = result.insured_members.filter((insured_member: any) => 
    insured_member && Object.keys(insured_member).length > 0 && 
    Object.values(insured_member).some(value => value !== null && value !== undefined && value !== '')
  );

  // Ensure each member has required fields
  result.insured_members = result.insured_members.map((member: any) => {
    // Ensure required fields are present
    if (!member.name && member.full_name) {
      member.name = member.full_name;
    }
    if (!member.relation_to_proposer && member.relation) {
      member.relation_to_proposer = member.relation;
    }
    if (!member.date_of_birth && member.dob) {
      member.date_of_birth = member.dob;
    }
    return member;
  });
  
  if (result.insured_members.length === 0) {
    delete result.insured_members;
  }
  
  if (Object.keys(result.nominee_payment).length === 0) {
    delete result.nominee_payment;
  }
  if (result.form_values.length === 0) {
    delete result.form_values;
  }
  
  console.log('✅ [MAPPING] Final mapped result keys:', Object.keys(result));
  console.log('✅ [MAPPING] Policy fields found:', {
    company_name: result.company_name,
    policy_group_name: result.policy_group_name,
    policy_type_name: result.policy_type_name,
    policy_name_name: result.policy_name_name,
    policy_salutation: result.policy_salutation
  });
  console.log('✅ [MAPPING] Proposer fields found:', result.proposer);
  console.log('✅ [MAPPING] Nominee fields found:', result.nominee_payment);
  console.log('✅ [MAPPING] Insured members found:', result.insured_members?.length || 0);
  if (result.insured_members && result.insured_members.length > 0) {
    console.log('✅ [MAPPING] Insured members structure:', JSON.stringify(result.insured_members, null, 2));
  }
  
  return result;
}

// ===== ENHANCED DATA TRANSFORMATION =====

export function transformExcelData(record: any): any {
  const transformed = { ...record };
  
  // Set type based on policy group from Excel data (but preserve original fields for repository lookup)
  if (!transformed.type) {
    if (transformed.policy_group_name) {
      // Use the policy group from Excel data and normalize to match database
      transformed.type = transformed.policy_group_name.toUpperCase();
    } else {
      // Default to HEALTH INSURANCE if no policy group specified
      transformed.type = 'HEALTH INSURANCE';
    }
  } else {
    transformed.type = transformInsuranceType(transformed.type);
  }
  
  // Ensure we preserve the original lookup fields for repository
  // These fields are needed for database lookups in the repository layer
  if (transformed.policy_group_name && !transformed.policy_group_name_original) {
    transformed.policy_group_name_original = transformed.policy_group_name;
  }
  if (transformed.policy_type_name && !transformed.policy_type_name_original) {
    transformed.policy_type_name_original = transformed.policy_type_name;
  }
  if (transformed.policy_name_name && !transformed.policy_name_name_original) {
    transformed.policy_name_name_original = transformed.policy_name_name;
  }
  
  if (transformed.medical_condition !== undefined) {
    transformed.medical_condition = transformBoolean(transformed.medical_condition);
  }
  if (transformed.deductible_amount_status !== undefined) {
    transformed.deductible_amount_status = transformBoolean(transformed.deductible_amount_status);
  }
  if (transformed.gst_status !== undefined) {
    transformed.gst_status = transformBoolean(transformed.gst_status);
  }
  
  // Transform numbers
  const numberFields = ['sum_insured', 'tenure_years', 'premium_amount', 'deductible_amount', 'emi_amount', 'commission_add_on_percentage'];
  numberFields.forEach(field => {
    if (transformed[field] !== undefined) {
      transformed[field] = transformNumber(transformed[field]);
    }
  });
  
  // Apply GST calculation based on GST status (matching PolicyForm.tsx logic)
  if (transformed.premium_amount !== undefined && transformed.premium_amount > 0) {
    const originalPremiumAmount = transformed.premium_amount;
    const gstStatus = transformed.gst_status || false; // Default to false if not specified
    
    if (gstStatus) {
      // GST is enabled: User entered GST-inclusive amount
      // Calculate GST-exclusive amount and store both
      const gstExclusiveAmount = calculateGSTExclusiveAmount(originalPremiumAmount);
      const gstAmount = calculateGSTAmount(originalPremiumAmount);
      
      // Store GST-inclusive amount as premium_amount (user-entered amount)
      transformed.premium_amount = originalPremiumAmount;
      // Store GST-exclusive amount in separate field
      transformed.premium_amount_gst = gstExclusiveAmount;
      
      // Log the GST calculation for debugging
      console.log(`🔍 [GST_CALCULATION] GST Enabled - Premium Amount Processing:`, {
        originalAmount: originalPremiumAmount,
        gstInclusiveAmount: originalPremiumAmount,
        gstExclusiveAmount: gstExclusiveAmount,
        gstAmount: gstAmount,
        gstRate: `${GST_RATE * 100}%`,
        gstStatus: gstStatus
      });
    } else {
      // GST is disabled: User entered amount as-is (no GST)
      // Store the amount as-is and clear GST-exclusive amount
      transformed.premium_amount = originalPremiumAmount;
      transformed.premium_amount_gst = undefined; // Clear GST-exclusive amount
      
      // Log the GST calculation for debugging
      console.log(`🔍 [GST_CALCULATION] GST Disabled - Premium Amount Processing:`, {
        originalAmount: originalPremiumAmount,
        finalAmount: originalPremiumAmount,
        gstStatus: gstStatus
      });
    }
  }
  
  // Transform dates
  const dateFields = ['start_date', 'end_date', 'issued_date'];
  dateFields.forEach(field => {
    if (transformed[field] !== undefined) {
      transformed[field] = transformDate(transformed[field]);
    }
  });
  
  // Transform proposer fields
  if (transformed.proposer) {
    if (transformed.proposer.gender) {
      transformed.proposer.gender = transformGender(transformed.proposer.gender);
    }
    if (transformed.proposer.marital_status) {
      transformed.proposer.marital_status = transformMaritalStatus(transformed.proposer.marital_status);
    }
    if (transformed.proposer.date_of_birth) {
      transformed.proposer.date_of_birth = transformDate(transformed.proposer.date_of_birth);
    }
    // Convert mobile to string
    if (transformed.proposer.mobile !== undefined) {
      transformed.proposer.mobile = transformString(transformed.proposer.mobile);
    }
    if (transformed.proposer.alternate_mobile !== undefined) {
      transformed.proposer.alternate_mobile = transformString(transformed.proposer.alternate_mobile);
    }
  }
  
  // Transform member fields with dynamic field support
  if (transformed.insured_members && Array.isArray(transformed.insured_members)) {
    transformed.insured_members.forEach((insured_member: any) => {
      // If relation is Self, populate from proposer when available
      const relation = (insured_member.relation_to_proposer || '').toString().trim().toLowerCase();
      if (relation === 'self' && transformed.proposer) {
        const proposer = transformed.proposer || {};
        // Populate only when member field is missing/empty
        if (!insured_member.name || String(insured_member.name).trim() === '') {
          insured_member.name = proposer.full_name || insured_member.name;
        }
        if (!insured_member.insured_member_salutation || String(insured_member.insured_member_salutation).trim() === '') {
          insured_member.insured_member_salutation = proposer.proposer_salutation || insured_member.insured_member_salutation;
        }
        if (!insured_member.date_of_birth || String(insured_member.date_of_birth).trim() === '') {
          insured_member.date_of_birth = proposer.date_of_birth || insured_member.date_of_birth;
        }
        if (!insured_member.gender || String(insured_member.gender).trim() === '') {
          insured_member.gender = proposer.gender || insured_member.gender;
        }
      }
      // Transform gender
      if (insured_member.gender) {
        insured_member.gender = transformGender(insured_member.gender);
      }
      
      // Transform date of birth
      if (insured_member.date_of_birth) {
        insured_member.date_of_birth = transformDate(insured_member.date_of_birth);
      }
      
      // Transform medical condition
      if (insured_member.insured_member_medical_condition !== undefined) {
        insured_member.insured_member_medical_condition = transformBoolean(insured_member.insured_member_medical_condition);
      }
      
      // Handle age field (if provided instead of DOB)
      if (insured_member.age && !insured_member.date_of_birth) {
        // Convert age to approximate date of birth (current year - age)
        const currentYear = new Date().getFullYear();
        const birthYear = currentYear - parseInt(insured_member.age);
        insured_member.date_of_birth = new Date(birthYear, 0, 1).toISOString();
        delete insured_member.age;
      }
      
      // Transform numbers for member fields and convert to strings where needed
      const insured_memberNumberFields = ['age'];
      insured_memberNumberFields.forEach(field => {
        if (insured_member[field] !== undefined) {
            insured_member[field] = transformNumber(insured_member[field]);
        }
      });
      
      // Convert mobile to string
      if (insured_member.mobile !== undefined) {
        insured_member.mobile = transformString(insured_member.mobile);
      }
    });
    
    // Clean up empty member objects
    transformed.insured_members = transformed.insured_members.filter((member: any) => {
      if (!member) return false;
      
      // Check if member has meaningful data
      const hasName = member.name && member.name.trim() !== '';
      const hasRelation = member.relation_to_proposer && member.relation_to_proposer.trim() !== '';
      const hasOtherData = Object.keys(member).some(key => {
        const value = member[key];
        return value !== null && value !== undefined && value !== '' && value !== 'false';
      });
      
      return hasName || hasRelation || hasOtherData;
    });
  }
  
  // Transform nominee fields
  if (transformed.nominee_payment) {
    if (transformed.nominee_payment.nominee_dob) {
      transformed.nominee_payment.nominee_dob = transformDate(transformed.nominee_payment.nominee_dob);
    }
  }

  // Ensure customer_name mirrors Policy Holder (proposer) full name when available,
  // otherwise fall back to a suitable insured member name
  if (!transformed.customer_name || transformed.customer_name === '') {
    if (transformed.proposer && transformed.proposer.full_name) {
      transformed.customer_name = transformed.proposer.full_name;
    } else if (Array.isArray(transformed.insured_members) && transformed.insured_members.length > 0) {
      // Prefer member with relation "Self"; otherwise take first member with a non-empty name
      const selfMember = transformed.insured_members.find((m: any) =>
        (m?.relation_to_proposer || '').toLowerCase() === 'self' && m?.name && String(m.name).trim() !== ''
      );
      const firstNamedMember = transformed.insured_members.find((m: any) => m?.name && String(m.name).trim() !== '');
      const fallbackName = selfMember?.name || firstNamedMember?.name;
      if (fallbackName) {
        transformed.customer_name = String(fallbackName);
      }
    }
  }
  
  // Handle foreign keys
  const foreignKeyFields = ['policy_type_id', 'policy_name_id', 'policy_group_id'];
  foreignKeyFields.forEach(field => {
    if (transformed[field] === '' || transformed[field] === null) {
      transformed[field] = null;
    }
  });
  
  return transformed;
}

// ===== ZOD VALIDATION SCHEMA =====

export const ComprehensiveImportSchema = z.object({
  // Policy fields
  policy_number: z.string().min(1, "Policy number is required"),
  customer_name: z.string().min(1, "Customer name is required"),
  type: z.string().default('HEALTH INSURANCE'),
  // insurer_name: z.string().min(1, "Insurer name is required").default('Default Insurer'),
  // product_name: z.string().min(1, "Product name is required"),
  // plan_type: z.string().min(1, "Plan type is required"),
  sum_insured: z.number().positive().optional(),
  start_date: z.union([z.string().datetime(), z.number()]).optional(),
  end_date: z.union([z.string().datetime(), z.number()]).optional(),
  tenure_years: z.number().positive().optional(),
  // issued_date: z.string().datetime("Issued date must be a valid date"),
  premium_amount: z.number().positive().optional(),
  premium_amount_gst: z.number().positive().optional(),
  gst_status: z.boolean().optional(),
  declaration_accepted: z.boolean().default(true),
  deductible_amount_status: z.boolean().optional(),
  medical_condition: z.boolean().optional(),
  medical_remarks: z.string().optional(),
  policy_creation_status: z.enum(['Fresh', 'Renewal', 'Migration', 'Portablity']).optional(),
  deductible_amount: z.number().optional(),
  emi_amount: z.number().optional(),
  commission_add_on_percentage: z.number().optional(),
  company_name: z.string().optional(),
  policy_type_name: z.string().nullable().optional(),
  policy_name_name: z.string().nullable().optional(),
  policy_group_name: z.string().nullable().optional(),
  policy_salutation: z.string().optional(),
  
  // Proposer
  proposer: z.object({
    full_name: z.string().optional(),
    proposer_salutation: z.string().optional(),
    date_of_birth: z.union([z.string().datetime(), z.number()]).optional(),
    gender: z.enum(['Male', 'Female', 'Other']).optional(),
    marital_status: z.enum(['Single', 'Married', 'Divorced', 'Widowed']).optional(),
    mobile: z.union([z.string(), z.number()]).optional(),
    alternate_mobile: z.union([z.string(), z.number()]).optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),
    kyc_id: z.string().optional(),
    occupation: z.string().optional(),
    nationality: z.string().optional(),
  }).optional(),
  
  // Multiple members with dynamic fields
  insured_members: z.array(z.object({
    name: z.string().optional(),
    insured_member_salutation: z.string().optional(),
    relation_to_proposer: z.string().optional(),
    date_of_birth: z.union([z.string().datetime(), z.number()]).optional(),
    gender: z.enum(['Male', 'Female', 'Other']).optional(),
    pre_existing: z.boolean().optional(),
    insured_member_medical_condition: z.boolean().optional(),
    insured_member_medical_remarks: z.string().optional(),
    // Additional dynamic fields
    age: z.number().optional(),
    mobile: z.union([z.string(), z.number()]).optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),
    occupation: z.string().optional(),
    nationality: z.string().optional(),
  })).optional(),
  
  // Nominee
  nominee_payment: z.object({
    nominee_name: z.string().optional(),
    nominee_salutation: z.string().optional(),
    nominee_relation: z.string().optional(),
    nominee_dob: z.union([z.string().datetime(), z.number()]).optional(),
    payment_mode: z.string().optional(),
    payment_reference: z.string().optional(),
    bank_name: z.string().optional(),
    bank_account_number: z.string().optional(),
    bank_ifsc_code: z.string().optional(),
    bank_branch_name: z.string().optional(),
  }).optional(),
  
  // Form values
  form_values: z.array(z.object({
    field_name: z.string(),
    value: z.string(),
  })).optional(),
});

export function validateComprehensiveRecord(record: any) {
  try {
    // Pre-process the record to handle any remaining type issues
    const processedRecord = { ...record };
    
    // Ensure required fields have defaults
    if (!processedRecord.type) {
      processedRecord.type = 'HEALTH INSURANCE';
    }
    
    // Convert any remaining number dates to strings
    const dateFields = ['start_date', 'end_date', 'issued_date'];
    dateFields.forEach(field => {
      if (processedRecord[field] && typeof processedRecord[field] === 'number') {
        processedRecord[field] = transformDate(processedRecord[field]);
      }
    });
    
    // Convert mobile numbers to strings
    if (processedRecord.proposer) {
      if (processedRecord.proposer.mobile && typeof processedRecord.proposer.mobile === 'number') {
        processedRecord.proposer.mobile = transformString(processedRecord.proposer.mobile);
      }
      if (processedRecord.proposer.alternate_mobile && typeof processedRecord.proposer.alternate_mobile === 'number') {
        processedRecord.proposer.alternate_mobile = transformString(processedRecord.proposer.alternate_mobile);
      }
      if (processedRecord.proposer.date_of_birth && typeof processedRecord.proposer.date_of_birth === 'number') {
        processedRecord.proposer.date_of_birth = transformDate(processedRecord.proposer.date_of_birth);
      }
    }
    
    // Handle member dates and mobile numbers
    if (processedRecord.insured_members && Array.isArray(processedRecord.insured_members)) {
      processedRecord.insured_members.forEach((member: any) => {
        if (member.date_of_birth && typeof member.date_of_birth === 'number') {
          member.date_of_birth = transformDate(member.date_of_birth);
        }
        if (member.mobile && typeof member.mobile === 'number') {
          member.mobile = transformString(member.mobile);
        }
      });
    }
    
    // Handle nominee dates
    if (processedRecord.nominee_payment && processedRecord.nominee_payment.nominee_dob && typeof processedRecord.nominee_payment.nominee_dob === 'number') {
      processedRecord.nominee_payment.nominee_dob = transformDate(processedRecord.nominee_payment.nominee_dob);
    }
    
    return ComprehensiveImportSchema.safeParse(processedRecord);
  } catch (error) {
    console.error('[VALIDATION] Error during validation:', error);
    return {
      success: false,
      error: {
        errors: [{
          message: 'Validation failed due to unexpected error',
          code: 'VALIDATION_ERROR',
          details: error instanceof Error ? error.message : String(error)
        }]
      }
    };
  }
}

// processPolicyData function removed - all lookups are now handled in the repository layer
