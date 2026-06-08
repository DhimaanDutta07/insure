"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.policyService = void 0;
exports.calculateAndSetCommission = calculateAndSetCommission;
const fs_1 = require("fs");
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
// Helper function to process uploaded files - NON-BLOCKING async version
async function processUploadedFiles(files, uploadedBy) {
    const policyDocs = [];
    const proposerDocs = [];
    const memberDocs = [];
    if (!files) {
        console.log("📄 [FileProcessing] No files provided");
        return { policyDocs, proposerDocs, memberDocs };
    }
    // Collect all file read promises for parallel execution
    const fileReadPromises = [];
    // Process policy documents
    if (files.policyDocs && Array.isArray(files.policyDocs)) {
        for (const file of files.policyDocs) {
            fileReadPromises.push(fs_1.promises.readFile(file.path).then((data) => {
                policyDocs.push({
                    file_name: file.filename,
                    original_name: file.originalname,
                    relative_path: `/api/uploads/policy-documents/${file.filename}`,
                    file_data: data,
                    file_type: mapMimeTypeToFileType(file.mimetype),
                    category: client_1.DocumentCategory.POLICY_DOCUMENT,
                    uploaded_by: uploadedBy,
                });
            }));
        }
    }
    // Process proposer documents
    if (files.proposerDocs && Array.isArray(files.proposerDocs)) {
        for (const file of files.proposerDocs) {
            fileReadPromises.push(fs_1.promises.readFile(file.path).then((data) => {
                proposerDocs.push({
                    file_name: file.filename,
                    original_name: file.originalname,
                    relative_path: `/api/uploads/policy-documents/${file.filename}`,
                    file_data: data,
                    file_type: mapMimeTypeToFileType(file.mimetype),
                    category: client_1.DocumentCategory.PROPOSER_DOCUMENT,
                    uploaded_by: uploadedBy,
                });
            }));
        }
    }
    // Process member documents with index-based linking (legacy)
    if (files.memberDocs && Array.isArray(files.memberDocs)) {
        files.memberDocs.forEach((file, index) => {
            fileReadPromises.push(fs_1.promises.readFile(file.path).then((data) => {
                memberDocs.push({
                    file_name: file.filename,
                    original_name: file.originalname,
                    relative_path: `/api/uploads/policy-documents/${file.filename}`,
                    file_data: data,
                    file_type: mapMimeTypeToFileType(file.mimetype),
                    category: client_1.DocumentCategory.INSURED_MEMBER_DOCUMENT,
                    uploaded_by: uploadedBy,
                    member_index: index,
                });
            }));
        });
    }
    // Process member-specific documents with dynamic field names
    Object.entries(files).forEach(([fieldName, fileList]) => {
        if (fieldName.startsWith('memberDocs_') && Array.isArray(fileList)) {
            const memberIdOrIndex = fieldName.split('memberDocs_')[1];
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(memberIdOrIndex);
            const memberIndex = parseInt(memberIdOrIndex);
            for (const file of fileList) {
                fileReadPromises.push(fs_1.promises.readFile(file.path).then((data) => {
                    memberDocs.push({
                        file_name: file.filename,
                        original_name: file.originalname,
                        relative_path: `/api/uploads/policy-documents/${file.filename}`,
                        file_data: data,
                        file_type: mapMimeTypeToFileType(file.mimetype),
                        category: client_1.DocumentCategory.INSURED_MEMBER_DOCUMENT,
                        uploaded_by: uploadedBy,
                        member_index: isUUID ? undefined : memberIndex,
                        insured_member_id: isUUID ? memberIdOrIndex : undefined,
                    });
                }));
            }
        }
    });
    // Execute all file reads in parallel for maximum throughput
    await Promise.all(fileReadPromises);
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
 * Calculates and sets the commission amount on the policy input using CommissionRule logic.
 * Supports HDFC ERGO specific rules with product types and SI conditions.
 * Mutates policyInput.calculated_commission_amount in place.
 */
async function calculateAndSetCommission(policyInput) {
    console.log('[Commission] Starting commission calculation with input:', {
        hasPolicyInput: !!policyInput,
        hasPolicyNameId: !!policyInput?.policy_name_id,
        premiumAmount: policyInput?.premium_amount,
        sumInsured: policyInput?.sum_insured,
        gstStatus: policyInput?.gst_status,
        policyNameId: policyInput?.policy_name_id,
        policyStatus: policyInput?.policy_creation_status,
    });
    // Defensive: Only run if required fields are present
    if (!policyInput || !policyInput.policy_name_id || !policyInput.premium_amount) {
        policyInput.calculated_commission_amount = 0;
        policyInput.commission_add_on_percentage = 0;
        console.log('[Commission] Missing required fields, commission set to 0');
        return;
    }
    // Get the policy name to check if it's an HDFC ERGO product
    const policyName = await prismaClient_1.default.policyName.findUnique({
        where: { id: policyInput.policy_name_id },
        select: { name: true, company: { select: { name: true } } },
    });
    const productName = policyName?.name?.toUpperCase().trim() || '';
    const companyName = policyName?.company?.name?.trim() || '';
    console.log('[Commission] Raw product data:', {
        policyName: policyName?.name,
        companyName: policyName?.company?.name,
        productNameUpper: productName,
        companyNameTrimmed: companyName,
    });
    // If this is an HDFC ERGO product name, use the HDFC ERGO product ID for commission lookup
    const hdfcProducts = [
        'OPTIMA RESTORE',
        'OPTIMA SECURE',
        'OPTIMA SUPER SECURE',
        'ENERGY',
        'EASY HEALTH',
        'KOTI SURAKSHA',
        'IPA',
        'TRAVEL',
        'OTHERS',
        'STU',
        'PA',
        'SME',
    ];
    let effectivePolicyNameId = policyInput.policy_name_id;
    if (hdfcProducts.includes(productName)) {
        const hdfcCompany = await prismaClient_1.default.company.findFirst({
            where: { name: 'HDFC ERGO' },
        });
        if (hdfcCompany) {
            const hdfcProduct = await prismaClient_1.default.policyName.findFirst({
                where: {
                    company_id: hdfcCompany.id,
                    name: policyName?.name,
                },
            });
            if (hdfcProduct) {
                effectivePolicyNameId = hdfcProduct.id;
                console.log('[Commission] Using HDFC ERGO product ID for commission lookup:', {
                    originalId: policyInput.policy_name_id,
                    hdfcId: hdfcProduct.id,
                    productName: hdfcProduct.name,
                });
            }
        }
    }
    // Detect product type by name pattern
    const isOptimaSecure = productName.includes('OPTIMA SECURE');
    const isOtherRetailHealth = companyName === 'HDFC ERGO' && productName === 'OTHERS';
    const isSTU = companyName === 'HDFC ERGO' && productName === 'STU';
    const isPA = companyName === 'HDFC ERGO' && productName === 'PA';
    const isSME = companyName === 'HDFC ERGO' && productName === 'SME';
    const isTravel = companyName === 'HDFC ERGO' && productName === 'TRAVEL';
    const hasSIClassification = isOptimaSecure || isOtherRetailHealth;
    const hasStatusClassification = isOptimaSecure || isOtherRetailHealth || isSTU || isPA || isSME || isTravel;
    console.log('[Commission] Product classification:', {
        policyName: policyName?.name,
        company: companyName,
        isOptimaSecure,
        isOtherRetailHealth,
        isSTU,
        isPA,
        isSME,
        isTravel,
        hasSIClassification,
        hasStatusClassification,
        policy_creation_status: policyInput.policy_creation_status,
        sum_insured: policyInput.sum_insured,
        willUseSIPath: hasSIClassification,
        willUseStatusPath: hasStatusClassification,
    });
    let activeRule = null;
    if (hasStatusClassification) {
        // Products with status-based classification
        const policyStatus = policyInput.policy_creation_status || 'Fresh';
        // Map Migration (Internal Portability) to Portablity for commission lookup
        const statusForLookup = policyStatus === 'Migration' ? 'Portablity' : policyStatus;
        const whereClause = {
            policy_name_id: effectivePolicyNameId,
            is_active: true,
            policyStatus: statusForLookup,
        };
        console.log('[Commission] Status lookup:', { originalStatus: policyStatus, lookupStatus: statusForLookup });
        if (hasSIClassification) {
            // Products with SI classification (Optima Secure, Other Retail Health)
            const sumInsured = policyInput.sum_insured || 0;
            let siCondition = null;
            if (sumInsured > 0 && sumInsured < 1000000) {
                siCondition = 'LESS_THAN_10_LAKHS';
            }
            else if (sumInsured >= 1000000) {
                siCondition = 'GREATER_EQUAL_10_LAKHS';
            }
            else {
                // Default to LESS_THAN_10_LAKHS when sum_insured is 0 or undefined for SI-classified products
                siCondition = 'LESS_THAN_10_LAKHS';
            }
            console.log('[Commission] SI Classification:', { sumInsured, siCondition });
            whereClause.siCondition = siCondition;
            console.log('[Commission] Searching for rule with SI:', whereClause);
            activeRule = await prismaClient_1.default.commissionRule.findFirst({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
            });
            console.log('[Commission] Found rule with SI:', activeRule?.id, activeRule?.commissionPercent);
            // Fallback to null SI condition if no match
            if (!activeRule && siCondition !== null) {
                console.log('[Commission] No rule found with SI, trying without SI');
                whereClause.siCondition = null;
                activeRule = await prismaClient_1.default.commissionRule.findFirst({
                    where: whereClause,
                    orderBy: { createdAt: 'desc' },
                });
                console.log('[Commission] Found rule without SI:', activeRule?.id, activeRule?.commissionPercent, 'Status:', activeRule?.policyStatus);
            }
        }
        else {
            // Products without SI classification (STU, PA, SME, Travel)
            console.log('[Commission] Searching for rule without SI:', whereClause);
            activeRule = await prismaClient_1.default.commissionRule.findFirst({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
            });
            console.log('[Commission] Found rule without SI:', activeRule?.id, activeRule?.commissionPercent, 'Status:', activeRule?.policyStatus);
        }
    }
    else {
        // Products without any classification (simple lookup with status)
        const policyStatus = policyInput.policy_creation_status || 'Fresh';
        const statusForLookup = policyStatus === 'Migration' ? 'Portablity' : policyStatus;
        activeRule = await prismaClient_1.default.commissionRule.findFirst({
            where: {
                policy_name_id: effectivePolicyNameId,
                is_active: true,
                policyStatus: statusForLookup,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    // Final fallback: any active rule for this policy with the same status
    if (!activeRule) {
        const policyStatus = policyInput.policy_creation_status || 'Fresh';
        const statusForLookup = policyStatus === 'Migration' ? 'Portablity' : policyStatus;
        activeRule = await prismaClient_1.default.commissionRule.findFirst({
            where: {
                policy_name_id: effectivePolicyNameId,
                is_active: true,
                policyStatus: statusForLookup,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    console.log('[Commission] CommissionRule lookup:', {
        policy_name_id: effectivePolicyNameId,
        matchedRuleId: activeRule?.id,
        commissionPercent: activeRule?.commissionPercent,
    });
    let basePercent = 0;
    if (!activeRule) {
        // No commission rule found - check if Renewal status, default to 15%
        if (policyInput.policy_creation_status === 'Renewal') {
            basePercent = 15.0;
            console.log('[Commission] No commission rule found for Renewal, using default 15%');
        }
        else {
            // No commission rule found - set commission to 0 (no error thrown)
            policyInput.calculated_commission_amount = 0;
            policyInput.commission_add_on_percentage = 0;
            policyInput._commissionPercent = 0;
            policyInput._commissionRuleId = null;
            console.log('[Commission] No commission rule found for product, commission set to 0');
            return;
        }
    }
    else {
        // Calculate commission based on CommissionRule percentage
        basePercent = activeRule.commissionPercent || 0;
    }
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
    // ✅ Deductible Amount Status Logic: If Deductible Amount Status is ON, increase commission by 2%
    let finalPercent = basePercent;
    if (policyInput.deductible_amount_status === true) {
        finalPercent = basePercent + 2;
        console.log('[Commission] Deductible Amount Status ON - Increasing commission by 2%:', {
            originalPercent: basePercent,
            finalPercent: finalPercent,
        });
    }
    policyInput.calculated_commission_amount = (premiumForCommission * finalPercent) / 100;
    policyInput.commission_add_on_percentage = finalPercent;
    policyInput._commissionPercent = finalPercent;
    policyInput._commissionRuleId = activeRule?.id || null;
    console.log('[Commission] Commission calculated successfully:', {
        commissionPercent: finalPercent,
        calculatedAmount: policyInput.calculated_commission_amount,
        gstStatus: policyInput.gst_status,
        deductibleStatus: policyInput.deductible_amount_status,
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
        // Process uploaded files (stored flat in policy-documents) - NON-BLOCKING
        const processedDocs = await processUploadedFiles(files, userId);
        console.log("📄 [Service] Processed Documents:", {
            policyDocs: processedDocs.policyDocs.length,
            proposerDocs: processedDocs.proposerDocs.length,
            memberDocs: processedDocs.memberDocs.length
        });
        try {
            // Pre-calculate commission before transaction to save DB round-trips
            await calculateAndSetCommission(data);
            // Phase 1: Create core entities (commission already baked into data)
            const coreEntities = await this.createCoreEntities(data);
            console.log("✅ [Service] Phase 1 Complete - Core Entities:", {
                policyId: coreEntities.policyId,
                proposerId: coreEntities.proposerId,
                insuredMemberIds: coreEntities.insuredMemberIds,
                nomineePaymentId: coreEntities.nomineePaymentId,
                commission: data.calculated_commission_amount,
            });
            // Phase 2: Link documents
            await this.linkDocuments(coreEntities, processedDocs);
            // Return lightweight result instead of heavy full-fetch
            const result = {
                id: coreEntities.policyId,
                policy_number: data.policy_number,
                customer_name: data.customer_name,
                premium_amount: data.premium_amount,
                sum_insured: data.sum_insured,
                plan_type: data.plan_type,
                policy_creation_status: data.policy_creation_status,
                calculated_commission_amount: data.calculated_commission_amount,
                commission_add_on_percentage: data.commission_add_on_percentage,
                created_at: new Date(),
                proposer: {
                    id: coreEntities.proposerId,
                    full_name: data.proposer?.full_name,
                    mobile: data.proposer?.mobile,
                },
            };
            // Invalidate caches
            lruCache_1.policyListCache.deleteByPrefix('policies:');
            lruCache_1.dashboardCache.deleteByPrefix('dashboard:');
            console.log('✅ Policy created successfully with optimized approach');
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
        const { search, type, policy_creation_status, page = 1, limit = 25, from, to, policy_group_id } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        // Cache key for unfiltered policy lists (most common case)
        const cacheKey = `policies:${search || 'all'}:${type || 'all'}:${policy_creation_status || 'all'}:${policy_group_id || 'all'}:${from || 'all'}:${to || 'all'}:${page}:${limit}`;
        const cached = lruCache_1.policyListCache.get(cacheKey);
        if (cached)
            return cached;
        // Use ultra-optimized raw SQL for sub-second list loading
        const result = await policyRepository_1.policyRepository.getAllPoliciesRaw(search, type ? type.toUpperCase().replace(/ /g, '_') : undefined, policy_creation_status, policy_group_id, from, to, skip, take);
        // Cache unfiltered/small searches for 1 minute
        if (!search || search.length < 3) {
            lruCache_1.policyListCache.set(cacheKey, result);
        }
        return result;
    },
    async getPolicyById(id) {
        const cacheKey = `policy:${id}`;
        const cached = lruCache_1.policyListCache.get(cacheKey);
        if (cached)
            return cached;
        const result = await policyRepository_1.policyRepository.getPolicyById(id);
        lruCache_1.policyListCache.set(cacheKey, result, 60000);
        return result;
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
        // Process uploaded files (stored flat in policy-documents) - NON-BLOCKING
        const processedDocs = await processUploadedFiles(files, userId);
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
        // Invalidate caches
        lruCache_1.policyListCache.delete(`policy:${id}`);
        lruCache_1.policyListCache.deleteByPrefix('policies:');
        lruCache_1.dashboardCache.deleteByPrefix('dashboard:');
        console.log('✅ Policy updated successfully with robust approach');
        return updatedPolicy;
    },
    async deletePolicy(id) {
        const result = await policyRepository_1.policyRepository.deletePolicy(id);
        lruCache_1.policyListCache.delete(`policy:${id}`);
        lruCache_1.policyListCache.deleteByPrefix('policies:');
        lruCache_1.dashboardCache.deleteByPrefix('dashboard:');
        return result;
    },
    async getPoliciesByUserId(userId) {
        return policyRepository_1.policyRepository.getPoliciesByUserId(userId);
    },
    // ULTRA-OPTIMIZED dashboard stats using single raw SQL query
    async getDashboardStats(timeRange) {
        // Check cache first
        const cacheKey = `dashboard:${timeRange}`;
        const cached = lruCache_1.dashboardCache.get(cacheKey);
        if (cached)
            return cached;
        const now = new Date();
        let fromDate = new Date(0);
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
            default: fromDate = new Date(0);
        }
        const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        // Single raw SQL query that aggregates everything in the database
        const rawResult = await prismaClient_1.default.$queryRaw `
      WITH 
      leaf_policies AS (
        SELECT * FROM "policy" p
        WHERE NOT EXISTS (SELECT 1 FROM "policy" child WHERE child."parent_policy_id" = p.id)
      ),
      chart_policies AS (
        SELECT * FROM leaf_policies
        WHERE "created_at" >= ${fromDate}
      ),
      summary_stats AS (
        SELECT 
          COUNT(*)::int as total_active,
          COUNT(*) FILTER (WHERE "policy_creation_status" = 'Renewal')::int as total_renewal,
          COALESCE(SUM("premium_amount"), 0)::float as premium_total,
          COALESCE(AVG("premium_amount"), 0)::float as premium_avg,
          COALESCE(MIN("premium_amount"), 0)::float as premium_min,
          COALESCE(MAX("premium_amount"), 0)::float as premium_max,
          COALESCE(SUM("sum_insured"), 0)::float as si_total,
          COALESCE(AVG("sum_insured"), 0)::float as si_avg,
          COALESCE(MIN("sum_insured"), 0)::float as si_min,
          COALESCE(MAX("sum_insured"), 0)::float as si_max
        FROM leaf_policies
      ),
      company_dist AS (
        SELECT c.name as company, COUNT(*)::int as count
        FROM chart_policies cp
        LEFT JOIN "company" c ON cp."company_id" = c.id
        WHERE cp."company_id" IS NOT NULL
        GROUP BY c.name
      ),
      policy_type_dist AS (
        SELECT pt.name as type, COUNT(*)::int as count
        FROM chart_policies cp
        LEFT JOIN "policy_types" pt ON cp."policy_type_id" = pt.id
        WHERE cp."policy_type_id" IS NOT NULL
        GROUP BY pt.name
      ),
      plan_type_dist AS (
        SELECT "plan_type" as plan, COUNT(*)::int as count
        FROM chart_policies
        WHERE "plan_type" IS NOT NULL
        GROUP BY "plan_type"
      ),
      gender_dist AS (
        SELECT pr.gender, COUNT(*)::int as count
        FROM chart_policies cp
        JOIN "proposers" pr ON cp.id = pr."policy_id"
        WHERE pr.gender IS NOT NULL
        GROUP BY pr.gender
      ),
      age_groups AS (
        SELECT 
          CASE
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, pr."date_of_birth")) BETWEEN 18 AND 25 THEN '18-25'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, pr."date_of_birth")) BETWEEN 26 AND 35 THEN '26-35'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, pr."date_of_birth")) BETWEEN 36 AND 45 THEN '36-45'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, pr."date_of_birth")) BETWEEN 46 AND 55 THEN '46-55'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, pr."date_of_birth")) BETWEEN 56 AND 65 THEN '56-65'
            ELSE '65+'
          END as age_group,
          COUNT(*)::int as count
        FROM chart_policies cp
        JOIN "proposers" pr ON cp.id = pr."policy_id"
        WHERE pr."date_of_birth" IS NOT NULL
        GROUP BY 1
      ),
      top_companies AS (
        SELECT c.name as company, COALESCE(SUM(p."premium_amount"), 0)::float as total_premium
        FROM "policy" p
        LEFT JOIN "company" c ON p."company_id" = c.id
        WHERE p."company_id" IS NOT NULL
        GROUP BY c.name
        ORDER BY total_premium DESC
        LIMIT 10
      ),
      monthly_trend AS (
        SELECT TO_CHAR("created_at", 'YYYY-MM') as month, COUNT(*)::int as count
        FROM "policy"
        WHERE "created_at" >= ${twelveMonthsAgo}
        GROUP BY 1
        ORDER BY 1
      )
      SELECT 
        (SELECT total_active FROM summary_stats) as total_active,
        (SELECT total_renewal FROM summary_stats) as total_renewal,
        (SELECT premium_total FROM summary_stats) as premium_total,
        (SELECT premium_avg FROM summary_stats) as premium_avg,
        (SELECT premium_min FROM summary_stats) as premium_min,
        (SELECT premium_max FROM summary_stats) as premium_max,
        (SELECT si_total FROM summary_stats) as si_total,
        (SELECT si_avg FROM summary_stats) as si_avg,
        (SELECT si_min FROM summary_stats) as si_min,
        (SELECT si_max FROM summary_stats) as si_max,
        COALESCE((SELECT json_agg(json_build_object('company', company, 'count', count)) FROM company_dist), '[]') as company_distribution,
        COALESCE((SELECT json_agg(json_build_object('type', type, 'count', count)) FROM policy_type_dist), '[]') as policy_type_distribution,
        COALESCE((SELECT json_agg(json_build_object('planType', plan, 'count', count)) FROM plan_type_dist), '[]') as plan_type_distribution,
        COALESCE((SELECT json_agg(json_build_object('gender', gender, 'count', count)) FROM gender_dist), '[]') as gender_distribution,
        COALESCE((SELECT json_agg(json_build_object('ageGroup', age_group, 'count', count)) FROM age_groups), '[]') as age_group_distribution,
        COALESCE((SELECT json_agg(json_build_object('company', company, 'totalPremium', total_premium)) FROM top_companies), '[]') as top_companies,
        COALESCE((SELECT json_agg(json_build_object('month', month, 'count', count)) FROM monthly_trend), '[]') as monthly_trend
    `;
        const row = rawResult[0];
        // Build full 12-month trend with zero-filled months
        const monthlyData = {};
        for (let i = 11; i >= 0; i--) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            monthlyData[monthDate.toISOString().slice(0, 7)] = 0;
        }
        const currentMonthKey = now.toISOString().slice(0, 7);
        if (!monthlyData.hasOwnProperty(currentMonthKey))
            monthlyData[currentMonthKey] = 0;
        if (row.monthly_trend && Array.isArray(row.monthly_trend)) {
            row.monthly_trend.forEach((item) => {
                if (monthlyData.hasOwnProperty(item.month)) {
                    monthlyData[item.month] = item.count;
                }
            });
        }
        const result = {
            totalActive: Number(row.total_active) || 0,
            totalRenewal: Number(row.total_renewal) || 0,
            companyDistribution: row.company_distribution || [],
            policyTypeDistribution: (row.policy_type_distribution || []).map((pt) => ({
                type: pt.type || 'Unknown',
                count: pt.count || 0,
            })),
            premiumStats: {
                total: Number(row.premium_total) || 0,
                average: Number(row.premium_avg) || 0,
                min: Number(row.premium_min) || 0,
                max: Number(row.premium_max) || 0,
            },
            sumInsuredStats: {
                total: Number(row.si_total) || 0,
                average: Number(row.si_avg) || 0,
                min: Number(row.si_min) || 0,
                max: Number(row.si_max) || 0,
            },
            monthlyTrend: Object.entries(monthlyData).map(([month, count]) => ({ month, count })),
            planTypeDistribution: (row.plan_type_distribution || []).map((pt) => ({
                planType: pt.planType,
                count: pt.count || 0,
            })),
            genderDistribution: (row.gender_distribution || []).map((gd) => ({
                gender: gd.gender,
                count: gd.count || 0,
            })),
            ageGroupDistribution: row.age_group_distribution || [],
            topCompaniesByPremium: (row.top_companies || []).map((tc) => ({
                company: tc.company,
                totalPremium: Number(tc.totalPremium) || 0,
            })),
        };
        // Cache the result for 5 minutes
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
