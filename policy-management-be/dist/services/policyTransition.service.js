"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicyTransitionService = void 0;
const documentAccess_service_1 = require("./documentAccess.service");
const prismaClient_1 = __importDefault(require("../utils/prismaClient"));
const lruCache_1 = require("../utils/lruCache");
// Helper function to calculate commission for a policy based on its term
async function calculateCommissionForPolicy(policy) {
    try {
        // Import the commission calculation function
        const { calculateAndSetCommission } = await Promise.resolve().then(() => __importStar(require('./policy.service')));
        // Create policy input for commission calculation
        const policyInput = {
            policy_name_id: policy.policy_name_id,
            policy_creation_status: policy.policy_creation_status || 'Fresh',
            sum_insured: policy.sum_insured || 0,
            premium_amount: policy.premium_amount,
            gst_status: policy.gst_status, // stored value; calculateAndSetCommission overrides with date-based
            deductible_amount_status: policy.deductible_amount_status,
            // Add term dates for proper calculation
            start_date: policy.start_date,
            end_date: policy.end_date,
        };
        // Calculate commission
        await calculateAndSetCommission(policyInput);
        return {
            calculated_commission_amount: policyInput.calculated_commission_amount || 0,
            commission_add_on_percentage: policyInput.commission_add_on_percentage || 0,
            gst_status: policy.gst_status || false,
        };
    }
    catch (error) {
        return {
            calculated_commission_amount: 0,
            commission_add_on_percentage: 0,
            gst_status: policy.gst_status || false,
        };
    }
}
class PolicyTransitionService {
    static async createPolicyTransition(parentPolicyId, transitionType, newPolicyData) {
        const result = {
            newPolicy: null,
            documentReferences: [],
            memberReferences: [],
            errors: []
        };
        try {
            // 1. Get parent policy with all related data
            const parentPolicy = await prismaClient_1.default.policy.findUnique({
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
            // 2. Create NEW policy for ALL transitions (Renewal, Portablity, Migration)
            // This ensures a proper parent-child chain and full history
            const newPolicy = await this.createPolicyWithCarriedOverData(parentPolicy, newPolicyData);
            result.newPolicy = newPolicy;
            // 3. Mark old policy as INACTIVE AND set transition + commission on new policy in parallel
            const creationStatus = this.getPolicyCreationStatus(transitionType);
            const [updatedNewPolicy] = await Promise.all([
                // Set transition relationship and initial commission on new policy
                prismaClient_1.default.policy.update({
                    where: { id: newPolicy.id },
                    data: {
                        parent_policy_id: parentPolicyId,
                        transition_type: transitionType,
                        policy_creation_status: creationStatus,
                    }
                }),
                // Mark old policy as INACTIVE
                prismaClient_1.default.policy.update({
                    where: { id: parentPolicyId },
                    data: { status: 'INACTIVE' }
                }),
            ]);
            result.newPolicy = { ...newPolicy, ...updatedNewPolicy };
            // 4. Recalculate commission + process documents + create document references
            // Run in background — response sent immediately
            this.completeTransitionAsync(newPolicy, parentPolicyId, creationStatus, transitionType);
            // 5. Clear all relevant caches for instant UI refresh
            documentAccess_service_1.DocumentAccessService.clearCache(parentPolicyId);
            documentAccess_service_1.DocumentAccessService.clearCache(newPolicy.id);
            lruCache_1.policyListCache.delete(`policy:${parentPolicyId}`);
            lruCache_1.policyListCache.deleteByPrefix('policies:');
            lruCache_1.dashboardCache.deleteByPrefix('dashboard:');
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            result.errors.push(`Failed to create policy transition: ${errorMessage}`);
        }
        return result;
    }
    static getPolicyCreationStatus(transitionType) {
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
    static async completeTransitionAsync(newPolicy, parentPolicyId, creationStatus, transitionType) {
        // 1. Recalculate commission
        try {
            newPolicy.policy_creation_status = creationStatus;
            const commissionResult = await calculateCommissionForPolicy(newPolicy);
            await prismaClient_1.default.policy.update({
                where: { id: newPolicy.id },
                data: {
                    calculated_commission_amount: commissionResult.calculated_commission_amount,
                    commission_add_on_percentage: commissionResult.commission_add_on_percentage,
                },
            });
            console.log(`[Transition] Commission recalculated for new policy ${newPolicy.id}: ${commissionResult.calculated_commission_amount} (${commissionResult.commission_add_on_percentage}%)`);
        }
        catch (error) {
            console.error(`[Transition] Error recalculating commission for new policy ${newPolicy.id}:`, error);
        }
        // 2. Create document references (not copies)
        try {
            await this.createDocumentReferences(parentPolicyId, newPolicy.id, transitionType);
        }
        catch (error) {
            console.error(`[Transition] Error creating document references for new policy ${newPolicy.id}:`, error);
        }
    }
    static async updatePolicyForPortability(parentPolicy, newPolicyData, transitionType) {
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
        const updatedPolicy = await prismaClient_1.default.policy.update({
            where: { id: parentPolicy.id },
            data: processedData
        });
        return updatedPolicy;
    }
    static async createPolicyWithCarriedOverData(parentPolicy, newPolicyData) {
        // Extract documents for separate processing after policy creation
        const documentsToProcess = newPolicyData.documents;
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
            deductible_amount_status: typeof newPolicyData.deductible_amount_status === 'string'
                ? newPolicyData.deductible_amount_status === 'true' || newPolicyData.deductible_amount_status === '1'
                : (newPolicyData.deductible_amount_status !== undefined ? newPolicyData.deductible_amount_status : parentPolicy.deductible_amount_status || false),
            gst_status: typeof newPolicyData.gst_status === 'string'
                ? newPolicyData.gst_status === 'true' || newPolicyData.gst_status === '1'
                : (newPolicyData.gst_status !== undefined ? newPolicyData.gst_status : parentPolicy.gst_status || false),
            declaration_accepted: newPolicyData.declaration_accepted !== undefined ? newPolicyData.declaration_accepted : parentPolicy.declaration_accepted || false,
            // Carry over financial fields from parent if not provided
            emi_amount: newPolicyData.emi_amount || parentPolicy.emi_amount || null,
            commission_add_on_percentage: newPolicyData.commission_add_on_percentage || parentPolicy.commission_add_on_percentage || null,
            calculated_commission_amount: newPolicyData.calculated_commission_amount || parentPolicy.calculated_commission_amount || null,
        };
        // Remove documents from createData - they will be processed separately
        delete processedData.documents;
        delete processedData.members; // Members are also handled separately
        // Create the new policy with all carried over data
        const createData = {
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
                create: parentPolicy.form_values.map((formValue) => ({
                    field_name: formValue.field_name || '',
                    value: formValue.value || '',
                }))
            };
        }
        // First create the policy with proposer, nominee, and form values
        const newPolicy = await prismaClient_1.default.policy.create({
            data: createData,
            include: {
                proposer: true,
                nominee_payment: true,
                form_values: true
            }
        });
        // Handle members: use provided members from newPolicyData, or carry over from parent
        let membersToCreate = [];
        if (newPolicyData.members && Array.isArray(newPolicyData.members) && newPolicyData.members.length > 0) {
            // Use the members provided in the transition data (for all transition types with member management)
            membersToCreate = newPolicyData.members.map((member) => ({
                policy_id: newPolicy.id,
                proposer_id: newPolicy.proposer.id,
                insured_member_salutation: member.insured_member_salutation || null,
                name: member.name || '',
                relation_to_proposer: member.relation_to_proposer || null,
                date_of_birth: member.date_of_birth ? new Date(member.date_of_birth) : null,
                gender: member.gender || null,
                pre_existing: member.pre_existing || false,
                insured_member_medical_condition: member.insured_member_medical_condition || false,
                insured_member_medical_remarks: member.insured_member_medical_remarks || null,
            }));
        }
        else if (parentPolicy.members && parentPolicy.members.length > 0 && newPolicy.proposer) {
            // Carry over members from parent policy (default behavior)
            membersToCreate = parentPolicy.members.map((member) => ({
                policy_id: newPolicy.id,
                proposer_id: newPolicy.proposer.id,
                insured_member_salutation: member.insured_member_salutation || null,
                name: member.name || '',
                relation_to_proposer: member.relation_to_proposer || null,
                date_of_birth: member.date_of_birth || null,
                gender: member.gender || null,
                pre_existing: member.pre_existing || false,
                insured_member_medical_condition: member.insured_member_medical_condition || false,
                insured_member_medical_remarks: member.insured_member_medical_remarks || null,
            }));
        }
        // Create members if any exist
        if (membersToCreate.length > 0) {
            await prismaClient_1.default.insuredMember.createMany({
                data: membersToCreate
            });
        }
        // Process uploaded documents synchronously — file_data must be stored in DB for Vercel
        if (documentsToProcess && Array.isArray(documentsToProcess) && documentsToProcess.length > 0) {
            const fs = require('fs').promises;
            const { DocumentCategory } = require('@prisma/client');
            const mimeMap = {
                'application/pdf': 'PDF', 'image/jpeg': 'IMAGE', 'image/jpg': 'IMAGE',
                'image/png': 'IMAGE', 'application/msword': 'DOC',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
                'application/vnd.ms-excel': 'XLS', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
                'text/csv': 'CSV',
            };
            // Parallel file reads — avoids sequential bottleneck
            const docResults = await Promise.all(documentsToProcess.map(async (doc) => {
                try {
                    const fileData = await fs.readFile(doc.path);
                    return {
                        file_name: doc.filename, original_name: doc.originalname,
                        relative_path: `/api/uploads/policy-documents/${doc.filename}`,
                        file_data: fileData, file_type: mimeMap[doc.mimetype] || 'OTHER',
                        category: DocumentCategory.POLICY_DOCUMENT, uploaded_by: 'system',
                        policy_id: newPolicy.id,
                    };
                }
                catch (error) {
                    console.error(`Failed to read file ${doc.filename}:`, error);
                    return null;
                }
            }));
            const processedDocs = docResults.filter(d => d !== null);
            if (processedDocs.length > 0) {
                await prismaClient_1.default.uploadedDocument.createMany({ data: processedDocs });
            }
        }
        // Get members for the response
        const members = await prismaClient_1.default.insuredMember.findMany({
            where: { policy_id: newPolicy.id }
        });
        return { ...newPolicy, members };
    }
    static async createPolicy(policyData) {
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
        return await prismaClient_1.default.policy.create({
            data: processedData,
            include: {
                proposer: true,
                members: true,
                nominee_payment: true,
                documents: true
            }
        });
    }
    static async createDocumentReferences(parentPolicyId, newPolicyId, transitionType) {
        // Get all ancestor policies recursively
        const ancestorPolicies = await this.getAllAncestorPolicies(parentPolicyId);
        // Collect ALL documents from all ancestor policies
        const allAncestorDocuments = [];
        for (const ancestorPolicy of ancestorPolicies) {
            // 1. Direct policy documents
            if (ancestorPolicy.documents) {
                allAncestorDocuments.push(...ancestorPolicy.documents.map((doc) => ({
                    ...doc,
                    source_policy_id: ancestorPolicy.id,
                    source_policy_number: ancestorPolicy.policy_number
                })));
            }
            // 2. Proposer documents
            if (ancestorPolicy.proposer?.documents) {
                allAncestorDocuments.push(...ancestorPolicy.proposer.documents.map((doc) => ({
                    ...doc,
                    source_policy_id: ancestorPolicy.id,
                    source_policy_number: ancestorPolicy.policy_number
                })));
            }
            // 3. Member documents
            if (ancestorPolicy.proposer?.insured_members) {
                ancestorPolicy.proposer.insured_members.forEach((member) => {
                    if (member.documents) {
                        allAncestorDocuments.push(...member.documents.map((doc) => ({
                            ...doc,
                            source_policy_id: ancestorPolicy.id,
                            source_policy_number: ancestorPolicy.policy_number,
                            source_member_id: member.id
                        })));
                    }
                });
            }
        }
        // Filter documents based on transition type
        const documentsToReference = this.filterDocumentsByTransitionType(allAncestorDocuments, transitionType);
        // Create references in batch for efficiency
        const referenceData = documentsToReference.map(doc => ({
            policy_id: newPolicyId,
            source_document_id: doc.id,
            transition_type: transitionType,
            can_edit: false,
            can_delete: true // Allow users to remove references if not needed
        }));
        const createdRefs = await prismaClient_1.default.policyDocumentReference.createMany({
            data: referenceData,
            skipDuplicates: true
        });
        // Return the created references
        return await prismaClient_1.default.policyDocumentReference.findMany({
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
     * Recursively get all ancestor policies with FULL document tree.
     * Used by createDocumentReferences and getDocumentTransferStats.
     */
    static async getAllAncestorPolicies(policyId, maxDepth = 5) {
        const ancestors = [];
        let currentPolicyId = policyId;
        let depth = 0;
        while (currentPolicyId && depth < maxDepth) {
            const policy = await prismaClient_1.default.policy.findUnique({
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
                break;
            }
            ancestors.push(policy);
            // Move to parent policy
            currentPolicyId = policy.parent_policy_id || '';
            depth++;
        }
        return ancestors;
    }
    /**
     * Lightweight ancestor fetch for history display (no documents).
     * OPTIMIZED: Uses single recursive query instead of N+1 loop.
     */
    static async getAllAncestorPoliciesLightweight(policyId, maxDepth = 5) {
        // Use a single query with parent_policy_id chain to fetch all ancestors
        // This is much faster than N+1 queries in a loop
        const policies = await prismaClient_1.default.policy.findMany({
            where: {
                id: policyId,
            },
            select: {
                id: true,
                policy_number: true,
                policy_creation_status: true,
                transition_type: true,
                created_at: true,
                parent_policy_id: true,
                start_date: true,
                end_date: true,
                premium_amount: true,
                sum_insured: true,
                deductible_amount: true,
                deductible_amount_status: true,
                policy_name_id: true,
                calculated_commission_amount: true,
                commission_add_on_percentage: true,
                gst_status: true,
                company: { select: { id: true, name: true } },
                policyName: { select: { id: true, name: true } },
                documents: {
                    select: {
                        id: true,
                        file_name: true,
                        original_name: true,
                        file_type: true,
                        category: true,
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
                        insured_members: {
                            select: {
                                id: true,
                                name: true,
                                date_of_birth: true,
                                gender: true,
                                relation_to_proposer: true,
                                insured_member_salutation: true,
                                pre_existing: true,
                                insured_member_medical_condition: true,
                                insured_member_medical_remarks: true,
                            },
                            orderBy: { created_at: 'asc' },
                        },
                    },
                },
                parent_policy: {
                    select: {
                        id: true,
                        policy_number: true,
                        policy_creation_status: true,
                        transition_type: true,
                        created_at: true,
                        parent_policy_id: true,
                        start_date: true,
                        end_date: true,
                        premium_amount: true,
                        sum_insured: true,
                        deductible_amount: true,
                        deductible_amount_status: true,
                        policy_name_id: true,
                        calculated_commission_amount: true,
                        commission_add_on_percentage: true,
                        gst_status: true,
                        company: { select: { id: true, name: true } },
                        policyName: { select: { id: true, name: true } },
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
                                insured_members: {
                                    select: {
                                        id: true,
                                        name: true,
                                        date_of_birth: true,
                                        gender: true,
                                        relation_to_proposer: true,
                                        insured_member_salutation: true,
                                        pre_existing: true,
                                        insured_member_medical_condition: true,
                                        insured_member_medical_remarks: true,
                                    },
                                    orderBy: { created_at: 'asc' },
                                },
                            },
                        },
                        parent_policy: {
                            select: {
                                id: true,
                                policy_number: true,
                                policy_creation_status: true,
                                transition_type: true,
                                created_at: true,
                                parent_policy_id: true,
                                start_date: true,
                                end_date: true,
                                premium_amount: true,
                                sum_insured: true,
                                deductible_amount: true,
                                deductible_amount_status: true,
                                policy_name_id: true,
                                calculated_commission_amount: true,
                                commission_add_on_percentage: true,
                                gst_status: true,
                                company: { select: { id: true, name: true } },
                                policyName: { select: { id: true, name: true } },
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
                                        insured_members: {
                                            select: {
                                                id: true,
                                                name: true,
                                                date_of_birth: true,
                                                gender: true,
                                                relation_to_proposer: true,
                                                insured_member_salutation: true,
                                                pre_existing: true,
                                                insured_member_medical_condition: true,
                                                insured_member_medical_remarks: true,
                                            },
                                            orderBy: { created_at: 'asc' },
                                        },
                                    },
                                },
                                parent_policy: {
                                    select: {
                                        id: true,
                                        policy_number: true,
                                        policy_creation_status: true,
                                        transition_type: true,
                                        created_at: true,
                                        parent_policy_id: true,
                                        start_date: true,
                                        end_date: true,
                                        premium_amount: true,
                                        sum_insured: true,
                                        deductible_amount: true,
                                        deductible_amount_status: true,
                                        policy_name_id: true,
                                        calculated_commission_amount: true,
                                        commission_add_on_percentage: true,
                                        gst_status: true,
                                        company: { select: { id: true, name: true } },
                                        policyName: { select: { id: true, name: true } },
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
                                                insured_members: {
                                                    select: {
                                                        id: true,
                                                        name: true,
                                                        date_of_birth: true,
                                                        gender: true,
                                                        relation_to_proposer: true,
                                                        insured_member_salutation: true,
                                                        pre_existing: true,
                                                        insured_member_medical_condition: true,
                                                        insured_member_medical_remarks: true,
                                                    },
                                                    orderBy: { created_at: 'asc' },
                                                },
                                            },
                                        },
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        if (policies.length === 0)
            return [];
        // Flatten the nested structure into an array
        const ancestors = [];
        let current = policies[0];
        let depth = 0;
        while (current && depth < maxDepth) {
            ancestors.push(current);
            current = current.parent_policy;
            depth++;
        }
        return ancestors;
    }
    static filterDocumentsByTransitionType(documents, transitionType) {
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
    static isRecentDocument(doc) {
        if (!doc.created_at)
            return false;
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        return new Date(doc.created_at) > twoYearsAgo;
    }
    static isHealthDocument(doc) {
        // Check if document is health-related based on name or category
        const healthKeywords = ['medical', 'health', 'hospital', 'doctor', 'prescription'];
        const fileName = doc.original_name?.toLowerCase() || '';
        return healthKeywords.some(keyword => fileName.includes(keyword));
    }
    /**
     * Build year-wise claim summary for a given policy between its start and end years.
     * Uses pre-fetched claim data to avoid N+1 queries.
     */
    static buildClaimsByYearFromData(policy, claims) {
        const start = policy.start_date ? new Date(policy.start_date) : null;
        const end = policy.end_date ? new Date(policy.end_date) : null;
        if (!start || !end)
            return [];
        const startYear = start.getFullYear();
        const endYear = end.getFullYear();
        const claimsByYearMap = new Map();
        for (const c of claims) {
            if (!c.claim_date)
                continue;
            const y = new Date(c.claim_date).getFullYear();
            const prev = claimsByYearMap.get(y) || { count: 0, totalPaid: 0 };
            prev.count += 1;
            if (c.claim_status === 'Approved' || c.claim_status === 'Paid') {
                prev.totalPaid += Number(c.claim_amount || 0);
            }
            claimsByYearMap.set(y, prev);
        }
        const summary = [];
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
    /**
     * Build year-wise claim summary for a given policy between its start and end years.
     * Kept for backward compatibility; prefer buildClaimsByYearFromData for batch usage.
     */
    static async buildClaimsByYear(policy) {
        const claims = await prismaClient_1.default.claim.findMany({
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
        return this.buildClaimsByYearFromData(policy, claims);
    }
    static async getPolicyTransitionHistory(policyId) {
        // Get all ancestor policies recursively (lightweight - no documents)
        const ancestorPolicies = await this.getAllAncestorPoliciesLightweight(policyId);
        const policy = await prismaClient_1.default.policy.findUnique({
            where: { id: policyId },
            select: {
                id: true,
                policy_number: true,
                customer_name: true,
                policy_creation_status: true,
                transition_type: true,
                created_at: true,
                parent_policy_id: true,
                start_date: true,
                end_date: true,
                premium_amount: true,
                sum_insured: true,
                deductible_amount: true,
                deductible_amount_status: true,
                policy_name_id: true,
                calculated_commission_amount: true,
                commission_add_on_percentage: true,
                gst_status: true,
                company: { select: { id: true, name: true } },
                policyName: { select: { id: true, name: true } },
                documents: {
                    select: {
                        id: true,
                        file_name: true,
                        original_name: true,
                        file_type: true,
                        category: true,
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
                        insured_members: {
                            select: {
                                id: true,
                                name: true,
                                date_of_birth: true,
                                gender: true,
                                relation_to_proposer: true,
                                insured_member_salutation: true,
                                pre_existing: true,
                                insured_member_medical_condition: true,
                                insured_member_medical_remarks: true,
                            },
                            orderBy: { created_at: 'asc' },
                        },
                    },
                },
                parent_policy: {
                    select: {
                        id: true,
                        policy_number: true,
                        policy_creation_status: true,
                        transition_type: true,
                        created_at: true,
                        start_date: true,
                        end_date: true,
                        premium_amount: true,
                        sum_insured: true,
                        deductible_amount: true,
                        deductible_amount_status: true,
                        policy_name_id: true,
                        calculated_commission_amount: true,
                        commission_add_on_percentage: true,
                        gst_status: true,
                        company: { select: { id: true, name: true } },
                        policyName: { select: { id: true, name: true } },
                        documents: {
                            select: {
                                id: true,
                                file_name: true,
                                original_name: true,
                                file_type: true,
                                category: true,
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
                                insured_members: {
                                    select: {
                                        id: true,
                                        name: true,
                                        date_of_birth: true,
                                        gender: true,
                                        relation_to_proposer: true,
                                        insured_member_salutation: true,
                                        pre_existing: true,
                                        insured_member_medical_condition: true,
                                        insured_member_medical_remarks: true,
                                    },
                                    orderBy: { created_at: 'asc' },
                                },
                            },
                        },
                    }
                },
                children_policies: {
                    select: {
                        id: true,
                        policy_number: true,
                        customer_name: true,
                        policy_creation_status: true,
                        transition_type: true,
                        created_at: true,
                        start_date: true,
                        end_date: true,
                        premium_amount: true,
                        sum_insured: true,
                        deductible_amount: true,
                        deductible_amount_status: true,
                        policy_name_id: true,
                        calculated_commission_amount: true,
                        commission_add_on_percentage: true,
                        gst_status: true,
                        company: { select: { id: true, name: true } },
                        policyName: { select: { id: true, name: true } },
                        documents: {
                            select: {
                                id: true,
                                file_name: true,
                                original_name: true,
                                file_type: true,
                                category: true,
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
                                insured_members: {
                                    select: {
                                        id: true,
                                        name: true,
                                        date_of_birth: true,
                                        gender: true,
                                        relation_to_proposer: true,
                                        insured_member_salutation: true,
                                        pre_existing: true,
                                        insured_member_medical_condition: true,
                                        insured_member_medical_remarks: true,
                                    },
                                    orderBy: { created_at: 'asc' },
                                },
                            },
                        },
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
        // Filter out the current policy from ancestors to prevent duplication
        const filteredAncestors = ancestorPolicies.filter(ancestor => ancestor.id !== policyId);
        // Add ancestor policies (in chronological order from earliest to latest)
        // The filteredAncestors array is in reverse order (current -> parent -> grandparent -> etc.)
        // So we need to reverse it to show earliest first
        const chronologicalAncestors = [...filteredAncestors].reverse();
        for (let i = 0; i < chronologicalAncestors.length; i++) {
            const ancestor = chronologicalAncestors[i];
            const isImmediateParent = i === chronologicalAncestors.length - 1;
            completeHierarchy.push({
                policy: ancestor,
                relationship: isImmediateParent ? 'PARENT' : 'ANCESTOR',
                transition_type: ancestor.transition_type,
                position: isImmediateParent ? 'PARENT' : 'ANCESTOR',
                generation: chronologicalAncestors.length - i // Generation number (1 = immediate parent, 2 = grandparent, etc.)
            });
        }
        // Add current policy
        completeHierarchy.push({
            policy: policy,
            relationship: 'CURRENT',
            transition_type: null,
            position: 'CURRENT',
            generation: 0
        });
        // Add child policies
        policy.children_policies.forEach(child => {
            completeHierarchy.push({
                policy: child,
                relationship: 'CHILD',
                transition_type: child.transition_type,
                position: 'CHILD',
                generation: -1
            });
        });
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
        // OPTIMIZED: Fetch all claims for all hierarchy policies in ONE query
        const allPolicyIds = completeHierarchy.map((item) => item.policy.id);
        const allClaims = await prismaClient_1.default.claim.findMany({
            where: {
                policy_id: { in: allPolicyIds },
                is_deleted: false,
                claim_date: { not: null },
            },
            select: {
                policy_id: true,
                claim_date: true,
                claim_status: true,
                claim_amount: true,
            }
        });
        // Build claims map by policy_id
        const claimsByPolicyId = new Map();
        for (const claim of allClaims) {
            const list = claimsByPolicyId.get(claim.policy_id) || [];
            list.push(claim);
            claimsByPolicyId.set(claim.policy_id, list);
        }
        // Enrich hierarchy with claimsByYear using pre-fetched data
        for (const item of completeHierarchy) {
            try {
                item.claimsByYear = this.buildClaimsByYearFromData(item.policy, claimsByPolicyId.get(item.policy.id) || []);
            }
            catch (e) {
                console.warn('Failed to build claimsByYear for policy', item?.policy?.id, e);
                item.claimsByYear = null;
            }
        }
        // Batch live commission enrichment using current rules (single DB call)
        const { batchEnrichWithLiveCommission } = await Promise.resolve().then(() => __importStar(require('../controllers/policy.controller')));
        const allPolicies = completeHierarchy.map((item) => item.policy);
        const enriched = await batchEnrichWithLiveCommission(allPolicies);
        for (let i = 0; i < completeHierarchy.length; i++) {
            completeHierarchy[i].commission = {
                amount: enriched[i].calculated_commission_amount || 0,
                percentage: enriched[i].commission_add_on_percentage || 0,
                gst_status: completeHierarchy[i].policy.gst_status || false,
            };
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
    static async validateTransitionEligibility(parentPolicyId, transitionType) {
        const policy = await prismaClient_1.default.policy.findUnique({
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
    static async deleteDocumentReference(referenceId) {
        try {
            // Check if reference exists
            const reference = await prismaClient_1.default.policyDocumentReference.findUnique({
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
            // Delete the reference
            await prismaClient_1.default.policyDocumentReference.delete({
                where: { id: referenceId }
            });
            // Clear cache for the policy
            documentAccess_service_1.DocumentAccessService.clearCache(reference.policy_id);
            return true;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to delete document reference: ${errorMessage}`);
        }
    }
    /**
     * Update existing document references to make them deletable
     * This is a one-time migration function for existing references
     */
    static async updateExistingReferencesToDeletable() {
        try {
            const result = await prismaClient_1.default.policyDocumentReference.updateMany({
                where: {
                    can_delete: false
                },
                data: {
                    can_delete: true
                }
            });
            return { updated: result.count };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to update existing references: ${errorMessage}`);
        }
    }
    /**
     * Get document transfer statistics for a policy transition
     */
    static async getDocumentTransferStats(parentPolicyId, transitionType) {
        // Get all ancestor policies recursively
        const ancestorPolicies = await this.getAllAncestorPolicies(parentPolicyId);
        const stats = {
            totalDocuments: 0,
            ancestorPolicies: [],
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
                ancestorPolicy.proposer.insured_members.forEach((member) => {
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
        return stats;
    }
}
exports.PolicyTransitionService = PolicyTransitionService;
