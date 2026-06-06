import { Prisma } from '@prisma/client';
import prisma from '../utils/prismaClient';
import { referenceCache } from '../utils/referenceCache';

// Optimized include block - use select where possible for better performance
// Reduced nested includes to improve query performance
export const POLICY_FULL_INCLUDE = {
  company: {
    select: {
      id: true,
      name: true,
      category: true,
    },
  },
  type: { select: { name: true } },
  policyName: {
    select: {
      id: true,
      name: true,
      description: true,
    },
  },
  policyGroup: {
    select: {
      id: true,
      name: true,
    },
  },
  proposer: {
    select: {
      id: true,
      full_name: true,
      mobile: true,
      email: true,
      date_of_birth: true,
      gender: true,
      marital_status: true,
      alternate_mobile: true,
      address: true,
      kyc_id: true,
      occupation: true,
      nationality: true,
      proposer_salutation: true,
      documents: {
        select: {
          id: true,
          file_name: true,
          original_name: true,
          file_type: true,
          relative_path: true,
          category: true,
        },
      },
      insured_members: {
        select: {
          id: true,
          name: true,
          date_of_birth: true,
          gender: true,
          relation_to_proposer: true,
          insured_member_salutation: true,
          documents: {
            select: {
              id: true,
              file_name: true,
              original_name: true,
              file_type: true,
              relative_path: true,
            },
          },
        },
        orderBy: { created_at: 'asc' },
      },
    },
  },
  nominee_payment: {
    select: {
      id: true,
      nominee_name: true,
      nominee_salutation: true,
      nominee_relation: true,
      nominee_dob: true,
      payment_mode: true,
      payment_reference: true,
      bank_name: true,
      bank_account_number: true,
      bank_ifsc_code: true,
      bank_branch_name: true,
    },
  },
  form_values: {
    select: {
      id: true,
      field_name: true,
      value: true,
    },
  },
  revenues: {
    select: {
      id: true,
      amount: true,
      receivable: true,
      receivedInBank: true,
      createdAt: true,
    },
  },
  receipts: {
    select: {
      id: true,
      policy_number: true,
      remark: true,
      created_at: true,
    },
  },
  reminders: {
    select: {
      id: true,
      remind_on: true,
      type: true,
      status: true,
    },
  },
  documents: {
    select: {
      id: true,
      file_name: true,
      original_name: true,
      relative_path: true,
      file_type: true,
      category: true,
      uploaded_at: true,
    },
  },
} as const;

// Lightweight include for list views - only essential fields for display
export const POLICY_LIST_INCLUDE = {
  company: {
    select: {
      id: true,
      name: true,
    },
  },
  type: { select: { name: true } },
  policyName: {
    select: {
      id: true,
      name: true,
    },
  },
  policyGroup: {
    select: {
      id: true,
      name: true,
    },
  },
  proposer: {
    select: {
      id: true,
      full_name: true,
      mobile: true,
    },
  },
} as const;

// Removed hardcoded COMPANY_NAME_TO_ID mapping - will use Prisma lookup instead

// Removed hardcoded POLICY_NAME_TO_ID mapping - will use Prisma lookup instead

export const policyRepository = {
  // Create a new policy with all nested relations and documents (legacy method)
  async createPolicy(data: Prisma.PolicyCreateInput) {
    // Debug: log the full data object before mapping
    // console.log('Raw data before company mapping:', JSON.stringify(data, null, 2));
    // --- Company mapping logic ---
    let companyName = (data as any).company_name || (data as any).company;
    if (companyName && !(data as any).company_id) {
      // Use cache for fast company lookup
      try {
        const existingCompany = await referenceCache.getCompanyByName(companyName);
        if (existingCompany) {
          (data as any).company_id = existingCompany.id;
          console.log('Mapping company name:', companyName, 'to company_id:', (data as any).company_id);
        } else {
          console.warn('Company not found:', companyName);
          delete (data as any).company_name;
          delete (data as any).company;
        }
      } catch (error) {
        console.warn('Error finding company:', error);
        delete (data as any).company_name;
        delete (data as any).company;
      }
    }
    if ((data as any).company_id) {
      (data as any).company = { connect: { id: (data as any).company_id } };
      delete (data as any).company_id;
    } else if (!(data as any).company) {
      // Make company optional - don't throw error
      console.warn('No company provided for policy creation');
    }

    // --- PolicyName mapping logic ---
    let policyName = (data as any).policy_name_name || (data as any).policy_name;
    if (policyName && !(data as any).policy_name_id) {
      console.log(`🔍 Looking for policy name: "${policyName}"`);
      console.log(`🔍 Company ID: ${(data as any).company_id}, Policy Group ID: ${(data as any).policy_group_id}`);
      
      // Use Prisma to find existing policy name by name instead of hardcoded mapping
      try {
        // First try to find with company and policy group (as per seeded data structure)
        let existingPolicyName = null;
        if ((data as any).company_id && (data as any).policy_group_id) {
          console.log(`🔍 Searching with company and policy group constraints`);
          existingPolicyName = await prisma.policyName.findFirst({
            where: { 
              name: policyName,
              company_id: (data as any).company_id,
              policy_group_id: (data as any).policy_group_id
            }
          });
        }
        
        // If not found, try just by name
        if (!existingPolicyName) {
          console.log(`🔍 Searching by name only`);
          existingPolicyName = await prisma.policyName.findFirst({
            where: { name: policyName }
          });
        }
        
        if (existingPolicyName) {
          (data as any).policy_name_id = existingPolicyName.id;
          console.log('✅ Mapping policy name:', policyName, 'to policy_name_id:', (data as any).policy_name_id);
        } else {
          console.warn('❌ Policy name not found:', policyName);
          delete (data as any).policy_name_name;
          delete (data as any).policy_name;
        }
      } catch (error) {
        console.warn('❌ Error finding policy name:', error);
        delete (data as any).policy_name_name;
        delete (data as any).policy_name;
      }
    }
    if ((data as any).policy_name_id) {
      (data as any).policyName = { connect: { id: (data as any).policy_name_id } };
      delete (data as any).policy_name_id;
    } else if (!(data as any).policyName) {
      // Make policy name optional - don't throw error
      console.warn('No policy name provided for policy creation');
    }
    // --- End PolicyName mapping logic ---

    // --- PolicyType mapping logic ---
    if ((data as any).policy_type_id) {
      (data as any).type = { connect: { id: (data as any).policy_type_id } };
      delete (data as any).policy_type_id;
    } else if ((data as any).policy_type_name && typeof (data as any).policy_type_name === 'string') {
      // Use cache for fast policy type lookup
      try {
        const existingType = await referenceCache.getPolicyTypeByName((data as any).policy_type_name);
        if (existingType) {
          (data as any).type = { connect: { id: existingType.id } };
        } else {
          console.warn('Policy type not found:', (data as any).policy_type_name);
          delete (data as any).policy_type_name;
        }
      } catch (error) {
        console.warn('Error finding policy type:', error);
        delete (data as any).policy_type_name;
      }
    } else if ((data as any).type && typeof (data as any).type === 'string') {
      // Use cache for fast policy type lookup
      try {
        const existingType = await referenceCache.getPolicyTypeByName((data as any).type);
        if (existingType) {
          (data as any).type = { connect: { id: existingType.id } };
        } else {
          console.warn('Policy type not found:', (data as any).type);
          delete (data as any).type;
        }
      } catch (error) {
        console.warn('Error finding policy type:', error);
        delete (data as any).type;
      }
    } else if (!(data as any).type) {
      // Make policy type optional - don't throw error
      console.warn('No policy type provided for policy creation');
    }
    // --- End PolicyType mapping logic ---

    // --- PolicyGroup mapping logic ---
    let policyGroupName = (data as any).policy_group_name || (data as any).policy_group;
    if (policyGroupName && !(data as any).policy_group_id) {
      // Normalize policy group name to match database (uppercase)
      const normalizedGroupName = policyGroupName.toUpperCase();
      
      // Use cache for fast policy group lookup
      try {
        const existingPolicyGroup = await referenceCache.getPolicyGroupByName(normalizedGroupName);
        if (existingPolicyGroup) {
          (data as any).policy_group_id = existingPolicyGroup.id;
          console.log('Mapping policy group name:', policyGroupName, 'to policy_group_id:', (data as any).policy_group_id);
        } else {
          console.warn('Policy group not found:', normalizedGroupName);
          delete (data as any).policy_group_name;
          delete (data as any).policy_group;
        }
      } catch (error) {
        console.warn('Error finding policy group:', error);
        delete (data as any).policy_group_name;
        delete (data as any).policy_group;
      }
    }
    if ((data as any).policy_group_id) {
      (data as any).policyGroup = { connect: { id: (data as any).policy_group_id } };
      delete (data as any).policy_group_id;
    } else if (!(data as any).policyGroup) {
      // Make policy group optional - don't throw error
      console.warn('No policy group provided for policy creation');
    }
    // --- End PolicyGroup mapping logic ---

    // Helper to convert legacy field names before usage
    function convertDocumentFields(doc: any) {
      if (doc.file_url && !doc.relative_path) {
        doc.relative_path = doc.file_url;
        delete doc.file_url;
      }
      return doc;
    }

    // Fix proposer documents for nested create
    if ((data as any).proposer && (data as any).proposer.create) {
      if (Array.isArray((data as any).proposer.create.documents?.create)) {
        (data as any).proposer.create.documents.create = (data as any).proposer.create.documents.create.map((doc: any) => convertDocumentFields({
          ...doc,
          category: 'PROPOSER_DOCUMENT',
        }));
      }
    }

    // Fix nominee_payment for nested create
    if ((data as any).nominee_payment) {
      (data as any).nominee_payment = { create: (data as any).nominee_payment };
    }

    // Fix members for nested create - they will be created directly under policy
    // and Prisma will automatically set the policy_id
    if ((data as any).members && (data as any).members.create && Array.isArray((data as any).members.create)) {
      (data as any).members.create = (data as any).members.create.map((member: any) => {
        if (member.documents?.create && Array.isArray(member.documents.create)) {
          member.documents.create = member.documents.create.map((doc: any) => convertDocumentFields({
            ...doc,
            category: 'INSURED_MEMBER_DOCUMENT'
          }));
        }
        return member;
      });
    }

    // Fix main policy documents for nested create
    if ((data as any).documents && (data as any).documents.create && Array.isArray((data as any).documents.create)) {
      (data as any).documents.create = (data as any).documents.create.map(convertDocumentFields);
      console.log('Keeping documents as prepared by service layer with categories:', (data as any).documents.create.map((d: any) => d.category));
    } else if (Array.isArray((data as any).documents)) {
      // Legacy format - convert to nested create with POLICY_DOCUMENT category
      (data as any).documents = { create: (data as any).documents.map((doc: any) => convertDocumentFields({ ...doc, category: 'POLICY_DOCUMENT' })) };
    }

    console.log('Creating policy with final data structure:', JSON.stringify(data, null, 2));
    
    // Create the policy with all nested relations
    const result = await prisma.policy.create({
      data,
      include: POLICY_FULL_INCLUDE,
    });

    console.log('Policy created successfully with nested relations');
    return result;
  },



  // async bulkCreatePolicy(data: Prisma.PolicyCreateInput) {
  //   // Basic validation
  //   if (!data.policy_number) {
  //     throw new Error('Policy number is required');
  //   }
  //   if (!data.customer_name) {
  //     throw new Error('Customer name is required');
  //   }
  //   if (data.proposer?.create?.insured_members?.create) {
  //     const members = Array.isArray(data.proposer.create.insured_members.create) 
  //       ? data.proposer.create.insured_members.create 
  //       : [data.proposer.create.insured_members.create];
  //     const invalidMembers = members.filter(
  //       (member: any) => !member.name || !member.relation_to_proposer || member.relation_to_proposer === 'false' || !member.date_of_birth
  //     );
  //     if (invalidMembers.length > 0) {
  //       throw new Error(`Invalid insured members detected: ${JSON.stringify(invalidMembers)}`);
  //     }
  //   }

  //   // --- Company mapping logic ---
  //   let companyName = (data as any).company_name || (data as any).company;
  //   if (companyName && !(data as any).company_id) {
  //     // Use Prisma to find existing company by name instead of hardcoded mapping
  //     try {
  //       const existingCompany = await prisma.company.findFirst({
  //         where: { name: companyName }
  //       });
  //       if (existingCompany) {
  //         (data as any).company_id = existingCompany.id;
  //         console.log('Mapping company name:', companyName, 'to company_id:', (data as any).company_id);
  //       } else {
  //         console.warn('Company not found:', companyName);
  //         delete (data as any).company_name;
  //         delete (data as any).company;
  //       }
  //     } catch (error) {
  //       console.warn('Error finding company:', error);
  //       delete (data as any).company_name;
  //       delete (data as any).company;
  //     }
  //   }
  //   if ((data as any).company_id) {
  //     (data as any).company = { connect: { id: (data as any).company_id } };
  //     delete (data as any).company_id;
  //   } else if (!(data as any).company) {
  //     // Make company optional - don't throw error
  //     console.warn('No company provided for policy creation');
  //   }
  //   // --- End Company mapping logic ---

  //   // --- PolicyName mapping logic ---
  //   let policyName = (data as any).policy_name_name || (data as any).policy_name;
  //   if (policyName && !(data as any).policy_name_id) {
  //     console.log(`🔍 Looking for policy name: "${policyName}"`);
  //     console.log(`🔍 Company ID: ${(data as any).company_id}, Policy Group ID: ${(data as any).policy_group_id}`);
      
  //     // Use Prisma to find existing policy name by name instead of hardcoded mapping
  //     try {
  //       // First try to find with company and policy group (as per seeded data structure)
  //       let existingPolicyName = null;
  //       if ((data as any).company_id && (data as any).policy_group_id) {
  //         console.log(`🔍 Searching with company and policy group constraints`);
  //         existingPolicyName = await prisma.policyName.findFirst({
  //           where: { 
  //             name: policyName,
  //             company_id: (data as any).company_id,
  //             policy_group_id: (data as any).policy_group_id
  //           }
  //         });
  //       }
        
  //       // If not found, try just by name
  //       if (!existingPolicyName) {
  //         console.log(`🔍 Searching by name only`);
  //         existingPolicyName = await prisma.policyName.findFirst({
  //           where: { name: policyName }
  //         });
  //       }
        
  //       if (existingPolicyName) {
  //         (data as any).policy_name_id = existingPolicyName.id;
  //         console.log('✅ Mapping policy name:', policyName, 'to policy_name_id:', (data as any).policy_name_id);
  //       } else {
  //         console.warn('❌ Policy name not found:', policyName);
  //         delete (data as any).policy_name_name;
  //         delete (data as any).policy_name;
  //       }
  //     } catch (error) {
  //       console.warn('❌ Error finding policy name:', error);
  //       delete (data as any).policy_name_name;
  //       delete (data as any).policy_name;
  //     }
  //   }
  //   if ((data as any).policy_name_id) {
  //     (data as any).policyName = { connect: { id: (data as any).policy_name_id } };
  //     delete (data as any).policy_name_id;
  //   } else if (!(data as any).policyName) {
  //     // Make policy name optional - don't throw error
  //     console.warn('No policy name provided for policy creation');
  //   }
  //   // --- End PolicyName mapping logic ---

  //   // --- PolicyType mapping logic ---
  //   if ((data as any).policy_type_id) {
  //     (data as any).type = { connect: { id: (data as any).policy_type_id } };
  //     delete (data as any).policy_type_id;
  //   } else if ((data as any).policy_type_name && typeof (data as any).policy_type_name === 'string') {
  //     // Try to find existing policy type by name instead of hardcoded mapping
  //     try {
  //       const existingType = await prisma.policyType.findFirst({
  //         where: { name: (data as any).policy_type_name }
  //       });
  //       if (existingType) {
  //         (data as any).type = { connect: { id: existingType.id } };
  //       } else {
  //         console.warn('Policy type not found:', (data as any).policy_type_name);
  //         delete (data as any).policy_type_name;
  //       }
  //     } catch (error) {
  //       console.warn('Error finding policy type:', error);
  //       delete (data as any).policy_type_name;
  //     }
  //   } else if ((data as any).type && typeof (data as any).type === 'string') {
  //     // Try to find existing policy type by name instead of hardcoded mapping
  //     try {
  //       const existingType = await prisma.policyType.findFirst({
  //         where: { name: (data as any).type }
  //       });
  //       if (existingType) {
  //         (data as any).type = { connect: { id: existingType.id } };
  //       } else {
  //         console.warn('Policy type not found:', (data as any).type);
  //         delete (data as any).type;
  //       }
  //     } catch (error) {
  //       console.warn('Error finding policy type:', error);
  //       delete (data as any).type;
  //     }
  //   } else if (!(data as any).type) {
  //     // Make policy type optional - don't throw error
  //     console.warn('No policy type provided for policy creation');
  //   }
  //   // --- End PolicyType mapping logic ---

  //   // --- PolicyGroup mapping logic ---
  //   let policyGroupName = (data as any).policy_group_name || (data as any).policy_group;
  //   if (policyGroupName && !(data as any).policy_group_id) {
  //     // Normalize policy group name to match database (uppercase)
  //     const normalizedGroupName = policyGroupName.toUpperCase();
      
  //     // Use Prisma to find existing policy group by name
  //     try {
  //       const existingPolicyGroup = await prisma.policyGroup.findFirst({
  //         where: { name: normalizedGroupName }
  //       });
  //       if (existingPolicyGroup) {
  //         (data as any).policy_group_id = existingPolicyGroup.id;
  //         console.log('Mapping policy group name:', policyGroupName, 'to policy_group_id:', (data as any).policy_group_id);
  //       } else {
  //         console.warn('Policy group not found:', normalizedGroupName);
  //         delete (data as any).policy_group_name;
  //         delete (data as any).policy_group;
  //       }
  //     } catch (error) {
  //       console.warn('Error finding policy group:', error);
  //       delete (data as any).policy_group_name;
  //       delete (data as any).policy_group;
  //     }
  //   }
  //   if ((data as any).policy_group_id) {
  //     (data as any).policyGroup = { connect: { id: (data as any).policy_group_id } };
  //     delete (data as any).policy_group_id;
  //   } else if (!(data as any).policyGroup) {
  //     // Make policy group optional - don't throw error
  //     console.warn('No policy group provided for policy creation');
  //   }
  //   // --- End PolicyGroup mapping logic ---

  //   // Clean up any remaining string fields that don't belong in the Policy model
  //   delete (data as any).company_name;
  //   delete (data as any).policy_name_name;
  //   delete (data as any).policy_type_name;
  //   delete (data as any).policy_group_name;
  
  //   // Helper to convert legacy field names before usage
  //   function convertDocumentFields(doc: any) {
  //     if (doc.file_url && !doc.relative_path) {
  //       doc.relative_path = doc.file_url;
  //       delete doc.file_url;
  //     }
  //     return doc;
  //   }
  
  //   // Fix proposer documents for nested create
  //   if (data.proposer?.create) {
  //     if (Array.isArray(data.proposer.create.documents?.create)) {
  //       data.proposer.create.documents.create = data.proposer.create.documents.create.map((doc: any) =>
  //         convertDocumentFields({
  //           ...doc,
  //           category: 'PROPOSER_DOCUMENT',
  //         })
  //       );
  //     }
  //     // Sanitize insured_members
  //     if (data.proposer.create.insured_members?.create) {
  //       const members = Array.isArray(data.proposer.create.insured_members.create) 
  //         ? data.proposer.create.insured_members.create 
  //         : [data.proposer.create.insured_members.create];
  //       data.proposer.create.insured_members.create = members.map((member: any) => ({
  //         ...member,
  //         pre_existing: Boolean(member.pre_existing),
  //         insured_member_medical_condition: Boolean(member.insured_member_medical_condition),
  //         insured_member_medical_remarks: member.insured_member_medical_remarks === 'false' ? undefined : member.insured_member_medical_remarks,
  //       }));
  //     }
  //   }
  
  //   // Fix nominee_payment for nested create
  //   if (data.nominee_payment?.create) {
  //     if (data.nominee_payment.create.payment_mode === 'false' || !data.nominee_payment.create.payment_mode) {
  //       delete data.nominee_payment;
  //     } else {
  //       data.nominee_payment.create = {
  //         payment_mode: data.nominee_payment.create.payment_mode,
  //         nominee_name: data.nominee_payment.create.nominee_name || undefined,
  //         nominee_relation: data.nominee_payment.create.nominee_relation || undefined,
  //         nominee_dob: data.nominee_payment.create.nominee_dob || undefined,
  //       };
  //     }
  //   }
  
  //   // Fix members for nested create
  //   if (data.members?.create && Array.isArray(data.members.create)) {
  //     data.members.create = data.members.create.map((member: any) => {
  //       if (member.documents?.create && Array.isArray(member.documents.create)) {
  //         member.documents.create = member.documents.create.map((doc: any) =>
  //           convertDocumentFields({
  //             ...doc,
  //             category: 'INSURED_MEMBER_DOCUMENT',
  //           })
  //         );
  //       }
  //       return {
  //         ...member,
  //         pre_existing: Boolean(member.pre_existing),
  //         insured_member_medical_condition: Boolean(member.insured_member_medical_condition),
  //         insured_member_medical_remarks: member.insured_member_medical_remarks === 'false' ? undefined : member.insured_member_medical_remarks,
  //       };
  //     });
  //   }
  
  //   // Fix main policy documents for nested create
  //   if (data.documents?.create && Array.isArray(data.documents.create)) {
  //     data.documents.create = data.documents.create.map(convertDocumentFields);
  //     console.log('Keeping documents as prepared by service layer with categories:', data.documents.create.map((d: any) => d.category));
  //   } else if (Array.isArray(data.documents)) {
  //     data.documents = {
  //       create: data.documents.map((doc: any) => convertDocumentFields({ ...doc, category: 'POLICY_DOCUMENT' })),
  //     };
  //   }
  
  //   console.log('Creating policy with final data structure:', JSON.stringify(data, null, 2));
  
  //   try {
  //     const result = await prisma.policy.create({
  //       data,
  //       include: POLICY_FULL_INCLUDE,
  //     });
  //     console.log('Policy created successfully with nested relations');
  //     return result;
  //   } catch (error) {
  //     console.error('Prisma error creating policy:', error);
  //     throw new Error(`Failed to create policy: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
  //   }
  // },


  async bulkCreatePolicy(data: Prisma.PolicyCreateInput) {
    let insuredMembersToCreate: any[] = [];
   
    console.log('🚀 [REPOSITORY] Bulk create policy data:', {
      policy_number: data.policy_number,
      customer_name: data.customer_name,
      policy_salutation: (data as any).policy_salutation,
      nominee_payment: (data as any).nominee_payment,
      proposer: (data as any).proposer
    });
   
    // Basic validation
    if (!data.policy_number) {
      throw new Error('Policy number is required');
    }
    if (!data.customer_name) {
      throw new Error('Customer name is required');
    }
   
    // Extract and validate insured_members (from proposer.create)
    if (data.proposer?.create?.insured_members?.create) {
      const members = Array.isArray(data.proposer.create.insured_members.create) 
        ? data.proposer.create.insured_members.create 
        : [data.proposer.create.insured_members.create];
   
      const invalidMembers = members.filter(
        (member: any) =>
          !member.name ||
          !member.relation_to_proposer ||
          member.relation_to_proposer === 'false' ||
          !member.date_of_birth
      );
      if (invalidMembers.length > 0) {
        throw new Error(`Invalid insured members detected: ${JSON.stringify(invalidMembers)}`);
      }
   
      insuredMembersToCreate = members.map((member: any) => ({
        ...member,
        pre_existing: Boolean(member.pre_existing),
        insured_member_medical_condition: Boolean(member.insured_member_medical_condition),
        insured_member_medical_remarks:
          member.insured_member_medical_remarks === 'false' ? undefined : member.insured_member_medical_remarks,
      }));
   
      // Remove from nested proposer.create to avoid constraint error
      delete data.proposer.create.insured_members;
    }
   
    // --- Company Mapping ---
    let companyName = (data as any).company_name || (data as any).company;
    if (companyName && !(data as any).company_id) {
      try {
        const existingCompany = await referenceCache.getCompanyByName(companyName);
        if (existingCompany) {
          (data as any).company_id = existingCompany.id;
          console.log('Mapping company:', companyName, '→', existingCompany.id);
        } else {
          console.warn('Company not found:', companyName);
          delete (data as any).company_name;
          delete (data as any).company;
        }
      } catch (error) {
        console.warn('Error finding company:', error);
      }
    }
    if ((data as any).company_id) {
      (data as any).company = { connect: { id: (data as any).company_id } };
      delete (data as any).company_id;
    }
   
    // --- Policy Name Mapping ---
    let policyName = (data as any).policy_name_name || (data as any).policy_name;
    if (policyName && !(data as any).policy_name_id) {
      try {
        let existingPolicyName = null;
        if ((data as any).company_id && (data as any).policy_group_id) {
          existingPolicyName = await prisma.policyName.findFirst({
            where: {
              name: policyName,
              company_id: (data as any).company_id,
              policy_group_id: (data as any).policy_group_id,
            },
          });
        }
        if (!existingPolicyName) {
          existingPolicyName = await prisma.policyName.findFirst({ where: { name: policyName } });
        }
        if (existingPolicyName) {
          (data as any).policy_name_id = existingPolicyName.id;
        } else {
          console.warn('Policy name not found:', policyName);
        }
      } catch (error) {
        console.warn('Error finding policy name:', error);
      }
    }
    if ((data as any).policy_name_id) {
      (data as any).policyName = { connect: { id: (data as any).policy_name_id } };
      delete (data as any).policy_name_id;
    }
   
    // --- Policy Type Mapping ---
    if ((data as any).policy_type_id) {
      (data as any).type = { connect: { id: (data as any).policy_type_id } };
      delete (data as any).policy_type_id;
    } else if ((data as any).policy_type_name) {
      try {
        const existingType = await referenceCache.getPolicyTypeByName((data as any).policy_type_name);
        if (existingType) {
          (data as any).type = { connect: { id: existingType.id } };
        }
      } catch (error) {
        console.warn('Error finding policy type:', error);
      }
      delete (data as any).policy_type_name;
    }
   
    // --- Policy Group Mapping ---
    let policyGroupName = (data as any).policy_group_name || (data as any).policy_group;
    if (policyGroupName && !(data as any).policy_group_id) {
      try {
        const existingGroup = await referenceCache.getPolicyGroupByName(policyGroupName.toUpperCase());
        if (existingGroup) {
          (data as any).policy_group_id = existingGroup.id;
        }
      } catch (error) {
        console.warn('Error finding policy group:', error);
      }
    }
    if ((data as any).policy_group_id) {
      (data as any).policyGroup = { connect: { id: (data as any).policy_group_id } };
      delete (data as any).policy_group_id;
    }
   
    // --- Document Conversion ---
    function convertDocumentFields(doc: any) {
      if (doc.file_url && !doc.relative_path) {
        doc.relative_path = doc.file_url;
        delete doc.file_url;
      }
      return doc;
    }
  
    // Proposer Documents
    if (data.proposer?.create?.documents?.create) {
      const docs = Array.isArray(data.proposer.create.documents.create) 
        ? data.proposer.create.documents.create 
        : [data.proposer.create.documents.create];
      data.proposer.create.documents.create = docs.map((doc: any) =>
        convertDocumentFields({ ...doc, category: 'PROPOSER_DOCUMENT' }),
      );
    }
   
    // Nominee Fix
    if (data.nominee_payment?.create) {
      if (
        data.nominee_payment.create.payment_mode === 'false' ||
        !data.nominee_payment.create.payment_mode
      ) {
        delete data.nominee_payment;
      } else {
        data.nominee_payment.create = {
          payment_mode: data.nominee_payment.create.payment_mode,
          nominee_name: data.nominee_payment.create.nominee_name || undefined,
          nominee_salutation: data.nominee_payment.create.nominee_salutation || undefined,
          nominee_relation: data.nominee_payment.create.nominee_relation || undefined,
          nominee_dob: data.nominee_payment.create.nominee_dob || undefined,
          payment_reference: data.nominee_payment.create.payment_reference || undefined,
          bank_name: data.nominee_payment.create.bank_name || undefined,
          bank_account_number: data.nominee_payment.create.bank_account_number || undefined,
          bank_ifsc_code: data.nominee_payment.create.bank_ifsc_code || undefined,
          bank_branch_name: data.nominee_payment.create.bank_branch_name || undefined,
        };
      }
    }
  
    // Main Policy Documents
    if (data.documents?.create && Array.isArray(data.documents.create)) {
      data.documents.create = data.documents.create.map(convertDocumentFields);
    } else if (Array.isArray(data.documents)) {
      data.documents = {
        create: data.documents.map((doc: any) =>
          convertDocumentFields({ ...doc, category: 'POLICY_DOCUMENT' }),
        ),
      };
    }
   
    // Clean up string fields that don't belong in Prisma Policy model
    delete (data as any).company_name;
    delete (data as any).policy_type_name;
    delete (data as any).policy_name_name;
    delete (data as any).policy_group_name;

    console.log('🚀 Creating policy with data:', JSON.stringify(data, null, 2));
    console.log('🚀 [REPOSITORY] Commission amount in data:', data.calculated_commission_amount);

    // const createPolicyData = {data.company_name, ...data}
  
    try {
      const result = await prisma.policy.create({
        data,
        include: POLICY_FULL_INCLUDE,
      });
   
      // Create insured members separately
      if (insuredMembersToCreate.length > 0) {
        const proposerId = result.proposer?.id;
        const policyId = result.id;
   
        if (!proposerId || !policyId) {
          throw new Error('Missing proposer or policy ID to create insured members');
        }
   
        await prisma.insuredMember.createMany({
          data: insuredMembersToCreate.map((member) => ({
            ...member,
            proposer_id: proposerId,
            policy_id: policyId,
          })),
        });
   
        console.log(`✅ Created ${insuredMembersToCreate.length} insured members`);
      }
   
      return result;
    } catch (error) {
      console.error('❌ Prisma error creating policy:', error);
      throw new Error(`Failed to create policy: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    }
  },
  // Get all policies with filters, pagination, and nested includes
  async getAllPolicies(where: Prisma.PolicyWhereInput, skip: number, take: number) {
    // Fix: If where.type is a string, convert to relation filter
    const processedWhere: Prisma.PolicyWhereInput = { ...where };
    if (processedWhere.type && typeof processedWhere.type === 'string') {
      processedWhere.type = { name: processedWhere.type };
    }
    // Remove old status/date-based logic
    // Filtering by policy_creation_status is handled by the where object

    // Optimized: Use select instead of include for better performance on list views
    const optimizedInclude = {
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      type: { select: { name: true } },
      policyName: {
        select: {
          id: true,
          name: true,
        },
      },
      policyGroup: {
        select: {
          id: true,
          name: true,
        },
      },
      proposer: {
        select: {
          id: true,
          full_name: true,
          mobile: true,
        },
      },
    } as const;

    const [data, total] = await Promise.all([
      prisma.policy.findMany({
        where: processedWhere,
        orderBy: { created_at: 'desc' },
        skip,
        take,
        include: optimizedInclude,
      }),
      prisma.policy.count({ where: processedWhere }),
    ]);

    return {
      data,
      total,
      page: Math.floor(skip / take) + 1,
      limit: take,
      pages: Math.ceil(total / take),
    };
  },

  // ULTRA-OPTIMIZED raw SQL policy list for sub-second performance
  async getAllPoliciesRaw(
    search?: string,
    type?: string,
    policy_creation_status?: string,
    policy_group_id?: string,
    from?: string,
    to?: string,
    skip = 0,
    take = 25
  ) {
    const whereClauses: Prisma.Sql[] = [];
    // Leaf policies only (no children) - uses index on parent_policy_id
    whereClauses.push(Prisma.sql`NOT EXISTS (SELECT 1 FROM "policy" child WHERE child."parent_policy_id" = p.id)`);
    // Only show Active (or null status) policies - hides transitioned/INACTIVE parents
    whereClauses.push(Prisma.sql`(p.status = 'Active' OR p.status IS NULL)`);

    if (search) {
      whereClauses.push(Prisma.sql`(
        p."policy_number" ILIKE ${'%' + search + '%'}
        OR p."customer_name" ILIKE ${'%' + search + '%'}
        OR c.name ILIKE ${'%' + search + '%'}
        OR pr.mobile ILIKE ${'%' + search + '%'}
        OR pr.email ILIKE ${'%' + search + '%'}
      )`);
    }

    if (type && type !== 'all') {
      whereClauses.push(Prisma.sql`pt.name = ${type}`);
    }

    if (policy_creation_status && policy_creation_status !== 'all') {
      whereClauses.push(Prisma.sql`p."policy_creation_status" = ${policy_creation_status}`);
    }

    if (policy_group_id && policy_group_id !== 'all') {
      whereClauses.push(Prisma.sql`p."policy_group_id" = ${policy_group_id}`);
    }

    if (from && !isNaN(Date.parse(from))) {
      whereClauses.push(Prisma.sql`p."start_date" >= ${new Date(from)}`);
    }

    if (to && !isNaN(Date.parse(to))) {
      whereClauses.push(Prisma.sql`p."start_date" <= ${new Date(to)}`);
    }

    const whereSql = Prisma.sql`WHERE ${Prisma.join(whereClauses, ' AND ')}`;

    // Run data + count in parallel for maximum speed
    const [dataRows, countRows] = await Promise.all([
      prisma.$queryRaw`
        SELECT
          p.id, p."policy_number", p."customer_name", p."company_id", p."policy_type_id",
          p."policy_name_id", p."policy_group_id", p."created_by", p."created_at",
          p."updated_at", p."premium_amount", p."sum_insured", p."plan_type",
          p."policy_creation_status", p."start_date", p."end_date", p."status",
          p."tenure_years", p."gst_status", p."deductible_amount_status", p."deductible_amount",
          p."calculated_commission_amount",
          c.id as "company.id", c.name as "company.name",
          pt.name as "type.name",
          pn.id as "policyName.id", pn.name as "policyName.name",
          pg.id as "policyGroup.id", pg.name as "policyGroup.name",
          pr.id as "proposer.id", pr.full_name as "proposer.full_name", pr.mobile as "proposer.mobile"
        FROM "policy" p
        LEFT JOIN "company" c ON p."company_id" = c.id
        LEFT JOIN "policy_types" pt ON p."policy_type_id" = pt.id
        LEFT JOIN "policy_names" pn ON p."policy_name_id" = pn.id
        LEFT JOIN "policy_groups" pg ON p."policy_group_id" = pg.id
        LEFT JOIN "proposers" pr ON p.id = pr."policy_id"
        ${whereSql}
        ORDER BY p."created_at" DESC
        LIMIT ${take} OFFSET ${skip}
      `,
      prisma.$queryRaw`
        SELECT COUNT(*)::int as total
        FROM "policy" p
        LEFT JOIN "company" c ON p."company_id" = c.id
        LEFT JOIN "policy_types" pt ON p."policy_type_id" = pt.id
        LEFT JOIN "proposers" pr ON p.id = pr."policy_id"
        ${whereSql}
      `,
    ]) as [any[], any[]];

    // Shape raw rows into Prisma-compatible nested objects
    const data = dataRows.map((row: any) => ({
      id: row.id,
      policy_number: row.policy_number,
      customer_name: row.customer_name,
      company_id: row.company_id,
      policy_type_id: row.policy_type_id,
      policy_name_id: row.policy_name_id,
      policy_group_id: row.policy_group_id,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      premium_amount: row.premium_amount,
      sum_insured: row.sum_insured,
      plan_type: row.plan_type,
      policy_creation_status: row.policy_creation_status,
      start_date: row.start_date,
      end_date: row.end_date,
      status: row.status,
      tenure_years: row.tenure_years,
      gst_status: row.gst_status,
      deductible_amount_status: row.deductible_amount_status,
      deductible_amount: row.deductible_amount,
      calculated_commission_amount: row.calculated_commission_amount,
      company: row['company.id'] ? { id: row['company.id'], name: row['company.name'] } : null,
      type: row['type.name'] ? { name: row['type.name'] } : null,
      policyName: row['policyName.id'] ? { id: row['policyName.id'], name: row['policyName.name'] } : null,
      policyGroup: row['policyGroup.id'] ? { id: row['policyGroup.id'], name: row['policyGroup.name'] } : null,
      proposer: row['proposer.id'] ? { id: row['proposer.id'], full_name: row['proposer.full_name'], mobile: row['proposer.mobile'] } : null,
    }));

    const total = Number(countRows[0]?.total) || 0;

    return {
      data,
      total,
      page: Math.floor(skip / take) + 1,
      limit: take,
      pages: Math.ceil(total / take),
    };
  },

  // Get a single policy by ID with optimized includes
  async getPolicyById(id: string) {
    // Use a more optimized include for single policy fetch
    return prisma.policy.findUnique({
      where: { id },
      include: POLICY_FULL_INCLUDE,
    });
  },

  // Update a policy and all nested relations with robust approach
  async updatePolicy(id: string, data: Prisma.PolicyUpdateInput) {
    console.log('🔄 [REPOSITORY] Starting robust policy update...');
    
    // Extract nested relations that need special handling
    const proposerData = (data as any).proposer;
    // const membersData = (data as any).members;
    const insuredMembersData = (data as any).insured_members;
    const nomineePaymentData = (data as any).nominee_payment;
    const documentsData = (data as any).documents;

    // Remove nested relations from the main data object
    const updateData = { ...data };
    delete (updateData as any).proposer;
    // delete (updateData as any).members;
    delete (updateData as any).insured_members;
    delete (updateData as any).nominee_payment;
    delete (updateData as any).documents;

    // Build the proper Prisma update object
    const prismaUpdateData: Prisma.PolicyUpdateInput = {
      ...updateData,
    };

    // Handle foreign key fields properly
    // Remove fields that should be handled as relations
    delete (prismaUpdateData as any).company_id;
    delete (prismaUpdateData as any).policy_type_id;
    delete (prismaUpdateData as any).policy_name_id;
    delete (prismaUpdateData as any).policy_group_id;

    // Handle company relation
    if ((data as any).company_id) {
      prismaUpdateData.company = {
        connect: { id: (data as any).company_id }
      };
    }

    // Handle policy type relation
    if ((data as any).policy_type_id) {
      prismaUpdateData.type = {
        connect: { id: (data as any).policy_type_id }
      };
    }

    // Handle policy name relation
    if ((data as any).policy_name_id) {
      prismaUpdateData.policyName = {
        connect: { id: (data as any).policy_name_id }
      };
    }

    // Handle policy group relation
    if ((data as any).policy_group_id) {
      prismaUpdateData.policyGroup = {
        connect: { id: (data as any).policy_group_id }
      };
    }

    // Handle proposer update
    if (proposerData) {
      prismaUpdateData.proposer = {
        upsert: {
          create: proposerData,
          update: proposerData,
        },
      };
    }

    // Handle nominee_payment update
    if (nomineePaymentData) {
      prismaUpdateData.nominee_payment = {
        upsert: {
          create: nomineePaymentData,
          update: nomineePaymentData,
        },
      };
    }

    // Handle members update with robust approach
    if (insuredMembersData) {
      const membersToUpdate = insuredMembersData;
      
      if (membersToUpdate && Array.isArray(membersToUpdate)) {
        console.log('📋 [REPOSITORY] Updating members:', membersToUpdate.length);
        
        // Get the proposer ID first
        const existingPolicy = await prisma.policy.findUnique({
          where: { id },
          include: { proposer: true }
        });
        
        if (existingPolicy?.proposer?.id) {
          console.log('🔍 [REPOSITORY] Processing member updates for proposer:', existingPolicy.proposer.id);
          // Update each member
          for (const memberData of membersToUpdate) {
            console.log('🔍 [REPOSITORY] Processing member:', memberData.id ? 'UPDATE' : 'CREATE', memberData);
            if (memberData.id) {
              // Update existing member
              await prisma.insuredMember.update({
                where: { id: memberData.id },
                data: {
                  insured_member_salutation: memberData.insured_member_salutation,
                  name: memberData.name,
                  relation_to_proposer: memberData.relation_to_proposer,
                  date_of_birth: memberData.date_of_birth,
                  gender: memberData.gender,
                  pre_existing: memberData.pre_existing,
                  insured_member_medical_condition: memberData.insured_member_medical_condition,
                  insured_member_medical_remarks: memberData.insured_member_medical_remarks,
                }
              });
            } else {
              // Create new member
              await prisma.insuredMember.create({
                data: {
                  ...memberData,
                  proposer_id: existingPolicy.proposer.id,
                  policy_id: id,
                }
              });
            }
          }
        }
      }
    }

    // Handle documents update
    if (documentsData) {
      // Document linking will be handled by the service layer in Phase 2
      console.log('📋 [REPOSITORY] Document linking will be handled by service layer');
    }

    // Remove memberDocsMeta from prismaUpdateData if present
    if ('memberDocsMeta' in prismaUpdateData) {
      delete prismaUpdateData.memberDocsMeta;
    }

    // Update the main policy - use minimal include to avoid timeout
    // Full data is fetched separately by the service layer via getPolicyById
    const result = await prisma.policy.update({
      where: { id },
      data: prismaUpdateData,
      select: {
        id: true,
        proposer: {
          select: {
            id: true,
            insured_members: { select: { id: true } },
          },
        },
        nominee_payment: { select: { id: true } },
      },
    });

    console.log('✅ [REPOSITORY] Policy updated successfully');
    return result;
  },

  // Delete a policy with all related data including the entire policy chain (parent and children)
  // ULTRA-OPTIMIZED: Two recursive CTEs + deleteMany for everything
  async deletePolicy(id: string) {
    console.log(`🗑️ Starting optimized deletion of policy ${id} and its entire chain`);

    return await prisma.$transaction(async (tx) => {
      // Step 0: Get ALL related policy IDs (ancestors + descendants) using two separate CTEs
      const chainResult = await tx.$queryRaw`
        WITH RECURSIVE descendants AS (
          SELECT id, "parent_policy_id" FROM "policy" WHERE id = ${id}
          UNION
          SELECT p.id, p."parent_policy_id" FROM "policy" p
          INNER JOIN descendants d ON p."parent_policy_id" = d.id
        ),
        ancestors AS (
          SELECT id, "parent_policy_id" FROM "policy" WHERE id = ${id}
          UNION
          SELECT p.id, p."parent_policy_id" FROM "policy" p
          INNER JOIN ancestors a ON p.id = a."parent_policy_id"
        )
        SELECT id FROM descendants
        UNION
        SELECT id FROM ancestors
      ` as any[];

      const policyIdsArray = chainResult.map((r: any) => r.id);
      console.log(`🔗 Found ${policyIdsArray.length} related policies to delete:`, policyIdsArray);

      if (policyIdsArray.length === 0) {
        return { deletedCount: 0, policyIds: [] };
      }

      // Step 1: Clear parent_policy_id references
      await tx.policy.updateMany({
        where: { id: { in: policyIdsArray } },
        data: { parent_policy_id: null },
      });

      // Step 2: Delete document references
      await Promise.all([
        tx.policyDocumentReference.deleteMany({
          where: { source_document: { policy_id: { in: policyIdsArray } } }
        }),
        tx.policyDocumentReference.deleteMany({
          where: { policy_id: { in: policyIdsArray } }
        }),
      ]);

      // Step 3: Delete all related records in parallel
      await Promise.all([
        tx.commissionJournal.deleteMany({ where: { policy_id: { in: policyIdsArray } } }),
        tx.policyFormValue.deleteMany({ where: { policy_id: { in: policyIdsArray } } }),
        tx.policyReceipt.deleteMany({ where: { policy_id: { in: policyIdsArray } } }),
        tx.revenue.deleteMany({ where: { policyId: { in: policyIdsArray } } }),
        tx.reminder.deleteMany({ where: { policy_id: { in: policyIdsArray } } }),
        tx.claim.deleteMany({ where: { policy_id: { in: policyIdsArray } } }),
        tx.uploadedDocument.deleteMany({ where: { policy_id: { in: policyIdsArray } } }),
        tx.insuredMember.deleteMany({ where: { policy_id: { in: policyIdsArray } } }),
        tx.proposer.deleteMany({ where: { policy_id: { in: policyIdsArray } } }),
        tx.nomineeAndPayment.deleteMany({ where: { policy_id: { in: policyIdsArray } } }),
      ]);

      // Step 4: Delete all policies
      const deletedPolicies = await tx.policy.deleteMany({
        where: { id: { in: policyIdsArray } }
      });

      console.log(`✅ Successfully deleted ${deletedPolicies.count} policies in the chain`);
      return { deletedCount: deletedPolicies.count, policyIds: policyIdsArray };
    }, {
      maxWait: 5000,
      timeout: 15000,
    });
  },

  // Get policies by user ID
  async getPoliciesByUserId(userId: string) {
    return prisma.policy.findMany({
      where: { created_by: userId },
      orderBy: { created_at: 'desc' },
      include: POLICY_FULL_INCLUDE,
    });
  },

  // Get document by ID
  async getDocumentById(documentId: string) {
    return prisma.uploadedDocument.findUnique({
      where: { id: documentId },
      include: {
        policy: true,
        proposer: {
          include: {
            policy: true,
          },
        },
        insured_member: {
          include: {
            proposer: {
              include: {
                policy: true,
              },
            },
          },
        },
      },
    });
  },

  // Delete document by ID
  async deleteDocument(documentId: string) {
    return prisma.uploadedDocument.delete({
      where: { id: documentId },
    });
  },

  // Helper method for two-phase approach: Create core entities only
  async createCoreEntities(data: any) {
    console.log('🚀 [REPOSITORY] Creating core entities...');
    console.log("🔍 [Repository] Core Entities Input:", JSON.stringify({
      policy_number: data.policy_number,
      customer_name: data.customer_name,
      policy_salutation: data.policy_salutation,
      proposer: data.proposer ? {
        full_name: data.proposer.full_name,
        proposer_salutation: data.proposer.proposer_salutation,
        email: data.proposer.email
      } : null,
      insured_members_count: data.insured_members?.length || data.members?.length || 0,
      nominee_payment: data.nominee_payment
    }, null, 2));
    
    return await prisma.$transaction(async (tx) => {
      // Create policy
      const policyData: any = {
        policy_number: data.policy_number,
        customer_name: data.customer_name,
        policy_salutation: data.policy_salutation,
        created_by: data.created_by,
        insurer_name: data.insurer_name,
        product_name: data.product_name,
        plan_type: data.plan_type,
        sum_insured: data.sum_insured,
        start_date: data.start_date,
        end_date: data.end_date,
        tenure_years: data.tenure_years,
        issued_date: data.issued_date,
        premium_amount: data.premium_amount,
        declaration_accepted: data.declaration_accepted,
        system_ip: data.system_ip,
        medical_condition: data.medical_condition,
        medical_remarks: data.medical_remarks,
        deductible_amount: data.deductible_amount,
        deductible_amount_status: data.deductible_amount_status,
        policy_creation_status: data.policy_creation_status,
      };

      // Handle foreign key relations
      if (data.company_id) {
        policyData.company = { connect: { id: data.company_id } };
      }
      if (data.policy_type_id) {
        policyData.type = { connect: { id: data.policy_type_id } };
      }
      if (data.policy_name_id) {
        policyData.policyName = { connect: { id: data.policy_name_id } };
      }
      if (data.policy_group_id) {
        policyData.policyGroup = { connect: { id: data.policy_group_id } };
      }

      const policy = await tx.policy.create({
        data: policyData,
      });

      console.log("✅ [Repository] Policy Created:", { id: policy.id, policy_number: policy.policy_number });

      // Create proposer
      const proposer = await tx.proposer.create({
        data: {
          ...data.proposer,
          policy_id: policy.id,
        },
      });

      console.log("✅ [Repository] Proposer Created:", { id: proposer.id, full_name: proposer.full_name, proposer_salutation: proposer.proposer_salutation });

      // Create insured members
      const insuredMembers = [];
      const membersToCreate = data.insured_members || data.members || [];
      
      for (const memberData of membersToCreate) {
        const member = await tx.insuredMember.create({
          data: {
            ...memberData,
            proposer_id: proposer.id,
          },
        });
        insuredMembers.push(member);
      }

      console.log("✅ [Repository] Insured Members Created:", insuredMembers.map(m => ({ id: m.id, name: m.name, insured_member_salutation: m.insured_member_salutation })));

      // Create nominee payment if provided
      let nomineePayment = null;
      if (data.nominee_payment) {
        nomineePayment = await tx.nomineeAndPayment.create({
          data: {
            ...data.nominee_payment,
            policy_id: policy.id,
          },
        });
        console.log("✅ [Repository] Nominee Payment Created:", { 
          id: nomineePayment.id, 
          nominee_salutation: nomineePayment.nominee_salutation, 
          bank_name: nomineePayment.bank_name,
          bank_account_number: nomineePayment.bank_account_number,
          bank_ifsc_code: nomineePayment.bank_ifsc_code,
          bank_branch_name: nomineePayment.bank_branch_name
        });
      }

      const result = {
        policyId: policy.id,
        proposerId: proposer.id,
        insuredMemberIds: insuredMembers.map(m => m.id),
        nomineePaymentId: nomineePayment?.id,
      };

      console.log("✅ [Repository] Core Entities Result:", result);
      return result;
    });
  },

  // Helper method for two-phase approach: Link documents
  async linkDocuments(coreEntities: any, documents: any) {
    console.log('🔗 [REPOSITORY] Linking documents...');
    console.log("🔍 [Repository] Core Entities for Document Linking:", coreEntities);
    console.log("📄 [Repository] Documents to Link:", {
      policyDocs: documents.policyDocs?.length || 0,
      proposerDocs: documents.proposerDocs?.length || 0,
      memberDocs: documents.memberDocs?.length || 0
    });
    
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Link policy documents
      if (documents.policyDocs && documents.policyDocs.length > 0) {
        console.log("📄 [Repository] Linking Policy Documents:", documents.policyDocs.length);
        await tx.uploadedDocument.createMany({
          data: documents.policyDocs.map((doc: any) => ({
            ...doc,
            policy_id: coreEntities.policyId,
          })),
        });
        console.log("✅ [Repository] Policy Documents Linked Successfully");
      }

      // Link proposer documents
      if (documents.proposerDocs && documents.proposerDocs.length > 0) {
        console.log("📄 [Repository] Linking Proposer Documents:", documents.proposerDocs.length);
        await tx.uploadedDocument.createMany({
          data: documents.proposerDocs.map((doc: any) => ({
            ...doc,
            proposer_id: coreEntities.proposerId,
          })),
        });
        console.log("✅ [Repository] Proposer Documents Linked Successfully");
      }

      // Link member documents
      if (documents.memberDocs && documents.memberDocs.length > 0) {
        console.log("📄 [Repository] Linking Member Documents:", documents.memberDocs.length);
        const memberDocsToCreate = documents.memberDocs.map((doc: any, index: number) => {
          let insured_member_id = doc.insured_member_id;
          
          // If no specific member ID, use index-based linking
          if (!insured_member_id && doc.member_index !== undefined) {
            insured_member_id = coreEntities.insuredMemberIds[doc.member_index];
            console.log(`🔗 [Repository] Member doc ${index}: Using index-based linking (index: ${doc.member_index} -> memberId: ${insured_member_id})`);
          } else if (insured_member_id) {
            console.log(`🔗 [Repository] Member doc ${index}: Using direct member ID linking (memberId: ${insured_member_id})`);
          } else {
            console.log(`❌ [Repository] Member doc ${index}: No member ID or index found!`);
          }
          
          console.log("🔗 [Repository] Member Document Mapping:", {
            originalDoc: doc,
            memberIndex: doc.member_index,
            insured_member_id: insured_member_id,
            availableMemberIds: coreEntities.insuredMemberIds
          });
          
          return {
            ...doc,
            insured_member_id,
          };
        });

        await tx.uploadedDocument.createMany({
          data: memberDocsToCreate,
        });
        console.log("✅ [Repository] Member Documents Linked Successfully");
      }
      
      console.log("✅ [Repository] All Documents Linked Successfully");
    });
  },

  // Fetch a matching CommissionRule for commission calculation
  async getMatchingCommissionRule(params: {
    policy_name_id: string;
    policy_creation_status: import('@prisma/client').PolicyCreationStatus;
    ageCondition: import('@prisma/client').AgeCondition;
    deductibleType: import('@prisma/client').DeductibleType;
  }) {
    return prisma.commissionRule.findFirst({
      where: {
        policy_name_id: params.policy_name_id,
        policyStatus: params.policy_creation_status,
        ageCondition: params.ageCondition,
        deductibleType: params.deductibleType,
        is_active: true,
      },
    });
  },
};