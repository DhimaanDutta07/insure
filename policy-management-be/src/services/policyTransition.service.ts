import { PrismaClient, PolicyTransitionType, PolicyCreationStatus, UploadedDocument } from '@prisma/client';
import { DocumentAccessService } from './documentAccess.service';

const prisma = new PrismaClient();

export interface CreatePolicyTransitionInput {
  parentPolicyId: string;
  transitionType: PolicyTransitionType;
  newPolicyData: any; // This will be the policy creation data
  copyDocuments?: boolean;
  copyMembers?: boolean;
  copyProposer?: boolean;
}

export interface PolicyTransitionResult {
  newPolicy: any;
  documentReferences: any[];
  memberReferences: any[];
  errors: string[];
}

export class PolicyTransitionService {
  
  static async createPolicyTransition(
    parentPolicyId: string,
    transitionType: PolicyTransitionType,
    newPolicyData: any
  ): Promise<PolicyTransitionResult> {
    
    const result: PolicyTransitionResult = {
      newPolicy: null,
      documentReferences: [],
      memberReferences: [],
      errors: []
    };
    
    try {
      // 1. Get parent policy with all related data
      const parentPolicy = await prisma.policy.findUnique({
        where: { id: parentPolicyId },
        include: {
          proposer: true,
          members: true,
          nominee_payment: true,
          documents: true,
          form_values: true
        }
      });
      
      if (!parentPolicy) {
        throw new Error('Parent policy not found');
      }

      // 2. For Portability and Internal Portability, update the same policy record
      if (transitionType === 'PORTABILITY' || transitionType === 'MIGRATION') {
        const updatedPolicy = await this.updatePolicyForPortability(parentPolicy, newPolicyData, transitionType);
        result.newPolicy = updatedPolicy;

        // 3. Create document references (not copies)
        const documentRefs = await this.createDocumentReferences(
          parentPolicyId,
          updatedPolicy.id,
          transitionType
        );
        result.documentReferences = documentRefs;

        // 4. Clear cache for affected policies
        DocumentAccessService.clearCache(parentPolicyId);
        DocumentAccessService.clearCache(updatedPolicy.id);

        console.log(`Updated policy ${updatedPolicy.id} for ${transitionType}`);
      } else {
        // For Renewal, create new policy as before
        const newPolicy = await this.createPolicyWithCarriedOverData(parentPolicy, newPolicyData);
        result.newPolicy = newPolicy;

        // 3. Set transition relationship
        await prisma.policy.update({
          where: { id: newPolicy.id },
          data: {
            parent_policy_id: parentPolicyId,
            transition_type: transitionType,
            policy_creation_status: this.getPolicyCreationStatus(transitionType)
          }
        });

        // 4. Create document references (not copies)
        const documentRefs = await this.createDocumentReferences(
          parentPolicyId,
          newPolicy.id,
          transitionType
        );
        result.documentReferences = documentRefs;

        // 5. Clear cache for affected policies
        DocumentAccessService.clearCache(parentPolicyId);
        DocumentAccessService.clearCache(newPolicy.id);

        console.log(`Created ${documentRefs.length} document references for policy ${newPolicy.id}`);
      }
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      result.errors.push(`Failed to create policy transition: ${errorMessage}`);
    }
    
    return result;
  }
  
  private static getPolicyCreationStatus(transitionType: PolicyTransitionType): PolicyCreationStatus {
    switch (transitionType) {
      case 'RENEWAL':
        return 'Renewal';
      case 'MIGRATION':
        return 'Migration';
      case 'PORTABILITY':
        return 'Portablity';
      default:
        return 'Fresh';
    }
  }

  private static async updatePolicyForPortability(
    parentPolicy: any,
    newPolicyData: any,
    transitionType: PolicyTransitionType
  ): Promise<any> {
    // Convert string values to appropriate types for Prisma
    const processedData = {
      ...newPolicyData,
      // Convert numeric strings to numbers
      premium_amount: typeof newPolicyData.premium_amount === 'string'
        ? parseFloat(newPolicyData.premium_amount)
        : newPolicyData.premium_amount,
      sum_insured: typeof newPolicyData.sum_insured === 'string'
        ? parseInt(newPolicyData.sum_insured)
        : newPolicyData.sum_insured,
      tenure_years: typeof newPolicyData.tenure_years === 'string'
        ? parseInt(newPolicyData.tenure_years)
        : newPolicyData.tenure_years,
      // Ensure other numeric fields are properly typed
      deductible_amount: newPolicyData.deductible_amount ?
        (typeof newPolicyData.deductible_amount === 'string'
          ? parseInt(newPolicyData.deductible_amount)
          : newPolicyData.deductible_amount) : null,
      // Convert date strings to DateTime objects
      start_date: newPolicyData.start_date ? new Date(newPolicyData.start_date) : null,
      end_date: newPolicyData.end_date ? new Date(newPolicyData.end_date) : null,
      issued_date: newPolicyData.issued_date ? new Date(newPolicyData.issued_date) : null,
      // Update transition type and status
      transition_type: transitionType,
      policy_creation_status: this.getPolicyCreationStatus(transitionType),
      // Update company to new insurer
      company_id: newPolicyData.company_id || parentPolicy.company_id,
      insurer_name: newPolicyData.insurer_name || parentPolicy.insurer_name,
      product_name: newPolicyData.product_name || parentPolicy.product_name,
      plan_type: newPolicyData.plan_type || parentPolicy.plan_type,
    };

    // Update the existing policy instead of creating a new one
    const updatedPolicy = await prisma.policy.update({
      where: { id: parentPolicy.id },
      data: processedData
    });

    return updatedPolicy;
  }
  
  private static async createPolicyWithCarriedOverData(parentPolicy: any, newPolicyData: any): Promise<any> {
    // Convert string values to appropriate types for Prisma
    const processedData = {
      ...newPolicyData,
      // Convert numeric strings to numbers
      premium_amount: typeof newPolicyData.premium_amount === 'string' 
        ? parseFloat(newPolicyData.premium_amount) 
        : newPolicyData.premium_amount,
      sum_insured: typeof newPolicyData.sum_insured === 'string' 
        ? parseInt(newPolicyData.sum_insured) 
        : newPolicyData.sum_insured,
      tenure_years: typeof newPolicyData.tenure_years === 'string' 
        ? parseInt(newPolicyData.tenure_years) 
        : newPolicyData.tenure_years,
      // Ensure other numeric fields are properly typed
      deductible_amount: newPolicyData.deductible_amount ? 
        (typeof newPolicyData.deductible_amount === 'string' 
          ? parseInt(newPolicyData.deductible_amount) 
          : newPolicyData.deductible_amount) : null,
      // Convert date strings to DateTime objects
      start_date: newPolicyData.start_date ? new Date(newPolicyData.start_date) : null,
      end_date: newPolicyData.end_date ? new Date(newPolicyData.end_date) : null,
      issued_date: newPolicyData.issued_date ? new Date(newPolicyData.issued_date) : null,
      // Add default values for required fields
      policy_creation_status: newPolicyData.policy_creation_status || 'Fresh',
      created_by: 'system', // You might want to get this from the authenticated user
      // Carry over important fields from parent policy if not provided in new data
      policy_group_id: newPolicyData.policy_group_id || parentPolicy.policy_group_id || null,
      policy_type_id: newPolicyData.policy_type_id || parentPolicy.policy_type_id || null,
      policy_salutation: newPolicyData.policy_salutation || parentPolicy.policy_salutation || null,
      medical_condition: newPolicyData.medical_condition !== undefined ? newPolicyData.medical_condition : parentPolicy.medical_condition || false,
      medical_remarks: newPolicyData.medical_remarks || parentPolicy.medical_remarks || null,
      deductible_amount_status: newPolicyData.deductible_amount_status !== undefined ? newPolicyData.deductible_amount_status : parentPolicy.deductible_amount_status || false,
      declaration_accepted: newPolicyData.declaration_accepted !== undefined ? newPolicyData.declaration_accepted : parentPolicy.declaration_accepted || false,
      // Carry over financial fields from parent if not provided
      emi_amount: newPolicyData.emi_amount || parentPolicy.emi_amount || null,
      commission_add_on_percentage: newPolicyData.commission_add_on_percentage || parentPolicy.commission_add_on_percentage || null,
      calculated_commission_amount: newPolicyData.calculated_commission_amount || parentPolicy.calculated_commission_amount || null,
    };

    // Create the new policy with all carried over data
    const createData: any = {
      ...processedData,
    };

    // Carry over proposer data if exists
    if (parentPolicy.proposer) {
      createData.proposer = {
        create: {
          proposer_salutation: parentPolicy.proposer.proposer_salutation || null,
          full_name: parentPolicy.proposer.full_name || '',
          date_of_birth: parentPolicy.proposer.date_of_birth || null,
          gender: parentPolicy.proposer.gender || null,
          marital_status: parentPolicy.proposer.marital_status || null,
          mobile: parentPolicy.proposer.mobile || '',
          alternate_mobile: parentPolicy.proposer.alternate_mobile || null,
          email: parentPolicy.proposer.email || null,
          address: parentPolicy.proposer.address || '',
          kyc_id: parentPolicy.proposer.kyc_id || null,
          occupation: parentPolicy.proposer.occupation || null,
          nationality: parentPolicy.proposer.nationality || null,
        }
      };
    }

    // Carry over nominee and payment data if exists
    if (parentPolicy.nominee_payment) {
      createData.nominee_payment = {
        create: {
          nominee_salutation: parentPolicy.nominee_payment.nominee_salutation || null,
          nominee_name: parentPolicy.nominee_payment.nominee_name || '',
          nominee_relation: parentPolicy.nominee_payment.nominee_relation || null,
          nominee_dob: parentPolicy.nominee_payment.nominee_dob || null,
          payment_mode: parentPolicy.nominee_payment.payment_mode || null,
          payment_reference: parentPolicy.nominee_payment.payment_reference || null,
          bank_name: parentPolicy.nominee_payment.bank_name || null,
          bank_account_number: parentPolicy.nominee_payment.bank_account_number || null,
          bank_ifsc_code: parentPolicy.nominee_payment.bank_ifsc_code || null,
          bank_branch_name: parentPolicy.nominee_payment.bank_branch_name || null,
        }
      };
    }

    // Carry over form values if exists
    if (parentPolicy.form_values && parentPolicy.form_values.length > 0) {
      createData.form_values = {
        create: parentPolicy.form_values.map((formValue: any) => ({
          field_name: formValue.field_name || '',
          value: formValue.value || '',
        }))
      };
    }

    // First create the policy with proposer, nominee, and form values
    const newPolicy = await prisma.policy.create({
      data: createData,
      include: {
        proposer: true,
        nominee_payment: true,
        form_values: true
      }
    });

    // Then create members separately if they exist (because they need proposer_id)
    if (parentPolicy.members && parentPolicy.members.length > 0 && newPolicy.proposer) {
      const membersToCreate = parentPolicy.members.map((member: any) => ({
        policy_id: newPolicy.id,
        proposer_id: newPolicy.proposer!.id, // Using non-null assertion since we checked above
        insured_member_salutation: member.insured_member_salutation || null,
        name: member.name || '',
        relation_to_proposer: member.relation_to_proposer || null,
        date_of_birth: member.date_of_birth || null,
        gender: member.gender || null,
        pre_existing: member.pre_existing || false,
        insured_member_medical_condition: member.insured_member_medical_condition || false,
        insured_member_medical_remarks: member.insured_member_medical_remarks || null,
      }));

      await prisma.insuredMember.createMany({
        data: membersToCreate
      });
    }

    // Return the complete policy with all relations
    return await prisma.policy.findUnique({
      where: { id: newPolicy.id },
      include: {
        proposer: true,
        members: true,
        nominee_payment: true,
        documents: true,
        form_values: true
      }
    });
  }

  private static async createPolicy(policyData: any): Promise<any> {
    // Convert string values to appropriate types for Prisma
    const processedData = {
      ...policyData,
      // Convert numeric strings to numbers
      premium_amount: typeof policyData.premium_amount === 'string' 
        ? parseFloat(policyData.premium_amount) 
        : policyData.premium_amount,
      sum_insured: typeof policyData.sum_insured === 'string' 
        ? parseInt(policyData.sum_insured) 
        : policyData.sum_insured,
      tenure_years: typeof policyData.tenure_years === 'string' 
        ? parseInt(policyData.tenure_years) 
        : policyData.tenure_years,
      // Ensure other numeric fields are properly typed
      deductible_amount: policyData.deductible_amount ? 
        (typeof policyData.deductible_amount === 'string' 
          ? parseInt(policyData.deductible_amount) 
          : policyData.deductible_amount) : null,
      emi_amount: policyData.emi_amount ? 
        (typeof policyData.emi_amount === 'string' 
          ? parseInt(policyData.emi_amount) 
          : policyData.emi_amount) : null,
      commission_add_on_percentage: policyData.commission_add_on_percentage ? 
        (typeof policyData.commission_add_on_percentage === 'string' 
          ? parseInt(policyData.commission_add_on_percentage) 
          : policyData.commission_add_on_percentage) : null,
      calculated_commission_amount: policyData.calculated_commission_amount ? 
        (typeof policyData.calculated_commission_amount === 'string' 
          ? parseFloat(policyData.calculated_commission_amount) 
          : policyData.calculated_commission_amount) : null,
      // Convert date strings to DateTime objects
      start_date: policyData.start_date ? new Date(policyData.start_date) : null,
      end_date: policyData.end_date ? new Date(policyData.end_date) : null,
      issued_date: policyData.issued_date ? new Date(policyData.issued_date) : null,
      // Add default values for required fields
      policy_creation_status: policyData.policy_creation_status || 'Fresh',
      created_by: 'system', // You might want to get this from the authenticated user
      // Ensure these fields are properly set
      policy_group_id: policyData.policy_group_id || null,
      policy_type_id: policyData.policy_type_id || null,
    };

    return await prisma.policy.create({
      data: processedData,
      include: {
        proposer: true,
        members: true,
        nominee_payment: true,
        documents: true
      }
    });
  }
  
  private static async createDocumentReferences(
    parentPolicyId: string,
    newPolicyId: string,
    transitionType: PolicyTransitionType
  ): Promise<any[]> {
    
    console.log(`🔗 [DocumentTransfer] Starting recursive document transfer for policy ${newPolicyId}`);
    
    // Get all ancestor policies recursively
    const ancestorPolicies = await this.getAllAncestorPolicies(parentPolicyId);
    console.log(`🔗 [DocumentTransfer] Found ${ancestorPolicies.length} ancestor policies`);
    
    // Collect ALL documents from all ancestor policies
    const allAncestorDocuments: any[] = [];
    
    for (const ancestorPolicy of ancestorPolicies) {
      console.log(`🔗 [DocumentTransfer] Processing ancestor policy: ${ancestorPolicy.id} (${ancestorPolicy.policy_number})`);
      
      // 1. Direct policy documents
      if (ancestorPolicy.documents) {
        allAncestorDocuments.push(...ancestorPolicy.documents.map((doc: any) => ({
          ...doc,
          source_policy_id: ancestorPolicy.id,
          source_policy_number: ancestorPolicy.policy_number
        })));
      }
      
      // 2. Proposer documents
      if (ancestorPolicy.proposer?.documents) {
        allAncestorDocuments.push(...ancestorPolicy.proposer.documents.map((doc: any) => ({
          ...doc,
          source_policy_id: ancestorPolicy.id,
          source_policy_number: ancestorPolicy.policy_number
        })));
      }
      
      // 3. Member documents
      if (ancestorPolicy.proposer?.insured_members) {
        ancestorPolicy.proposer.insured_members.forEach((member: any) => {
          if (member.documents) {
            allAncestorDocuments.push(...member.documents.map((doc: any) => ({
              ...doc,
              source_policy_id: ancestorPolicy.id,
              source_policy_number: ancestorPolicy.policy_number,
              source_member_id: member.id
            })));
          }
        });
      }
    }
    
    console.log(`📄 [DocumentTransfer] Collected ${allAncestorDocuments.length} total documents from all ancestors`);
    
    // Filter documents based on transition type
    const documentsToReference = this.filterDocumentsByTransitionType(
      allAncestorDocuments,
      transitionType
    );
    
    console.log(`🔗 [DocumentTransfer] Creating references for ${documentsToReference.length} documents`);
    
    // Create references in batch for efficiency
    const referenceData = documentsToReference.map(doc => ({
      policy_id: newPolicyId,
      source_document_id: doc.id,
      transition_type: transitionType,
      can_edit: false,
      can_delete: true  // Allow users to remove references if not needed
    }));
    
    const createdRefs = await prisma.policyDocumentReference.createMany({
      data: referenceData,
      skipDuplicates: true
    });
    
    console.log(`✅ [DocumentTransfer] Created ${createdRefs.count} document references`);
    
    // Return the created references
    return await prisma.policyDocumentReference.findMany({
      where: { 
        policy_id: newPolicyId,
        transition_type: transitionType
      },
      include: {
        source_document: true
      }
    });
  }
  
  /**
   * Recursively get all ancestor policies (parent, grandparent, etc.)
   */
  private static async getAllAncestorPolicies(policyId: string): Promise<any[]> {
    const ancestors: any[] = [];
    let currentPolicyId = policyId;
    
    while (currentPolicyId) {
      const policy = await prisma.policy.findUnique({
        where: { id: currentPolicyId },
        include: {
          company: true,
          policyName: true,
          documents: true,
          proposer: {
            include: {
              documents: true,
              insured_members: {
                include: {
                  documents: true
                }
              }
            }
          }
        }
      });
      
      if (!policy) {
        console.log(`❌ [DocumentTransfer] Policy ${currentPolicyId} not found`);
        break;
      }
      
      ancestors.push(policy);
      console.log(`🔗 [DocumentTransfer] Added ancestor: ${policy.policy_number} (${policy.id})`);
      
      // Move to parent policy
      currentPolicyId = policy.parent_policy_id || '';
    }
    
    console.log(`🔗 [DocumentTransfer] Total ancestors found: ${ancestors.length}`);
    return ancestors;
  }
  
  private static filterDocumentsByTransitionType(
    documents: UploadedDocument[],
    transitionType: PolicyTransitionType
  ): UploadedDocument[] {
    
    // For now, carry over ALL documents from the parent policy
    // This ensures all documents are available in the new policy
    return documents;
    
    // Original filtering logic (commented out for now)
    /*
    switch (transitionType) {
      case 'RENEWAL':
        return documents.filter(doc => 
          doc.category !== 'CLAIM_DOCUMENT'
        );
        
      case 'MIGRATION':
        return documents.filter(doc => 
          (doc.category && ['POLICY_DOCUMENT', 'PROPOSER_DOCUMENT'].includes(doc.category)) ||
          (doc.category === 'INSURED_MEMBER_DOCUMENT' && this.isRecentDocument(doc))
        );
        
      case 'PORTABILITY':
        return documents.filter(doc => 
          doc.category === 'POLICY_DOCUMENT' ||
          (doc.category === 'INSURED_MEMBER_DOCUMENT' && this.isHealthDocument(doc))
        );
        
      default:
        return documents;
    }
    */
  }
  
  private static isRecentDocument(doc: UploadedDocument): boolean {
    if (!doc.created_at) return false;
    
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    
    return new Date(doc.created_at) > twoYearsAgo;
  }
  
  private static isHealthDocument(doc: UploadedDocument): boolean {
    // Check if document is health-related based on name or category
    const healthKeywords = ['medical', 'health', 'hospital', 'doctor', 'prescription'];
    const fileName = doc.original_name?.toLowerCase() || '';
    
    return healthKeywords.some(keyword => fileName.includes(keyword));
  }
  
  /**
   * Build year-wise claim summary for a given policy between its start and end years.
   */
  private static async buildClaimsByYear(policy: any): Promise<Array<{ year: number; hasClaim: boolean; claimCount: number; totalPaid: number }>> {
    const start = policy.start_date ? new Date(policy.start_date) : null;
    const end = policy.end_date ? new Date(policy.end_date) : null;
    if (!start || !end) return [];

    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    const claims = await prisma.claim.findMany({
      where: {
        policy_id: policy.id,
        is_deleted: false,
        claim_date: { not: null }
      },
      select: {
        claim_date: true,
        claim_status: true,
        claim_amount: true
      }
    });

    const claimsByYearMap = new Map<number, { count: number; totalPaid: number }>();
    for (const c of claims) {
      if (!c.claim_date) continue;
      const y = new Date(c.claim_date as unknown as Date).getFullYear();
      const prev = claimsByYearMap.get(y) || { count: 0, totalPaid: 0 };
      prev.count += 1;
      if (c.claim_status === 'Approved' || c.claim_status === 'Paid') {
        prev.totalPaid += Number(c.claim_amount || 0);
      }
      claimsByYearMap.set(y, prev);
    }

    const summary: Array<{ year: number; hasClaim: boolean; claimCount: number; totalPaid: number }> = [];
    for (let y = startYear; y <= endYear; y++) {
      const stats = claimsByYearMap.get(y);
      summary.push({
        year: y,
        hasClaim: !!stats && stats.count > 0,
        claimCount: stats?.count || 0,
        totalPaid: stats?.totalPaid || 0
      });
    }
    return summary;
  }
  
  static async getPolicyTransitionHistory(policyId: string): Promise<{
    parentPolicy?: any;
    childrenPolicies: any[];
    transitionHistory: any[];
    completeHierarchy: any[]; // New field for complete hierarchy
  }> {
    
    // Get all ancestor policies recursively
    const ancestorPolicies = await this.getAllAncestorPolicies(policyId);
    
    const policy = await prisma.policy.findUnique({
      where: { id: policyId },
      include: {
        company: true,
        policyName: true,
        parent_policy: {
          include: {
            company: true,
            policyName: true
          }
        },
        children_policies: {
          include: {
            company: true,
            policyName: true,
            documents: true,
            document_references: {
              include: {
                source_document: true
              }
            }
          }
        }
      }
    });
    
    if (!policy) {
      throw new Error('Policy not found');
    }
    
    const transitionHistory = [];
    
    // Build complete hierarchy from earliest ancestor to current policy to children
    const completeHierarchy = [];
    
    console.log(`🔍 [PolicyHistory] Building hierarchy for policy ${policyId}`);
    console.log(`🔍 [PolicyHistory] Found ${ancestorPolicies.length} ancestor policies`);
    
    // Filter out the current policy from ancestors to prevent duplication
    const filteredAncestors = ancestorPolicies.filter(ancestor => ancestor.id !== policyId);
    console.log(`🔍 [PolicyHistory] After filtering current policy: ${filteredAncestors.length} ancestors`);
    
    // Add ancestor policies (in chronological order from earliest to latest)
    // The filteredAncestors array is in reverse order (current -> parent -> grandparent -> etc.)
    // So we need to reverse it to show earliest first
    const chronologicalAncestors = [...filteredAncestors].reverse();
    
    console.log(`🔍 [PolicyHistory] Chronological order:`, chronologicalAncestors.map(p => p.policy_number));
    
    for (let i = 0; i < chronologicalAncestors.length; i++) {
      const ancestor = chronologicalAncestors[i];
      const isImmediateParent = i === chronologicalAncestors.length - 1;
      
      console.log(`🔍 [PolicyHistory] Adding ancestor ${i + 1}: ${ancestor.policy_number} (${isImmediateParent ? 'PARENT' : 'ANCESTOR'})`);
      
      completeHierarchy.push({
        policy: ancestor,
        relationship: isImmediateParent ? 'PARENT' : 'ANCESTOR',
        transition_type: ancestor.transition_type,
        position: isImmediateParent ? 'PARENT' : 'ANCESTOR',
        generation: chronologicalAncestors.length - i // Generation number (1 = immediate parent, 2 = grandparent, etc.)
      });
    }
    
    // Add current policy
    console.log(`🔍 [PolicyHistory] Adding current policy: ${policy.policy_number}`);
    completeHierarchy.push({
      policy: policy,
      relationship: 'CURRENT',
      transition_type: null,
      position: 'CURRENT',
      generation: 0
    });
    
    // Add child policies
    console.log(`🔍 [PolicyHistory] Adding ${policy.children_policies.length} child policies`);
    policy.children_policies.forEach(child => {
      console.log(`🔍 [PolicyHistory] Adding child: ${child.policy_number}`);
      completeHierarchy.push({
        policy: child,
        relationship: 'CHILD',
        transition_type: child.transition_type,
        position: 'CHILD',
        generation: -1
      });
    });
    
    console.log(`🔍 [PolicyHistory] Final hierarchy:`, completeHierarchy.map(item => ({
      policyNumber: item.policy.policy_number,
      relationship: item.relationship,
      generation: item.generation,
      hasCompany: !!item.policy.company,
      hasPolicyName: !!item.policy.policyName
    })));
    
    // Add parent policy to history if exists (for backward compatibility)
    if (policy.parent_policy) {
      transitionHistory.push({
        policy: policy.parent_policy,
        relationship: 'PARENT',
        transition_type: policy.transition_type
      });
    }
    
    // Add child policies to history (for backward compatibility)
    policy.children_policies.forEach(child => {
      transitionHistory.push({
        policy: child,
        relationship: 'CHILD',
        transition_type: child.transition_type
      });
    });
    
    // Enrich with claimsByYear per hierarchy item (best-effort)
    for (let i = 0; i < completeHierarchy.length; i++) {
      const item: any = completeHierarchy[i];
      try {
        item.claimsByYear = await this.buildClaimsByYear(item.policy);
      } catch (e) {
        console.warn('Failed to build claimsByYear for policy', item?.policy?.id, e);
      }
    }

    return {
      parentPolicy: policy.parent_policy,
      childrenPolicies: policy.children_policies,
      transitionHistory: transitionHistory.sort((a, b) => {
        const dateA = a.policy.created_at ? new Date(a.policy.created_at).getTime() : 0;
        const dateB = b.policy.created_at ? new Date(b.policy.created_at).getTime() : 0;
        return dateB - dateA;
      }),
      completeHierarchy: completeHierarchy
    };
  }
  
  static async validateTransitionEligibility(
    parentPolicyId: string,
    transitionType: PolicyTransitionType
  ): Promise<{
    eligible: boolean;
    reasons: string[];
    requirements: string[];
  }> {
    
    const policy = await prisma.policy.findUnique({
      where: { id: parentPolicyId },
      include: {
        documents: true,
        members: true,
        proposer: true
      }
    });
    
    if (!policy) {
      return {
        eligible: false,
        reasons: ['Policy not found'],
        requirements: []
      };
    }
    
    // All policies are eligible for transitions (no restrictions)
    return {
      eligible: true,
      reasons: [],
      requirements: []
    };
  }

  /**
   * Delete a document reference (remove link to ancestor document)
   */
  static async deleteDocumentReference(referenceId: string): Promise<boolean> {
    try {
      // Check if reference exists
      const reference = await prisma.policyDocumentReference.findUnique({
        where: { id: referenceId },
        include: {
          source_document: true,
          policy: true
        }
      });

      if (!reference) {
        throw new Error('Document reference not found');
      }

      // Allow deletion regardless of can_delete flag for now
      // This ensures existing references can be removed
      console.log(`🗑️ [DocumentReference] Deleting reference ${referenceId} (can_delete: ${reference.can_delete})`);

      // Delete the reference
      await prisma.policyDocumentReference.delete({
        where: { id: referenceId }
      });

      // Clear cache for the policy
      DocumentAccessService.clearCache(reference.policy_id);

      console.log(`✅ [DocumentReference] Successfully deleted reference ${referenceId} for policy ${reference.policy_id}`);
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`❌ [DocumentReference] Failed to delete reference ${referenceId}:`, errorMessage);
      throw new Error(`Failed to delete document reference: ${errorMessage}`);
    }
  }

  /**
   * Update existing document references to make them deletable
   * This is a one-time migration function for existing references
   */
  static async updateExistingReferencesToDeletable(): Promise<{ updated: number }> {
    try {
      const result = await prisma.policyDocumentReference.updateMany({
        where: {
          can_delete: false
        },
        data: {
          can_delete: true
        }
      });

      console.log(`🔄 [DocumentReference] Updated ${result.count} existing references to be deletable`);
      return { updated: result.count };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`❌ [DocumentReference] Failed to update existing references:`, errorMessage);
      throw new Error(`Failed to update existing references: ${errorMessage}`);
    }
  }

  /**
   * Get document transfer statistics for a policy transition
   */
  static async getDocumentTransferStats(
    parentPolicyId: string,
    transitionType: PolicyTransitionType
  ): Promise<{
    totalDocuments: number;
    ancestorPolicies: Array<{
      policyId: string;
      policyNumber: string;
      documentCount: number;
      policyDocuments: number;
      proposerDocuments: number;
      memberDocuments: number;
    }>;
    documentBreakdown: {
      policyDocuments: number;
      proposerDocuments: number;
      memberDocuments: number;
    };
  }> {
    
    console.log(`📊 [DocumentStats] Getting transfer statistics for policy ${parentPolicyId}`);
    
    // Get all ancestor policies recursively
    const ancestorPolicies = await this.getAllAncestorPolicies(parentPolicyId);
    
    const stats = {
      totalDocuments: 0,
      ancestorPolicies: [] as Array<{
        policyId: string;
        policyNumber: string;
        documentCount: number;
        policyDocuments: number;
        proposerDocuments: number;
        memberDocuments: number;
      }>,
      documentBreakdown: {
        policyDocuments: 0,
        proposerDocuments: 0,
        memberDocuments: 0
      }
    };
    
    for (const ancestorPolicy of ancestorPolicies) {
      let policyDocs = 0;
      let proposerDocs = 0;
      let memberDocs = 0;
      
      // Count policy documents
      if (ancestorPolicy.documents) {
        policyDocs = ancestorPolicy.documents.length;
        stats.documentBreakdown.policyDocuments += policyDocs;
      }
      
      // Count proposer documents
      if (ancestorPolicy.proposer?.documents) {
        proposerDocs = ancestorPolicy.proposer.documents.length;
        stats.documentBreakdown.proposerDocuments += proposerDocs;
      }
      
      // Count member documents
      if (ancestorPolicy.proposer?.insured_members) {
        ancestorPolicy.proposer.insured_members.forEach((member: any) => {
          if (member.documents) {
            memberDocs += member.documents.length;
          }
        });
        stats.documentBreakdown.memberDocuments += memberDocs;
      }
      
      const totalDocs = policyDocs + proposerDocs + memberDocs;
      stats.totalDocuments += totalDocs;
      
      stats.ancestorPolicies.push({
        policyId: ancestorPolicy.id,
        policyNumber: ancestorPolicy.policy_number || 'Unknown',
        documentCount: totalDocs,
        policyDocuments: policyDocs,
        proposerDocuments: proposerDocs,
        memberDocuments: memberDocs
      });
    }
    
    console.log(`📊 [DocumentStats] Statistics:`, {
      totalDocuments: stats.totalDocuments,
      ancestorCount: stats.ancestorPolicies.length,
      breakdown: stats.documentBreakdown
    });
    
    return stats;
  }
} 