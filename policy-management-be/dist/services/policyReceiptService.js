"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPolicyReceiptsByTimePeriodService = exports.removePolicyReceipt = exports.updatePolicyReceiptService = exports.fetchPolicyReceiptById = exports.fetchAllPolicyReceipts = exports.addPolicyReceipt = void 0;
const policyReceiptRepository_1 = require("../repositories/policyReceiptRepository");
const fileStorage_1 = require("../utils/fileStorage");
const client_1 = require("@prisma/client");
const addPolicyReceipt = async (data) => {
    const { files, policy_id, proposer_id, insured_member_ids, ...rest } = data;
    // 1. Policy Document
    let policyDocumentId;
    if (files.policy_document) {
        const uploaded = await (0, fileStorage_1.uploadFile)(files.policy_document, rest.policy_number || data.policy_number || 'unknown');
        const doc = await (0, policyReceiptRepository_1.createUploadedDocument)({
            policy_id: policy_id,
            file_name: uploaded.fileName,
            original_name: files.policy_document.originalname,
            relative_path: uploaded.url,
            category: client_1.DocumentCategory.POLICY_DOCUMENT,
            file_type: client_1.FileType.PDF,
            uploaded_by: rest.user_id,
        });
        policyDocumentId = doc.id;
    }
    // 2. Policyholder Document
    let policyholderDocumentIds = [];
    if (files.policyholder_document) {
        const uploaded = await (0, fileStorage_1.uploadFile)(files.policyholder_document, rest.policy_number || data.policy_number || 'unknown');
        const doc = await (0, policyReceiptRepository_1.createUploadedDocument)({
            policy_id: policy_id,
            file_name: uploaded.fileName,
            original_name: files.policyholder_document.originalname,
            relative_path: uploaded.url,
            category: client_1.DocumentCategory.PROPOSER_DOCUMENT,
            file_type: client_1.FileType.PDF,
            uploaded_by: rest.user_id,
            proposer_id: proposer_id,
        });
        policyholderDocumentIds.push(doc.id);
    }
    // 3. Family Member Documents
    let familyMemberDocumentIds = [];
    if (files.family_member_documents && Array.isArray(files.family_member_documents)) {
        for (let i = 0; i < files.family_member_documents.length; i++) {
            const file = files.family_member_documents[i];
            const uploaded = await (0, fileStorage_1.uploadFile)(file, rest.policy_number || data.policy_number || 'unknown');
            const doc = await (0, policyReceiptRepository_1.createUploadedDocument)({
                policy_id: policy_id,
                file_name: uploaded.fileName,
                original_name: file.originalname,
                relative_path: uploaded.url,
                category: client_1.DocumentCategory.INSURED_MEMBER_DOCUMENT,
                file_type: client_1.FileType.PDF,
                uploaded_by: rest.user_id,
                insured_member_id: Array.isArray(insured_member_ids) ? insured_member_ids[i] : undefined,
            });
            familyMemberDocumentIds.push(doc.id);
        }
    }
    // 4. Images
    let imageUrls = [];
    if (files.images && Array.isArray(files.images)) {
        for (const file of files.images) {
            const uploaded = await (0, fileStorage_1.uploadFile)(file, rest.policy_number || data.policy_number || 'unknown');
            imageUrls.push(uploaded.url);
        }
    }
    // Create PolicyReceipt
    return (0, policyReceiptRepository_1.createPolicyReceipt)({
        policy_number: rest.policy_number,
        policy_type: rest.policy_type,
        remark: rest.remark,
        user_id: rest.user_id,
        policy_document_id: policyDocumentId,
        images: imageUrls,
    });
};
exports.addPolicyReceipt = addPolicyReceipt;
const fetchAllPolicyReceipts = async () => (0, policyReceiptRepository_1.getAllPolicyReceipts)();
exports.fetchAllPolicyReceipts = fetchAllPolicyReceipts;
const fetchPolicyReceiptById = async (id) => (0, policyReceiptRepository_1.getPolicyReceiptById)(id);
exports.fetchPolicyReceiptById = fetchPolicyReceiptById;
const updatePolicyReceiptService = async (id, data) => {
    const { files = {}, policy_id, proposer_id, insured_member_ids, ...rest } = data;
    // 1. Policy Document
    let policyDocumentId;
    if (files.policy_document) {
        const uploaded = await (0, fileStorage_1.uploadFile)(files.policy_document, rest.policy_number || data.policy_number || 'unknown');
        const doc = await (0, policyReceiptRepository_1.createUploadedDocument)({
            policy_id: policy_id,
            file_name: uploaded.fileName,
            original_name: files.policy_document.originalname,
            relative_path: uploaded.url,
            category: client_1.DocumentCategory.POLICY_DOCUMENT,
            file_type: client_1.FileType.PDF,
            uploaded_by: rest.user_id,
        });
        policyDocumentId = doc.id;
    }
    // 2. Policyholder Document
    let policyholderDocumentIds = [];
    if (files.policyholder_document) {
        const uploaded = await (0, fileStorage_1.uploadFile)(files.policyholder_document, rest.policy_number || data.policy_number || 'unknown');
        const doc = await (0, policyReceiptRepository_1.createUploadedDocument)({
            policy_id: policy_id,
            file_name: uploaded.fileName,
            original_name: files.policyholder_document.originalname,
            relative_path: uploaded.url,
            category: client_1.DocumentCategory.PROPOSER_DOCUMENT,
            file_type: client_1.FileType.PDF,
            uploaded_by: rest.user_id,
            proposer_id: proposer_id,
        });
        policyholderDocumentIds.push(doc.id);
    }
    // 3. Family Member Documents
    let familyMemberDocumentIds = [];
    if (files.family_member_documents && Array.isArray(files.family_member_documents)) {
        for (let i = 0; i < files.family_member_documents.length; i++) {
            const file = files.family_member_documents[i];
            const uploaded = await (0, fileStorage_1.uploadFile)(file, rest.policy_number || data.policy_number || 'unknown');
            const doc = await (0, policyReceiptRepository_1.createUploadedDocument)({
                policy_id: policy_id,
                file_name: uploaded.fileName,
                original_name: file.originalname,
                relative_path: uploaded.url,
                category: client_1.DocumentCategory.INSURED_MEMBER_DOCUMENT,
                file_type: client_1.FileType.PDF,
                uploaded_by: rest.user_id,
                insured_member_id: Array.isArray(insured_member_ids) ? insured_member_ids[i] : undefined,
            });
            familyMemberDocumentIds.push(doc.id);
        }
    }
    // 4. Images
    let imageUrls = [];
    if (files.images && Array.isArray(files.images)) {
        for (const file of files.images) {
            const uploaded = await (0, fileStorage_1.uploadFile)(file, rest.policy_number || data.policy_number || 'unknown');
            imageUrls.push(uploaded.url);
        }
    }
    // Update PolicyReceipt
    return (0, policyReceiptRepository_1.updatePolicyReceipt)(id, {
        ...rest,
        policy_document_id: policyDocumentId,
        images: imageUrls.length > 0 ? imageUrls : undefined,
    });
};
exports.updatePolicyReceiptService = updatePolicyReceiptService;
const removePolicyReceipt = async (id) => (0, policyReceiptRepository_1.deletePolicyReceipt)(id);
exports.removePolicyReceipt = removePolicyReceipt;
const getPolicyReceiptsByTimePeriodService = async (arg) => (0, policyReceiptRepository_1.getPolicyReceiptsByTimePeriod)(arg);
exports.getPolicyReceiptsByTimePeriodService = getPolicyReceiptsByTimePeriodService;
