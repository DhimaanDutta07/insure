"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.policyService = void 0;
exports.calculateAndSetCommission = calculateAndSetCommission;
const fs_1 = __importDefault(require("fs"));
const lruCache_1 = require("../utils/lruCache");
const client_1 = require("@prisma/client");
const policyRepository_1 = require("../repositories/policyRepository");
const prismaClient_1 = __importDefault(require("../utils/prismaClient"));
// Helper to map MIME type to FileType enum
function mapMimeTypeToFileType(mimeType) {
    switch (mimeType) {
        case "application/pdf":
            return "PDF";
        case "image/jpeg":
        case "image/jpg":
            return "JPG";
        case "image/png":
            return "PNG";
        case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
            return "XLSX";
        case "text/csv":
            return "CSV";
        case "application/msword":
        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            return "DOC";
        case "image/gif":
        case "image/bmp":
        case "image/webp":
            return "IMAGE";
        default:
            return "OTHER";
    }
}
// Helper function to process uploaded files
function processUploadedFiles(files, uploadedBy) {
    const policyDocs = [];
    const proposerDocs = [];
    const memberDocs = [];
    if (!files) {
        console.log("📄 [FileProcessing] No files provided");
        return { policyDocs, proposerDocs, memberDocs };
    }
    // Process policy documents
    if (files.policyDocs && Array.isArray(files.policyDocs)) {
        files.policyDocs.forEach((file) => {
            policyDocs.push({
                file_name: file.filename,
                original_name: file.originalname,
                relative_path: `/api/uploads/policy-documents/${file.filename}`,
                file_data: fs_1.default.readFileSync(file.path),
                file_type: mapMimeTypeToFileType(file.mimetype),
                category: client_1.DocumentCategory.POLICY_DOCUMENT,
                uploaded_by: uploadedBy,
            });
        });
    }
    // Process proposer documents
    if (files.proposerDocs && Array.isArray(files.proposerDocs)) {
        files.proposerDocs.forEach((file) => {
            proposerDocs.push({
                file_name: file.filename,
                original_name: file.originalname,
                relative_path: `/api/uploads/policy-documents/${file.filename}`,
                file_data: fs_1.default.readFileSync(file.path),
                file_type: mapMimeTypeToFileType(file.mimetype),
                category: client_1.DocumentCategory.PROPOSER_DOCUMENT,
                uploaded_by: uploadedBy,
            });
        });
    }
    // Process member documents with index-based linking (legacy)
    if (files.memberDocs && Array.isArray(files.memberDocs)) {
        files.memberDocs.forEach((file, index) => {
            memberDocs.push({
                file_name: file.filename,
                original_name: file.originalname,
                relative_path: `/api/uploads/policy-documents/${file.filename}`,
                file_data: fs_1.default.readFileSync(file.path),
                file_type: mapMimeTypeToFileType(file.mimetype),
                category: client_1.DocumentCategory.INSURED_MEMBER_DOCUMENT,
                uploaded_by: uploadedBy,
                member_index: index,
            });
        });
    }
    // Process member-specific documents with dynamic field names
    Object.entries(files).forEach(([fieldName, fileList]) => {
        if (fieldName.startsWith('memberDocs_') && Array.isArray(fileList)) {
            const memberIdOrIndex = fieldName.split('memberDocs_')[1];
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(memberIdOrIndex);
            const memberIndex = parseInt(memberIdOrIndex);
            fileList.forEach((file) => {
                memberDocs.push({
                    file_name: file.filename,
                    original_name: file.originalname,
                    relative_path: `/api/uploads/policy-documents/${file.filename}`,
                    file_data: fs_1.default.readFileSync(file.path),
                    file_type: mapMimeTypeToFileType(file.mimetype),
                    category: client_1.DocumentCategory.INSURED_MEMBER_DOCUMENT,
                    uploaded_by: uploadedBy,
                    member_index: isUUID ? undefined : memberIndex,
                    insured_member_id: isUUID ? memberIdOrIndex : undefined,
                });
            });
        }
    });
    return { policyDocs, proposerDocs, memberDocs };
}
// Defensive validation functions
function validateCoreEntities(result) {
    if (!result.policyId) {
        throw new Error('Policy ID not generated - core entity creation failed');
    }
    if (!result.proposerId) {
        throw new Error('Proposer ID not generated - core entity creation failed');
    }
    if (!Array.isArray(result.insuredMemberIds)) {
        throw new Error('Insured member IDs not generated - core entity creation failed');
    }
}
function validateDocumentForeignKeys(docs, availableIds) {
    docs.forEach((doc, index) => {
        if (doc.category === 'INSURED_MEMBER_DOCUMENT') {
            if (doc.insured_member_id) {
                // If specific member ID is provided, validate it
                if (!availableIds.insuredMemberIds.includes(doc.insured_member_id)) {
                    throw new Error(`Invalid insured_member_id "${doc.insured_member_id}" in document ${index}`);
                }
            }
            else if (doc.member_index !== undefined) {
                // If using index-based linking, validate the index
                if (doc.member_index >= availableIds.insuredMemberIds.length) {
                    throw new Error(`Member index ${doc.member_index} out of range for document ${index}`);
                }
            }
            else {
                throw new Error(`Member document ${index} missing both insured_member_id and member_index`);
            }
        }
    });
}
/**
 * Calculates and sets the commission amount on the policy input using simplified CommissionRule logic.
 * Looks up ANY active commission rule for the policy_name_id and uses its commissionPercent.
 * Mutates policyInput.calculated_commission_amount in place.
 */
async function calculateAndSetCommission(policyInput) {
    console.log('[Commission] Starting simplified commission calculation with input:', {
        hasPolicyInput: !!policyInput,
        hasPolicyNameId: !!policyInput?.policy_name_id,
        premiumAmount: policyInput?.premium_amount,
        gstStatus: policyInput?.gst_status,
        policyNameId: policyInput?.policy_name_id,
    });
    // Defensive: Only run if required fields are present
    if (!policyInput || !policyInput.policy_name_id || !policyInput.premium_amount) {
        policyInput.calculated_commission_amount = 0;
        policyInput.commission_add_on_percentage = 0;
        console.log('[Commission] Missing required fields, commission set to 0');
        return;
    }
    // Fetch ANY active commission rule for this policy name
    const activeRule = await prismaClient_1.default.commissionRule.findFirst({
        where: {
            policy_name_id: policyInput.policy_name_id,
            is_active: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
    console.log('[Commission] CommissionRule lookup:', {
        policy_name_id: policyInput.policy_name_id,
        matchedRuleId: activeRule?.id,
        commissionPercent: activeRule?.commissionPercent,
    });
    if (!activeRule) {
        // No commission rule found - set commission to 0 (no error thrown)
        policyInput.calculated_commission_amount = 0;
        policyInput.commission_add_on_percentage = 0;
        policyInput._commissionPercent = 0;
        policyInput._commissionRuleId = null;
        console.log('[Commission] No commission rule found for product, commission set to 0');
        return;
    }
    // Calculate commission based on CommissionRule percentage
    const basePercent = activeRule.commissionPercent || 0;
    // ✅ GST Logic: If GST Status is ON, deduct 18% from premium before commission calculation
    let premiumForCommission = policyInput.premium_amount;
    if (policyInput.gst_status === true) {
        // Deduct 18% GST from premium amount
        premiumForCommission = policyInput.premium_amount * (1 - 0.18); // 82% of original
        console.log('[Commission] GST Status ON - Deducting 18% from premium:', {
            originalPremium: policyInput.premium_amount,
            afterGstDeduction: premiumForCommission,
        });
    }
    else {
        console.log('[Commission] GST Status OFF - Using full premium amount');
    }
    policyInput.calculated_commission_amount = (premiumForCommission * basePercent) / 100;
    policyInput.commission_add_on_percentage = basePercent;
    policyInput._commissionPercent = basePercent;
    policyInput._commissionRuleId = activeRule.id;
    console.log('[Commission] Commission calculated successfully:', {
        commissionPercent: basePercent,
        calculatedAmount: policyInput.calculated_commission_amount,
        gstStatus: policyInput.gst_status,
        premiumUsed: premiumForCommission,
    });
}
exports.policyService = {
    /**
     * PHASE 1: Create all core entities in one transaction
     */
    async createCoreEntities(data) {
        console.log('🚀 Phase 1: Creating core entities...');
        // Validate policy number uniqueness
        if (data.policy_number) {
            const existingPolicy = await prismaClient_1.default.policy.findUnique({
                where: { policy_number: data.policy_number }
            });
            if (existingPolicy) {
                throw new Error(`Policy with number ${data.policy_number} already exists`);
            }
        }
        const result = await prismaClient_1.default.$transaction(async (tx) => {
            const policy = await tx.policy.create({
                data: {
                    // Policy fields
                    policy_salutation: data.policy_salutation,
                    policy_number: data.policy_number,
                    customer_name: data.customer_name,
                    company_id: data.company_id,
                    policy_type_id: data.policy_type_id,
                    policy_name_id: data.policy_name_id,
                    policy_group_id: data.policy_group_id,
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
                    gst_status: data.gst_status,
                    remarks: data.remarks,
                    premium_amount_gst: data.premium_amount_gst,
                    calculated_commission_amount: data.calculated_commission_amount,
                    emi_amount: data.emi_amount,
                    commission_add_on_percentage: data.commission_add_on_percentage,
                },
            });
            const proposer = await tx.proposer.create({
                data: {
                    ...data.proposer,
                    gender: data.proposer.gender,
                    marital_status: data.proposer.marital_status,
                    policy_id: policy.id,
                },
            });
            const insuredMembers = [];
            const membersToCreate = data.insured_members || data.members || [];
            for (const memberData of membersToCreate) {
                const member = await tx.insuredMember.create({
                    data: {
                        ...memberData,
                        gender: memberData.gender,
                        proposer_id: proposer.id,
                        policy_id: policy.id,
                    },
                });
                insuredMembers.push(member);
            }
            let nomineePayment = null;
            if (data.nominee_payment) {
                nomineePayment = await tx.nomineeAndPayment.create({
                    data: {
                        ...data.nominee_payment,
                        policy_id: policy.id,
                    },
                });
            }
            return {
                policyId: policy.id,
                proposerId: proposer.id,
                insuredMemberIds: insuredMembers.map(m => m.id),
                nomineePaymentId: nomineePayment?.id,
            };
        });
        validateCoreEntities(result);
        console.log('✅ Phase 1: Core entities created successfully');
        return result;
    },
    /**
     * PHASE 2: Link uploaded documents to respective IDs in a second transaction
     */
    async linkDocuments(coreEntities, processedDocs) {
        console.log('🔗 Phase 2: Linking documents...');
        console.log("🔍 [LinkDocuments] Core Entities:", coreEntities);
        console.log("📄 [LinkDocuments] Documents to Link:", {
            policyDocs: processedDocs.policyDocs.length,
            proposerDocs: processedDocs.proposerDocs.length,
            memberDocs: processedDocs.memberDocs.length
        });
        // Validate document foreign keys before linking
        validateDocumentForeignKeys(processedDocs.memberDocs, coreEntities);
        await prismaClient_1.default.$transaction(async (tx) => {
            // Link policy documents
            if (processedDocs.policyDocs.length > 0) {
                console.log("📄 [LinkDocuments] Linking Policy Documents:", processedDocs.policyDocs.length);
                await tx.uploadedDocument.createMany({
                    data: processedDocs.policyDocs.map(doc => ({
                        ...doc,
                        file_type: doc.file_type,
                        policy_id: coreEntities.policyId,
                    })),
                });
                console.log("✅ [LinkDocuments] Policy Documents Linked Successfully");
            }
            // Link proposer documents
            if (processedDocs.proposerDocs.length > 0) {
                console.log("📄 [LinkDocuments] Linking Proposer Documents:", processedDocs.proposerDocs.length);
                await tx.uploadedDocument.createMany({
                    data: processedDocs.proposerDocs.map(doc => ({
                        ...doc,
                        file_type: doc.file_type,
                        proposer_id: coreEntities.proposerId,
                    })),
                });
                console.log("✅ [LinkDocuments] Proposer Documents Linked Successfully");
            }
            // Link member documents with ID-based linking
            if (processedDocs.memberDocs.length > 0) {
                console.log("📄 [LinkDocuments] Linking Member Documents:", processedDocs.memberDocs.length);
                const memberDocsToCreate = processedDocs.memberDocs.map((doc, index) => {
                    let insured_member_id = doc.insured_member_id;
                    // If no specific member ID, use index-based linking
                    if (!insured_member_id && doc.member_index !== undefined) {
                        insured_member_id = coreEntities.insuredMemberIds[doc.member_index];
                        console.log(`🔗 [LinkDocuments] Member doc ${index}: Using index-based linking (index: ${doc.member_index} -> memberId: ${insured_member_id})`);
                    }
                    else if (insured_member_id) {
                        console.log(`🔗 [LinkDocuments] Member doc ${index}: Using direct member ID linking (memberId: ${insured_member_id})`);
                    }
                    else {
                        console.log(`❌ [LinkDocuments] Member doc ${index}: No member ID or index found!`);
                    }
                    return {
                        ...doc,
                        insured_member_id,
                    };
                });
                await tx.uploadedDocument.createMany({
                    data: memberDocsToCreate.map(doc => {
                        const { member_index, ...docWithoutIndex } = doc;
                        return {
                            ...docWithoutIndex,
                            file_type: doc.file_type,
                        };
                    }),
                });
                console.log("✅ [LinkDocuments] Member Documents Linked Successfully");
            }
        });
        console.log('✅ Phase 2: Documents linked successfully');
    },
    /**
     * ✅ ROBUST CREATE POLICY - Uses two-phase approach
     * Phase 1: Create core entities (Policy, Proposer, InsuredMembers, Nominee) in one transaction
     * Phase 2: Link uploaded documents to respective IDs in a second transaction
     */
    async createPolicy(data, files, userId) {
        console.log('🚀 Starting robust policy creation...');
        // Debug incoming data
        console.log("🧾 [Service] Policy Input:", JSON.stringify({
            policy_number: data.policy_number,
            customer_name: data.customer_name,
            company_id: data.company_id,
            insured_members_count: data.insured_members?.length || data.members?.length || 0,
            proposer: data.proposer ? {
                full_name: data.proposer.full_name,
                email: data.proposer.email,
                mobile: data.proposer.mobile
            } : null
        }, null, 2));
        console.log("🧾 [Service] Proposer Input:", JSON.stringify(data.proposer, null, 2));
        console.log("🧾 [Service] Members Input:", JSON.stringify(data.insured_members || data.members, null, 2));
        console.log("📄 [Service] Files Received:", files ? Object.keys(files) : 'No files');
        // Process uploaded files (stored flat in policy-documents)
        const processedDocs = processUploadedFiles(files, userId);
        console.log("📄 [Service] Processed Documents:", {
            policyDocs: processedDocs.policyDocs.length,
            proposerDocs: processedDocs.proposerDocs.length,
            memberDocs: processedDocs.memberDocs.length
        });
        try {
            // Phase 1: Create core entities
            const coreEntities = await this.createCoreEntities(data);
            console.log("✅ [Service] Phase 1 Complete - Core Entities:", {
                policyId: coreEntities.policyId,
                proposerId: coreEntities.proposerId,
                insuredMemberIds: coreEntities.insuredMemberIds,
                nomineePaymentId: coreEntities.nomineePaymentId
            });
            // Calculate commission with GST logic
            const commissionData = {
                policy_name_id: data.policy_name_id,
                premium_amount: data.premium_amount,
                gst_status: data.gst_status,
            };
            await calculateAndSetCommission(commissionData);
            // Update policy with calculated commission
            if (commissionData.calculated_commission_amount !== undefined) {
                await prismaClient_1.default.policy.update({
                    where: { id: coreEntities.policyId },
                    data: {
                        calculated_commission_amount: commissionData.calculated_commission_amount,
                        commission_add_on_percentage: commissionData.commission_add_on_percentage,
                    },
                });
                console.log('[Service] Commission calculated and updated for new policy:', {
                    policyId: coreEntities.policyId,
                    calculated_commission_amount: commissionData.calculated_commission_amount,
                    gst_status: data.gst_status,
                });
            }
            // Phase 2: Link documents
            await this.linkDocuments(coreEntities, processedDocs);
            // Fetch the complete policy with all relations
            const result = await policyRepository_1.policyRepository.getPolicyById(coreEntities.policyId);
            console.log("✅ [Service] Final Policy Result:", {
                policyId: result?.id,
                proposerId: result?.proposer?.id,
                memberCount: result?.proposer?.insured_members?.length || 0,
                documentCount: result?.documents?.length || 0,
                proposerDocCount: result?.proposer?.documents?.length || 0,
                memberDocCount: result?.proposer?.insured_members?.reduce((total, member) => total + (member.documents?.length || 0), 0) || 0
            });
            console.log('✅ Policy created successfully with two-phase approach');
            return result;
        }
        catch (error) {
            console.error('❌ Policy creation failed:', error);
            throw error;
        }
    },
    // async bulkCreatePolicies(policies: any[], userId: string) {
    //   console.log("Policy creation 1111",policies)
    //   const created: string[] = [];
    //   const failed: { row: number; error: any }[] = [];
    //   for (let i = 0; i < policies.length; i++) {
    //     const policy = policies[i];
    //     try {
    //       // Check if policy number already exists
    //       if (policy.policy_number) {
    //         const existingPolicy = await prisma.policy.findUnique({
    //           where: { policy_number: policy.policy_number }
    //         });
    //         if (existingPolicy) {
    //           throw new Error(`Policy with number ${policy.policy_number} already exists`);
    //         }
    //       }
    //       // Look up or create company by name if provided
    //       let companyId = policy.company_id;
    //       if (!companyId && policy.policy_name) {
    //         // First try to find existing company
    //         let company = await prisma.company.findFirst({
    //           where: { name: { contains: policy.policy_name } }
    //         });
    //         // If not found, create a new company
    //         if (!company) {
    //           try {
    //             // Determine category based on policy type or default to HEALTH
    //             let category = 'HEALTH';
    //             if (policy.type && policy.type.toLowerCase().includes('life')) {
    //               category = 'LIFE';
    //             }
    //             company = await prisma.company.create({
    //               data: {
    //                 name: policy.insurer_name,
    //                 category: category as any
    //               }
    //             });
    //             console.log(`Created new company: ${company.name}`);
    //           } catch (error) {
    //             console.log(`Failed to create company ${policy.insurer_name}:`, error);
    //           }
    //         }
    //         if (company) {
    //           companyId = company.id;
    //           console.log(`Using company: ${company.name} for ${policy.insurer_name}`);
    //         }
    //       }
    //       // Look up policy type by name if provided
    //       let policyTypeId = policy.policy_type_id;
    //       if (!policyTypeId && policy.type) {
    //         const policyType = await prisma.policyType.findFirst({
    //           where: { name: policy.type }
    //         });
    //         if (policyType) {
    //           policyTypeId = policyType.id;
    //           console.log(`Found policy type: ${policyType.name} for ${policy.type}`);
    //         } else {
    //           console.log(`Policy type not found: ${policy.type}`);
    //         }
    //       }
    //       // Look up or create policy group and policy name
    //       let policyNameId = policy.policy_name_id;
    //       let policyGroupId = policy.policy_group_id;
    //       if (!policyNameId && policy.product_name) {
    //         // First try to find existing policy name
    //         let policyName = await prisma.policyName.findFirst({
    //           where: { name: { contains: policy.product_name } }
    //         });
    //         // If not found, create policy group and policy name
    //         if (!policyName && companyId) {
    //           try {
    //             // Create or find policy group for this company
    //             const company = await prisma.company.findUnique({
    //               where: { id: companyId }
    //             });
    //             if (company && company.name) {
    //               const companyName = company.name; // Type assertion
    //               let policyGroup = await prisma.policyGroup.findFirst({
    //                 where: { name: { contains: companyName } }
    //               });
    //               if (!policyGroup) {
    //                 policyGroup = await prisma.policyGroup.create({
    //                   data: {
    //                     name: `${companyName} Products`,
    //                     description: `Policy group for ${companyName} products`
    //                   }
    //                 });
    //                 console.log(`Created new policy group: ${policyGroup.name}`);
    //               }
    //               policyGroupId = policyGroup.id;
    //               // Create the policy name under this group
    //               policyName = await prisma.policyName.create({
    //                 data: {
    //                   name: policy.product_name,
    //                   description: `Product: ${policy.product_name}`,
    //                   policy_group_id: policyGroup.id
    //                 }
    //               });
    //               console.log(`Created new policy name: ${policyName.name}`);
    //             }
    //           } catch (error) {
    //             console.log(`Failed to create policy group/name for ${policy.product_name}:`, error);
    //           }
    //         }
    //         if (policyName) {
    //           policyNameId = policyName.id;
    //           if (!policyGroupId) {
    //             policyGroupId = policyName.policy_group_id;
    //           }
    //           console.log(`Using policy name: ${policyName.name} for ${policy.product_name}`);
    //         }
    //       }
    //       // Convert file_url to relative_path in documents
    //       if (policy.documents && Array.isArray(policy.documents)) {
    //         policy.documents = policy.documents.map((doc: any) => {
    //           if (doc.file_url && !doc.relative_path) {
    //             doc.relative_path = doc.file_url;
    //             delete doc.file_url;
    //           }
    //           return doc;
    //         });
    //       }
    //       // Convert file_url to relative_path in proposer documents
    //       if (policy.proposer?.documents && Array.isArray(policy.proposer.documents)) {
    //         policy.proposer.documents = policy.proposer.documents.map((doc: any) => {
    //           if (doc.file_url && !doc.relative_path) {
    //             doc.relative_path = doc.file_url;
    //             delete doc.file_url;
    //           }
    //           return doc;
    //         });
    //       }
    //       // Convert file_url to relative_path in member documents
    //       if (policy.members && Array.isArray(policy.members)) {
    //         policy.members = policy.members.map((member: any) => {
    //           if (member.documents && Array.isArray(member.documents)) {
    //             member.documents = member.documents.map((doc: any) => {
    //               if (doc.file_url && !doc.relative_path) {
    //                 doc.relative_path = doc.file_url;
    //                 delete doc.file_url;
    //               }
    //               return doc;
    //             });
    //           }
    //           return member;
    //         });
    //       }
    //       const policyData = {
    //         ...policy,
    //         company_id: companyId,
    //         policy_type_id: policyTypeId,
    //         policy_name_id: policyNameId,
    //         policy_group_id: policyGroupId,
    //         created_by: userId,
    //       };
    //       // Wrap proposer data in create object for nested relation
    //       if (policyData.proposer) {
    //         const proposerData = { ...policyData.proposer };
    //         // If proposer has insured_members, move them to be created under proposer
    //         if (policyData.insured_members && Array.isArray(policyData.insured_members)) {
    //           proposerData.insured_members = {
    //             create: policyData.insured_members
    //           };
    //         } else if (policyData.members && Array.isArray(policyData.members)) {
    //           // Also handle legacy members field
    //           proposerData.insured_members = {
    //             create: policyData.members
    //           };
    //         }
    //         policyData.proposer = {
    //           create: proposerData
    //         };
    //         // Remove from root level since they're now under proposer
    //         delete policyData.insured_members;
    //         delete policyData.members;
    //       }
    //       // Handle the case where members exist but no proposer (shouldn't happen but for safety)
    //       if ((policyData.members && Array.isArray(policyData.members)) || 
    //           (policyData.insured_members && Array.isArray(policyData.insured_members))) {
    //         if (!policyData.proposer) {
    //           console.warn('Members found without proposer - this may cause issues');
    //           policyData.members = {
    //             create: policyData.insured_members || policyData.members
    //           };
    //           delete policyData.insured_members;
    //         }
    //       }
    //       await policyRepository.createPolicy(policyData);
    //       created.push(policy.policy_number || `row_${i + 2}`);
    //     } catch (error) {
    //       console.error(`Error creating policy at row ${i + 2}:`, error);
    //       failed.push({ row: i + 2, error: error instanceof Error ? error.message : error });
    //     }
    //   }
    //   return { created, failed };
    // },
    async bulkCreatePolicies(policies, userId) {
        console.log("Policy creation 1111", policies);
        const created = [];
        const failed = [];
        // Helper function to validate insured members
        function isValidInsuredMember(member) {
            return (member &&
                typeof member === 'object' &&
                member.relation_to_proposer &&
                member.relation_to_proposer !== 'false' &&
                member.name &&
                member.date_of_birth // Enforce date_of_birth; adjust if optional
            );
        }
        for (let i = 0; i < policies.length; i++) {
            const policy = policies[i];
            try {
                // Check if policy number already exists
                if (policy.policy_number) {
                    const existingPolicy = await prismaClient_1.default.policy.findUnique({
                        where: { policy_number: policy.policy_number },
                    });
                    if (existingPolicy) {
                        throw new Error(`Policy with number ${policy.policy_number} already exists`);
                    }
                }
                // Look up or create company by name if provided
                let companyId = policy.company_id;
                if (!companyId && (policy.company_name || policy.insurer_name)) {
                    const companyName = policy.company_name || policy.insurer_name;
                    let company = await prismaClient_1.default.company.findFirst({
                        where: { name: { contains: companyName } },
                    });
                    if (!company) {
                        try {
                            company = await prismaClient_1.default.company.create({
                                data: {
                                    name: companyName,
                                },
                            });
                            console.log(`Created new company: ${company.name}`);
                        }
                        catch (error) {
                            throw new Error(`Failed to create company ${companyName}: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
                        }
                    }
                    companyId = company.id;
                    console.log(`Using company: ${company.name} for ${companyName}`);
                }
                if (!companyId) {
                    throw new Error(`No valid company ID for policy ${policy.policy_number}`);
                }
                // Look up or create policy type by name if provided
                let policyTypeId = policy.policy_type_id;
                if (!policyTypeId && (policy.policy_type_name || policy.type)) {
                    const policyTypeName = policy.policy_type_name || policy.type;
                    let policyType = await prismaClient_1.default.policyType.findFirst({
                        where: { name: policyTypeName },
                    });
                    if (policyType) {
                        policyTypeId = policyType.id;
                        console.log(`Found policy type: ${policyType.name} for ${policyTypeName}`);
                    }
                    else {
                        try {
                            policyType = await prismaClient_1.default.policyType.create({
                                data: { name: policyTypeName },
                            });
                            policyTypeId = policyType.id;
                            console.log(`Created new policy type: ${policyTypeName}`);
                        }
                        catch (error) {
                            throw new Error(`Failed to create policy type ${policyTypeName}: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
                        }
                    }
                }
                if (!policyTypeId) {
                    throw new Error(`No valid policy type ID for policy ${policy.policy_number}`);
                }
                // Look up or create policy group and policy name
                let policyNameId = policy.policy_name_id;
                let policyGroupId = policy.policy_group_id;
                // Look up policy group by name if provided
                if (!policyGroupId && policy.policy_group_name) {
                    // Normalize policy group name to match database (uppercase)
                    const normalizedGroupName = policy.policy_group_name.toUpperCase();
                    let policyGroup = await prismaClient_1.default.policyGroup.findFirst({
                        where: { name: { contains: normalizedGroupName } },
                    });
                    if (!policyGroup) {
                        try {
                            policyGroup = await prismaClient_1.default.policyGroup.create({
                                data: {
                                    name: normalizedGroupName,
                                    description: `Policy group: ${normalizedGroupName}`,
                                },
                            });
                            console.log(`Created new policy group: ${normalizedGroupName}`);
                        }
                        catch (error) {
                            throw new Error(`Failed to create policy group ${normalizedGroupName}: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
                        }
                    }
                    policyGroupId = policyGroup.id;
                    console.log(`Found policy group: ${policyGroup.name} for ${normalizedGroupName}`);
                }
                if (!policyNameId && (policy.policy_name_name || policy.product_name)) {
                    const policyNameValue = policy.policy_name_name || policy.product_name;
                    console.log(`🔍 [SERVICE] Policy name lookup - Available fields:`, {
                        policy_name_name: policy.policy_name_name,
                        product_name: policy.product_name,
                        policyNameValue: policyNameValue,
                        companyId: companyId,
                        policyGroupId: policyGroupId
                    });
                    // First try to find existing policy name with company and policy group
                    let policyName = null;
                    if (companyId && policyGroupId) {
                        console.log(`Looking for policy name "${policyNameValue}" with company_id: ${companyId}, policy_group_id: ${policyGroupId}`);
                        policyName = await prismaClient_1.default.policyName.findFirst({
                            where: {
                                name: { contains: policyNameValue },
                                company_id: companyId,
                                policy_group_id: policyGroupId
                            },
                        });
                        if (policyName) {
                            console.log(`Found existing policy name: ${policyName.name}`);
                        }
                    }
                    // If not found, try just by name
                    if (!policyName) {
                        console.log(`Looking for policy name "${policyNameValue}" by name only`);
                        policyName = await prismaClient_1.default.policyName.findFirst({
                            where: { name: { contains: policyNameValue } },
                        });
                        if (policyName) {
                            console.log(`Found existing policy name by name only: ${policyName.name}`);
                        }
                    }
                    if (!policyName && companyId) {
                        try {
                            const company = await prismaClient_1.default.company.findUnique({
                                where: { id: companyId },
                            });
                            if (!company) {
                                throw new Error(`Company not found for ID ${companyId}`);
                            }
                            // Ensure we have a policy group before creating policy name
                            if (!policyGroupId) {
                                // Use the policy group name from Excel data, or create a default one
                                let policyGroup = null;
                                if (policy.policy_group_name) {
                                    const normalizedGroupName = policy.policy_group_name.toUpperCase();
                                    policyGroup = await prismaClient_1.default.policyGroup.findFirst({
                                        where: { name: { contains: normalizedGroupName } },
                                    });
                                }
                                if (!policyGroup) {
                                    const groupName = policy.policy_group_name ? policy.policy_group_name.toUpperCase() : `${company.name} Products`;
                                    policyGroup = await prismaClient_1.default.policyGroup.create({
                                        data: {
                                            name: groupName,
                                            description: `Policy group: ${groupName}`,
                                        },
                                    });
                                    console.log(`Created new policy group: ${policyGroup.name}`);
                                }
                                policyGroupId = policyGroup.id;
                            }
                            policyName = await prismaClient_1.default.policyName.create({
                                data: {
                                    name: policyNameValue,
                                    description: `Product: ${policyNameValue}`,
                                    policy_group_id: policyGroupId,
                                    company_id: companyId,
                                },
                            });
                            console.log(`Created new policy name: ${policyName.name}`);
                        }
                        catch (error) {
                            throw new Error(`Failed to create policy group/name for ${policyNameValue}: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
                        }
                    }
                    if (policyName) {
                        policyNameId = policyName.id;
                        if (!policyGroupId) {
                            policyGroupId = policyName.policy_group_id;
                        }
                        console.log(`Using policy name: ${policyName.name} for ${policyNameValue}`);
                    }
                }
                if (!policyNameId) {
                    console.log(`❌ [SERVICE] Policy name lookup failed - No policy_name_name or product_name found for policy ${policy.policy_number}`);
                    console.log(`❌ [SERVICE] Available policy fields:`, {
                        policy_name_name: policy.policy_name_name,
                        product_name: policy.product_name,
                        policyNameId: policyNameId
                    });
                    throw new Error(`No valid policy name ID for policy ${policy.policy_number}`);
                }
                // Convert file_url to relative_path in documents
                if (policy.documents && Array.isArray(policy.documents)) {
                    policy.documents = policy.documents.map((doc) => {
                        if (doc.file_url && !doc.relative_path) {
                            doc.relative_path = doc.file_url;
                            delete doc.file_url;
                        }
                        return doc;
                    });
                }
                // Convert file_url to relative_path in proposer documents
                if (policy.proposer?.documents && Array.isArray(policy.proposer.documents)) {
                    policy.proposer.documents = policy.proposer.documents.map((doc) => {
                        if (doc.file_url && !doc.relative_path) {
                            doc.relative_path = doc.file_url;
                            delete doc.file_url;
                        }
                        return doc;
                    });
                }
                // Convert file_url to relative_path in member documents
                if (policy.members && Array.isArray(policy.members)) {
                    policy.members = policy.members.map((member) => {
                        if (member.documents && Array.isArray(member.documents)) {
                            member.documents = member.documents.map((doc) => {
                                if (doc.file_url && !doc.relative_path) {
                                    doc.relative_path = doc.file_url;
                                    delete doc.file_url;
                                }
                                return doc;
                            });
                        }
                        return member;
                    });
                }
                const policyData = {
                    ...policy,
                    company_id: companyId,
                    policy_type_id: policyTypeId,
                    policy_name_id: policyNameId,
                    policy_group_id: policyGroupId,
                    created_by: userId,
                };
                // Wrap proposer data in create object for nested relation
                if (policyData.proposer) {
                    const proposerData = { ...policyData.proposer };
                    // Validate and filter insured_members
                    if (policyData.insured_members && Array.isArray(policyData.insured_members)) {
                        console.log(`🔍 [SERVICE] Processing insured_members for policy ${policyData.policy_number}:`, JSON.stringify(policyData.insured_members, null, 2));
                        const validMembers = policyData.insured_members.filter(isValidInsuredMember);
                        console.log(`🔍 [SERVICE] Valid members found:`, validMembers.length);
                        proposerData.insured_members = {
                            create: validMembers.map((member) => ({
                                ...member,
                                pre_existing: Boolean(member.pre_existing),
                                insured_member_medical_condition: Boolean(member.insured_member_medical_condition),
                                insured_member_medical_remarks: member.insured_member_medical_remarks === 'false' ? undefined : member.insured_member_medical_remarks,
                            })),
                        };
                        if (proposerData.insured_members.create.length === 0) {
                            console.warn(`No valid insured members for policy ${policyData.policy_number}`);
                            delete proposerData.insured_members;
                        }
                        else {
                            console.log(`✅ [SERVICE] Created ${proposerData.insured_members.create.length} insured members for policy ${policyData.policy_number}`);
                        }
                    }
                    else if (policyData.members && Array.isArray(policyData.members)) {
                        proposerData.insured_members = {
                            create: policyData.members.filter(isValidInsuredMember).map((member) => ({
                                ...member,
                                pre_existing: Boolean(member.pre_existing),
                                insured_member_medical_condition: Boolean(member.insured_member_medical_condition),
                                insured_member_medical_remarks: member.insured_member_medical_remarks === 'false' ? undefined : member.insured_member_medical_remarks,
                            })),
                        };
                        if (proposerData.insured_members.create.length === 0) {
                            console.warn(`No valid members for policy ${policyData.policy_number}`);
                            delete proposerData.insured_members;
                        }
                    }
                    policyData.proposer = {
                        create: proposerData,
                    };
                    // Remove from root level since they're now under proposer
                    delete policyData.insured_members;
                    delete policyData.members;
                }
                // Handle the case where members exist but no proposer
                if ((policyData.members && Array.isArray(policyData.members)) || (policyData.insured_members && Array.isArray(policyData.insured_members))) {
                    if (!policyData.proposer) {
                        console.warn('Members found without proposer - this may cause issues');
                        policyData.members = {
                            create: (policyData.insured_members || policyData.members).filter(isValidInsuredMember).map((member) => ({
                                ...member,
                                pre_existing: Boolean(member.pre_existing),
                                insured_member_medical_condition: Boolean(member.insured_member_medical_condition),
                                insured_member_medical_remarks: member.insured_member_medical_remarks === 'false' ? undefined : member.insured_member_medical_remarks,
                            })),
                        };
                        delete policyData.insured_members;
                        if (policyData.members.create.length === 0) {
                            console.warn(`No valid members for policy ${policyData.policy_number}`);
                            delete policyData.members;
                        }
                    }
                }
                // Validate and sanitize nominee_payment
                if (policyData.nominee_payment) {
                    const nomineePayment = policyData.nominee_payment;
                    console.log(`🔍 [SERVICE] Processing nominee payment for policy ${policyData.policy_number}:`, nomineePayment);
                    if (nomineePayment.payment_mode === 'false' || !nomineePayment.payment_mode) {
                        console.warn(`Invalid payment_mode for policy ${policyData.policy_number}, removing nominee_payment`);
                        delete policyData.nominee_payment;
                    }
                    else {
                        policyData.nominee_payment = {
                            create: {
                                payment_mode: nomineePayment.payment_mode,
                                nominee_name: nomineePayment.nominee_name || undefined,
                                nominee_salutation: nomineePayment.nominee_salutation || undefined,
                                nominee_relation: nomineePayment.nominee_relation || undefined,
                                nominee_dob: nomineePayment.nominee_dob || undefined,
                                payment_reference: nomineePayment.payment_reference || undefined,
                                bank_name: nomineePayment.bank_name || undefined,
                                bank_account_number: nomineePayment.bank_account_number || undefined,
                                bank_ifsc_code: nomineePayment.bank_ifsc_code || undefined,
                                bank_branch_name: nomineePayment.bank_branch_name || undefined,
                            },
                        };
                        console.log(`✅ [SERVICE] Created nominee payment data:`, policyData.nominee_payment.create);
                    }
                }
                // 👉 Calculate commission before creating policy (same as regular policy creation)
                // Create a proper data structure for commission calculation
                const commissionData = {
                    ...policyData,
                    proposer: policyData.proposer?.create || policyData.proposer
                };
                console.log(`[BULK IMPORT] Commission calculation for policy ${policyData.policy_number}:`, {
                    hasProposer: !!commissionData.proposer,
                    proposerDOB: commissionData.proposer?.date_of_birth,
                    policyNameId: commissionData.policy_name_id,
                    sumInsured: commissionData.sum_insured,
                    premiumAmount: commissionData.premium_amount,
                    proposerStructure: JSON.stringify(commissionData.proposer, null, 2)
                });
                await calculateAndSetCommission(commissionData);
                // Update the calculated commission amount back to the original data structure
                if (commissionData.calculated_commission_amount !== undefined) {
                    policyData.calculated_commission_amount = commissionData.calculated_commission_amount;
                    console.log(`[BULK IMPORT] Commission calculated for policy ${policyData.policy_number}: ${commissionData.calculated_commission_amount}`);
                }
                else {
                    console.log(`[BULK IMPORT] No commission calculated for policy ${policyData.policy_number}`);
                }
                console.log(`[BULK IMPORT] Final policy data for ${policyData.policy_number}:`, {
                    calculated_commission_amount: policyData.calculated_commission_amount,
                    premium_amount: policyData.premium_amount,
                    policy_name_id: policyData.policy_name_id
                });
                await policyRepository_1.policyRepository.bulkCreatePolicy(policyData);
                created.push(policy.policy_number || `row_${i + 2}`);
            }
            catch (error) {
                console.error(`Error creating policy at row ${i + 2} (policy_number: ${policy.policy_number}):`, error);
                failed.push({
                    row: i + 2,
                    error: error instanceof Error ? error.message : JSON.stringify(error),
                    policyData: JSON.stringify(policy, null, 2),
                });
            }
        }
        return { created, failed };
    },
    // Get all policies with search/filter support and pagination
    async getAllPolicies(query = {}) {
        const { search, type, policy_creation_status, page = 1, limit = 25, from, to } = query;
        const where = {};
        // Only show leaf policies (policies that have not been transitioned/renewed/porteded)
        // History of transitioned policies is shown in the policy history view
        where.children_policies = { none: {} };
        if (search) {
            const validTypes = ["HEALTH INSURANCE", "MOTOR INSURANCE", "LIFE INSURANCE"];
            const typeValue = search.toUpperCase().replace(/ /g, '_');
            const orFilters = [
                { policy_number: { contains: search } },
                { customer_name: { contains: search } },
                { company: { name: { contains: search } } },
                { proposer: { mobile: { contains: search } } }, // <-- Added mobile search
                { proposer: { email: { contains: search } } },
            ];
            if (validTypes.includes(typeValue)) {
                orFilters.push({ type: { equals: typeValue } });
            }
            where.OR = orFilters;
        }
        if (type && type !== "all") {
            where.type = type.toUpperCase().replace(/ /g, '_');
        }
        if (policy_creation_status && policy_creation_status !== "all") {
            where.policy_creation_status = policy_creation_status;
        }
        if (query.policy_group_id && query.policy_group_id !== "all") {
            where.policy_group_id = query.policy_group_id;
        }
        // --- Date range filter for start_date ---
        if (from || to) {
            where.start_date = {};
            if (from && !isNaN(Date.parse(from))) {
                where.start_date.gte = new Date(from);
            }
            if (to && !isNaN(Date.parse(to))) {
                where.start_date.lte = new Date(to);
            }
        }
        // --- End date range filter ---
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        const result = await policyRepository_1.policyRepository.getAllPolicies(where, skip, take);
        return {
            data: result.data,
            total: result.total,
            page: result.page,
            limit: result.limit,
            pages: result.pages,
        };
    },
    async getPolicyById(id) {
        return policyRepository_1.policyRepository.getPolicyById(id);
    },
    /**
     * ✅ ROBUST UPDATE POLICY - Handles insured member updates safely
     */
    async updatePolicy(id, data, files, userId) {
        console.log('🔄 Starting robust policy update...');
        // Debug incoming data
        console.log("🧾 [Service] Update Policy Input:", JSON.stringify({
            policyId: id,
            policy_number: data.policy_number,
            customer_name: data.customer_name,
            insured_members_count: data.insured_members?.length || data.members?.length || 0,
            removedDocumentIds: data.removedDocumentIds?.length || 0,
            insured_members_to_delete: data.insured_members_to_delete?.length || 0
        }, null, 2));
        console.log("📄 [Service] Update Files Received:", files ? Object.keys(files) : 'No files');
        // Get existing policy to validate structure
        const existingPolicy = await policyRepository_1.policyRepository.getPolicyById(id);
        if (!existingPolicy) {
            throw new Error('Policy not found');
        }
        console.log("📋 [Service] Existing Policy Structure:", {
            policyId: existingPolicy.id,
            proposerId: existingPolicy.proposer?.id,
            memberCount: existingPolicy.proposer?.insured_members?.length || 0,
            documentCount: existingPolicy.documents?.length || 0,
            proposerDocCount: existingPolicy.proposer?.documents?.length || 0,
            memberDocCount: existingPolicy.proposer?.insured_members?.reduce((total, member) => total + (member.documents?.length || 0), 0) || 0
        });
        // Process uploaded files (stored flat in policy-documents)
        const processedDocs = processUploadedFiles(files, userId);
        console.log("📄 [Service] Processed Update Documents:", {
            policyDocs: processedDocs.policyDocs.length,
            proposerDocs: processedDocs.proposerDocs.length,
            memberDocs: processedDocs.memberDocs.length
        });
        // Handle document deletions
        if (data.removedDocumentIds && data.removedDocumentIds.length > 0) {
            console.log("🗑️ [Service] Deleting Documents:", data.removedDocumentIds);
            await prismaClient_1.default.uploadedDocument.deleteMany({
                where: {
                    id: { in: data.removedDocumentIds }
                }
            });
        }
        // Handle member deletions
        const membersToDelete = data.members_to_delete || data.insured_members_to_delete || [];
        if (membersToDelete.length > 0) {
            console.log("🗑️ [Service] Deleting Members:", membersToDelete);
            // Delete member documents first
            await prismaClient_1.default.uploadedDocument.deleteMany({
                where: {
                    insured_member_id: { in: membersToDelete }
                }
            });
            // Delete members
            await prismaClient_1.default.insuredMember.deleteMany({
                where: {
                    id: { in: membersToDelete }
                }
            });
        }
        // Update core entities
        const updateData = { ...data };
        delete updateData.removedDocumentIds;
        delete updateData.members_to_delete;
        delete updateData.insured_members_to_delete;
        // Defensive: Merge with existing policy for full context
        const mergedData = { ...existingPolicy, ...updateData };
        // Recalculate commission if GST status changed or if not manually provided
        const gstStatusChanged = data.gst_status !== undefined && data.gst_status !== existingPolicy.gst_status;
        const premiumAmountChanged = data.premium_amount !== undefined && data.premium_amount !== existingPolicy.premium_amount;
        const shouldRecalculateCommission = data.calculated_commission_amount === undefined || gstStatusChanged || premiumAmountChanged;
        if (shouldRecalculateCommission) {
            console.log('[UpdatePolicy] Recalculating commission due to:', {
                noManualValue: data.calculated_commission_amount === undefined,
                gstStatusChanged,
                premiumAmountChanged,
                oldGstStatus: existingPolicy.gst_status,
                newGstStatus: data.gst_status,
                oldPremium: existingPolicy.premium_amount,
                newPremium: data.premium_amount,
            });
            await calculateAndSetCommission(mergedData);
            updateData.calculated_commission_amount = mergedData.calculated_commission_amount;
            updateData.commission_add_on_percentage = mergedData.commission_add_on_percentage;
        }
        if (typeof data.emi_amount !== 'undefined') {
            updateData.emi_amount = data.emi_amount;
        }
        if (typeof data.commission_add_on_percentage !== 'undefined') {
            updateData.commission_add_on_percentage = data.commission_add_on_percentage;
        }
        const result = await policyRepository_1.policyRepository.updatePolicy(id, updateData);
        console.log("✅ [Service] Core Entities Updated:", {
            policyId: result.id,
            proposerId: result.proposer?.id,
            memberCount: result.proposer?.insured_members?.length || 0
        });
        // Link new documents if any
        if (processedDocs.policyDocs.length > 0 || processedDocs.proposerDocs.length > 0 || processedDocs.memberDocs.length > 0) {
            const coreEntities = {
                policyId: id,
                proposerId: result.proposer?.id || '',
                insuredMemberIds: result.proposer?.insured_members?.map((m) => m.id) || [],
                nomineePaymentId: result.nominee_payment?.id,
            };
            console.log("🔗 [Service] Linking New Documents with Core Entities:", coreEntities);
            await this.linkDocuments(coreEntities, processedDocs);
        }
        // Fetch updated policy
        const updatedPolicy = await policyRepository_1.policyRepository.getPolicyById(id);
        console.log("✅ [Service] Final Updated Policy Result:", {
            policyId: updatedPolicy?.id,
            proposerId: updatedPolicy?.proposer?.id,
            memberCount: updatedPolicy?.proposer?.insured_members?.length || 0,
            documentCount: updatedPolicy?.documents?.length || 0,
            proposerDocCount: updatedPolicy?.proposer?.documents?.length || 0,
            memberDocCount: updatedPolicy?.proposer?.insured_members?.reduce((total, member) => total + (member.documents?.length || 0), 0) || 0
        });
        console.log('✅ Policy updated successfully with robust approach');
        return updatedPolicy;
    },
    async deletePolicy(id) {
        return policyRepository_1.policyRepository.deletePolicy(id);
    },
    async getPoliciesByUserId(userId) {
        return policyRepository_1.policyRepository.getPoliciesByUserId(userId);
    },
    // Dashboard stats can remain as is or be moved to the repository
    async getDashboardStats(timeRange) {
        // Check cache first
        const cacheKey = `dashboard:${timeRange}`;
        const cached = lruCache_1.dashboardCache.get(cacheKey);
        if (cached)
            return cached;
        // Calculate date filter based on timeRange (for trend charts only)
        let fromDate = undefined;
        const now = new Date();
        switch (timeRange) {
            case "1d":
                fromDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
                break;
            case "7d":
                fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case "24d":
                fromDate = new Date(now.getTime() - 24 * 24 * 60 * 60 * 1000);
                break;
            case "30d":
                fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case "1y":
                fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default: fromDate = undefined;
        }
        // No time filter for main summary stats - show actual totals
        // Only show leaf policies (policies that have not been transitioned/renewed/porteded)
        // This matches the logic used in the policy page
        const summaryWhere = { children_policies: { none: {} } };
        const renewalSummaryWhere = { ...summaryWhere, policy_creation_status: 'Renewal' };
        // Time filter only for distribution/charts
        // Also only show leaf policies for consistency with policy page
        const chartWhere = { children_policies: { none: {} } };
        if (fromDate) {
            chartWhere.created_at = { gte: fromDate };
        }
        const renewalChartWhere = { ...chartWhere, policy_creation_status: 'Renewal' };
        const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        // Run all independent queries in parallel for better performance
        const [totalActive, totalRenewal, companyDistributionRaw, policyTypeDistributionRaw, premiumStats, sumInsuredStats, planTypeDistribution, genderDistribution, proposers, allPoliciesWithDates] = await Promise.all([
            // Main summary stats - no time filter
            prismaClient_1.default.policy.count({ where: summaryWhere }),
            prismaClient_1.default.policy.count({ where: renewalSummaryWhere }),
            // Distribution/charts - with time filter
            prismaClient_1.default.policy.groupBy({
                by: ["company_id"],
                where: chartWhere,
                _count: { _all: true },
            }),
            prismaClient_1.default.policy.groupBy({
                by: ["policy_type_id"],
                where: chartWhere,
                _count: { _all: true }
            }),
            // Main summary stats - no time filter
            prismaClient_1.default.policy.aggregate({
                where: summaryWhere,
                _sum: { premium_amount: true },
                _avg: { premium_amount: true },
                _min: { premium_amount: true },
                _max: { premium_amount: true },
            }),
            prismaClient_1.default.policy.aggregate({
                where: summaryWhere,
                _sum: { sum_insured: true },
                _avg: { sum_insured: true },
                _min: { sum_insured: true },
                _max: { sum_insured: true },
            }),
            // Distribution/charts - with time filter
            prismaClient_1.default.policy.groupBy({
                by: ["plan_type"],
                where: chartWhere,
                _count: { _all: true },
            }),
            prismaClient_1.default.proposer.groupBy({
                by: ["gender"],
                where: {
                    policy: {
                        created_at: fromDate ? { gte: fromDate } : undefined,
                    },
                },
                _count: { _all: true },
            }),
            prismaClient_1.default.proposer.findMany({
                where: {
                    policy: {
                        created_at: fromDate ? { gte: fromDate } : undefined,
                    },
                },
                select: { date_of_birth: true },
            }),
            prismaClient_1.default.policy.findMany({
                where: {
                    created_at: {
                        gte: twelveMonthsAgo,
                        not: null,
                    },
                },
                select: { created_at: true },
            })
        ]);
        // Process company distribution
        const companyIds = companyDistributionRaw.map((c) => c.company_id).filter((id) => id !== null);
        const companies = await prismaClient_1.default.company.findMany({
            where: { id: { in: companyIds } },
            select: { id: true, name: true },
        });
        const companyDistribution = companyDistributionRaw.map((c) => ({
            company: companies.find((co) => co.id === c.company_id)?.name || "Unknown",
            count: c._count._all,
        }));
        // Process policy type distribution
        const policyTypeIds = policyTypeDistributionRaw.map(pt => pt.policy_type_id).filter((id) => id !== null);
        const policyTypes = await prismaClient_1.default.policyType.findMany({
            where: { id: { in: policyTypeIds } },
            select: { id: true, name: true }
        });
        const policyTypeDistribution = policyTypeDistributionRaw.map(pt => ({
            type: policyTypes.find(t => t.id === pt.policy_type_id)?.name || 'Unknown',
            count: pt._count._all
        }));
        // Process monthly trend
        const monthlyData = {};
        for (let i = 11; i >= 0; i--) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = monthDate.toISOString().slice(0, 7);
            monthlyData[monthKey] = 0;
        }
        const currentMonthKey = now.toISOString().slice(0, 7);
        if (!monthlyData.hasOwnProperty(currentMonthKey)) {
            monthlyData[currentMonthKey] = 0;
        }
        allPoliciesWithDates.forEach(policy => {
            if (policy.created_at) {
                const monthKey = policy.created_at.toISOString().slice(0, 7);
                if (monthlyData.hasOwnProperty(monthKey)) {
                    monthlyData[monthKey]++;
                }
            }
        });
        const monthlyTrendArray = Object.entries(monthlyData).map(([month, count]) => ({
            month,
            count
        }));
        // Process age groups
        const ageGroups = {
            "18-25": 0,
            "26-35": 0,
            "36-45": 0,
            "46-55": 0,
            "56-65": 0,
            "65+": 0,
        };
        proposers.forEach((proposer) => {
            if (proposer.date_of_birth) {
                const age = now.getFullYear() - proposer.date_of_birth.getFullYear();
                if (age >= 18 && age <= 25)
                    ageGroups["18-25"]++;
                else if (age >= 26 && age <= 35)
                    ageGroups["26-35"]++;
                else if (age >= 36 && age <= 45)
                    ageGroups["36-45"]++;
                else if (age >= 46 && age <= 55)
                    ageGroups["46-55"]++;
                else if (age >= 56 && age <= 65)
                    ageGroups["56-65"]++;
                else if (age > 65)
                    ageGroups["65+"]++;
            }
        });
        // Top performing companies by premium
        const topCompaniesByPremium = await prismaClient_1.default.policy.groupBy({
            by: ["company_id"],
            where: summaryWhere,
            _sum: { premium_amount: true },
        });
        const topCompanyIds = topCompaniesByPremium.map(c => c.company_id).filter((id) => id !== null);
        const topCompaniesData = await prismaClient_1.default.company.findMany({
            where: { id: { in: topCompanyIds } },
            select: { id: true, name: true }
        });
        const topCompaniesWithNames = topCompaniesByPremium.map(company => ({
            company: topCompaniesData.find(c => c.id === company.company_id)?.name || "Unknown",
            totalPremium: company._sum.premium_amount || 0,
        })).sort((a, b) => b.totalPremium - a.totalPremium).slice(0, 10);
        const ageGroupDistribution = Object.entries(ageGroups).map(([ageGroup, count]) => ({
            ageGroup,
            count
        }));
        const result = {
            totalActive,
            totalRenewal,
            companyDistribution,
            policyTypeDistribution: policyTypeDistribution.map((pt) => ({
                type: pt.type || 'Unknown',
                count: pt.count || 0,
            })),
            premiumStats: {
                total: premiumStats._sum.premium_amount || 0,
                average: premiumStats._avg.premium_amount || 0,
                min: premiumStats._min.premium_amount || 0,
                max: premiumStats._max.premium_amount || 0,
            },
            sumInsuredStats: {
                total: sumInsuredStats._sum.sum_insured || 0,
                average: sumInsuredStats._avg.sum_insured || 0,
                min: sumInsuredStats._min.sum_insured || 0,
                max: sumInsuredStats._max.sum_insured || 0,
            },
            monthlyTrend: monthlyTrendArray,
            planTypeDistribution: planTypeDistribution.map(pt => ({
                planType: pt.plan_type,
                count: pt._count._all,
            })),
            genderDistribution: genderDistribution.map(gd => ({
                gender: gd.gender,
                count: gd._count._all,
            })),
            ageGroupDistribution,
            topCompaniesByPremium: topCompaniesWithNames,
        };
        // Cache the result
        lruCache_1.dashboardCache.set(cacheKey, result);
        return result;
    },
    // Get document by ID
    async getDocumentById(documentId) {
        return policyRepository_1.policyRepository.getDocumentById(documentId);
    },
    async getDocumentMetadata(documentId) {
        const document = await policyRepository_1.policyRepository.getDocumentById(documentId);
        if (!document) {
            return null;
        }
        // Return document metadata for frontend to construct URL
        return {
            document_id: document.id,
            file_name: document.file_name,
            original_name: document.original_name,
            relative_path: document.relative_path,
            file_type: document.file_type,
            category: document.category,
            created_at: document.created_at
        };
    },
    // Delete document by ID
    async deleteDocument(documentId) {
        return policyRepository_1.policyRepository.deleteDocument(documentId);
    },
};
