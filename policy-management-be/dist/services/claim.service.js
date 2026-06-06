"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.claimService = exports.ClaimService = void 0;
const fs_1 = require("fs");
const prismaClient_1 = __importDefault(require("../utils/prismaClient"));
// Helper to map MIME type to FileType enum (same as policy service)
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
async function processClaimDocuments(files, uploadedBy) {
    const claimDocs = [];
    if (!files)
        return claimDocs;
    const fileReadPromises = [];
    if (files.claimDocs && Array.isArray(files.claimDocs)) {
        for (const file of files.claimDocs) {
            fileReadPromises.push(fs_1.promises.readFile(file.path).then((data) => {
                claimDocs.push({
                    file_name: file.filename,
                    original_name: file.originalname,
                    relative_path: `/api/uploads/policy-documents/${file.filename}`,
                    file_data: data,
                    file_type: mapMimeTypeToFileType(file.mimetype),
                    category: 'OTHER',
                    uploaded_by: uploadedBy,
                });
            }));
        }
    }
    if (files.documents && Array.isArray(files.documents)) {
        for (const file of files.documents) {
            fileReadPromises.push(fs_1.promises.readFile(file.path).then((data) => {
                claimDocs.push({
                    file_name: file.filename,
                    original_name: file.originalname,
                    relative_path: `/api/uploads/policy-documents/${file.filename}`,
                    file_data: data,
                    file_type: mapMimeTypeToFileType(file.mimetype),
                    category: 'OTHER',
                    uploaded_by: uploadedBy,
                });
            }));
        }
    }
    await Promise.all(fileReadPromises);
    return claimDocs;
}
class ClaimService {
    async createClaim(data, files, userId) {
        const { members, ...claimData } = data;
        console.log('🚀 Starting claim creation...');
        // ✅ OPTIMIZATION: Fetch policy OUTSIDE the transaction — no need to hold a transaction open for a read
        const policy = await prismaClient_1.default.policy.findUnique({
            where: { id: claimData.policy_id },
            select: {
                policy_number: true,
                customer_name: true,
                proposer: { select: { full_name: true } },
                company: { select: { name: true } }
            }
        });
        if (!policy) {
            throw new Error('Policy not found');
        }
        // Process files outside transaction - NON-BLOCKING
        const processedDocs = await processClaimDocuments(files, userId);
        // ✅ OPTIMIZATION: Transaction now only does writes — much faster
        return await prismaClient_1.default.$transaction(async (tx) => {
            // Create the main claim
            const claim = await tx.claim.create({
                data: {
                    ...claimData,
                    created_by: userId,
                    claim_status: claimData.claim_status || 'Pending',
                    approved_by: claimData.approved_by || undefined,
                    approved_at: (claimData.claim_status === 'Approved' || claimData.claim_status === 'Rejected')
                        ? claimData.approved_at || new Date()
                        : undefined,
                    rejection_reason: claimData.rejection_reason || undefined,
                },
            });
            console.log("✅ [ClaimService] Claim created:", claim.id);
            // ✅ OPTIMIZATION: Run members + documents writes in parallel
            await Promise.all([
                members && members.length > 0
                    ? tx.claimMember.createMany({
                        data: members.map((member) => ({
                            claim_id: claim.id,
                            insured_member_id: member.insured_member_id,
                            member_claim_amount: member.member_claim_amount,
                            member_remarks: member.member_remarks,
                        })),
                    })
                    : Promise.resolve(),
                processedDocs.length > 0
                    ? tx.uploadedDocument.createMany({
                        data: processedDocs.map(doc => ({
                            ...doc,
                            file_type: doc.file_type,
                            claim_id: claim.id,
                        })),
                    })
                    : Promise.resolve(),
            ]);
            console.log("✅ [ClaimService] Members and documents created in parallel");
            // ✅ Final read to return complete claim
            return tx.claim.findUnique({
                where: { id: claim.id },
                include: {
                    claim_members: {
                        include: { insured_member: true },
                    },
                    documents: true,
                    policy: {
                        select: {
                            policy_number: true,
                            customer_name: true,
                            company: { select: { name: true } }
                        }
                    }
                },
            });
        }, {
            timeout: 15000, // ✅ Increased from default 5000ms to 15000ms
            maxWait: 5000,
        });
    }
    async getClaimsByPolicy(policyId) {
        return await prismaClient_1.default.claim.findMany({
            where: {
                policy_id: policyId,
                is_deleted: false
            },
            include: {
                claim_members: {
                    include: {
                        insured_member: true,
                    },
                },
                documents: true,
                policy: {
                    select: {
                        policy_number: true,
                        customer_name: true,
                    }
                },
            },
            orderBy: { created_at: 'desc' },
        });
    }
    async getClaimById(id) {
        return await prismaClient_1.default.claim.findUnique({
            where: { id, is_deleted: false },
            include: {
                claim_members: {
                    include: {
                        insured_member: true,
                    },
                },
                documents: true,
                policy: {
                    select: {
                        policy_number: true,
                        customer_name: true,
                        company: {
                            select: { name: true }
                        }
                    }
                },
            },
        });
    }
    async updateClaimStatus(id, status, userId, rejectionReason) {
        return await prismaClient_1.default.claim.update({
            where: { id },
            data: {
                claim_status: status,
                approved_by: status === 'Approved' || status === 'Rejected' ? userId : undefined,
                approved_at: status === 'Approved' || status === 'Rejected' ? new Date() : undefined,
                rejection_reason: rejectionReason,
            },
            include: {
                claim_members: {
                    include: {
                        insured_member: true,
                    },
                },
                documents: true,
            },
        });
    }
    async updateClaim(id, data, files, userId) {
        const { members, members_to_delete, removedDocumentIds, ...claimData } = data;
        console.log('🔄 Starting claim update...');
        // ✅ OPTIMIZATION: Fetch existing claim + policy OUTSIDE transaction
        const existingClaim = await prismaClient_1.default.claim.findUnique({
            where: { id },
            include: {
                policy: {
                    select: {
                        policy_number: true,
                        customer_name: true,
                        company: { select: { name: true } }
                    }
                }
            }
        });
        if (!existingClaim) {
            throw new Error('Claim not found');
        }
        // Process files outside transaction - NON-BLOCKING
        const processedDocs = await processClaimDocuments(files, userId);
        // ✅ OPTIMIZATION: Transaction only does writes
        return await prismaClient_1.default.$transaction(async (tx) => {
            // ✅ Run all deletes in parallel
            await Promise.all([
                removedDocumentIds && removedDocumentIds.length > 0
                    ? tx.uploadedDocument.deleteMany({
                        where: { id: { in: removedDocumentIds }, claim_id: id }
                    })
                    : Promise.resolve(),
                members_to_delete && members_to_delete.length > 0
                    ? tx.claimMember.deleteMany({
                        where: { id: { in: members_to_delete }, claim_id: id }
                    })
                    : Promise.resolve(),
                // If new members provided, delete existing ones in same parallel batch
                members !== undefined
                    ? tx.claimMember.deleteMany({ where: { claim_id: id } })
                    : Promise.resolve(),
            ]);
            // Update the main claim
            const claim = await tx.claim.update({
                where: { id },
                data: {
                    ...claimData,
                    claim_status: claimData.claim_status || undefined,
                    approved_by: claimData.approved_by || undefined,
                    approved_at: (claimData.claim_status === 'Approved' || claimData.claim_status === 'Rejected')
                        ? claimData.approved_at || new Date()
                        : undefined,
                    rejection_reason: claimData.rejection_reason || undefined,
                },
            });
            console.log("✅ [ClaimService] Claim updated:", claim.id);
            // ✅ Run members + documents writes in parallel
            await Promise.all([
                members && members.length > 0
                    ? tx.claimMember.createMany({
                        data: members.map((member) => ({
                            claim_id: claim.id,
                            insured_member_id: member.insured_member_id,
                            member_claim_amount: member.member_claim_amount,
                            member_remarks: member.member_remarks,
                        })),
                    })
                    : Promise.resolve(),
                processedDocs.length > 0
                    ? tx.uploadedDocument.createMany({
                        data: processedDocs.map(doc => ({
                            ...doc,
                            file_type: doc.file_type,
                            claim_id: claim.id,
                        })),
                    })
                    : Promise.resolve(),
            ]);
            console.log("✅ [ClaimService] Members and documents updated in parallel");
            return tx.claim.findUnique({
                where: { id: claim.id },
                include: {
                    claim_members: {
                        include: { insured_member: true },
                    },
                    documents: true,
                    policy: {
                        select: {
                            policy_number: true,
                            customer_name: true,
                            company: { select: { name: true } }
                        }
                    }
                },
            });
        }, {
            timeout: 15000, // ✅ Increased from default 5000ms to 15000ms
            maxWait: 5000,
        });
    }
    async deleteClaim(id) {
        return await prismaClient_1.default.claim.update({
            where: { id },
            data: { is_deleted: true },
        });
    }
}
exports.ClaimService = ClaimService;
exports.claimService = new ClaimService();
