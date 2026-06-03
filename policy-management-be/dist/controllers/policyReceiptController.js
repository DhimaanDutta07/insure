"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPolicyReceiptsByTimePeriod = exports.deletePolicyReceipt = exports.updatePolicyReceipt = exports.getPolicyReceipt = exports.getAllPolicyReceipts = exports.createPolicyReceipt = void 0;
exports.getCleanImageUrl = getCleanImageUrl;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const stream_1 = require("stream");
const dotenv_1 = require("dotenv");
const policyReceiptRepository_1 = require("../repositories/policyReceiptRepository");
const fileStorage_1 = require("../utils/fileStorage");
const errorHandler_1 = require("../utils/errorHandler");
const policyReceiptSchema_1 = require("../schemas/policyReceiptSchema");
const client_1 = require("@prisma/client");
// Load environment variables
(0, dotenv_1.config)();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
}
const pipelineAsync = (0, util_1.promisify)(stream_1.pipeline);
// Helper: Clean image URL for frontend
function getCleanImageUrl(url) {
    let fullUrl = (0, fileStorage_1.getPublicUrl)(url);
    fullUrl = fullUrl.replace(/([^:])\/+/g, '$1/');
    return fullUrl;
}
// Helper: Normalize file field to array
function toArray(fileOrArray) {
    if (!fileOrArray)
        return [];
    return Array.isArray(fileOrArray) ? fileOrArray : [fileOrArray];
}
// Helper: Extract user ID from JWT
function extractUserIdFromRequest(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer '))
        return undefined;
    if (!JWT_SECRET)
        return undefined;
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (typeof decoded === 'object' && decoded && 'user_id' in decoded) {
            return decoded.user_id;
        }
        return undefined;
    }
    catch {
        return undefined;
    }
}
// Create Policy Receipt
exports.createPolicyReceipt = (0, errorHandler_1.asyncTryCatch)(async (req, res) => {
    const validatedData = policyReceiptSchema_1.createPolicyReceiptSchema.parse({
        body: req.body,
        files: req.files,
        headers: req.headers
    });
    const { policy_number, policy_type, remark } = validatedData.body;
    const policy_id = req.body.policy_id || undefined;
    const proposer_id = req.body.proposer_id || undefined;
    const insured_member_ids = req.body.insured_member_ids || undefined;
    const files = validatedData.files;
    const user_Id = extractUserIdFromRequest(req);
    if (!user_Id) {
        res.status(401).json({ error: 'Unauthorized: Invalid or missing token' });
        return;
    }
    if (!policy_number) {
        res.status(400).json({ error: 'Policy number is required' });
        return;
    }
    try {
        // --- Handle file uploads ---
        // 1. Policy Document
        let policyDocumentId;
        if (files.policy_document) {
            const uploaded = await (0, fileStorage_1.uploadFile)(files.policy_document, policy_number || 'unknown');
            const doc = await (0, policyReceiptRepository_1.createUploadedDocument)({
                policy_id: policy_id,
                file_name: uploaded.fileName,
                original_name: files.policy_document.originalname,
                relative_path: uploaded.url,
                category: client_1.DocumentCategory.POLICY_DOCUMENT,
                file_type: client_1.FileType.PDF, // or infer from extension
                uploaded_by: user_Id,
            });
            policyDocumentId = doc.id;
        }
        // 2. Policyholder Document
        let policyholderDocumentIds = [];
        if (files.policyholder_document) {
            const uploaded = await (0, fileStorage_1.uploadFile)(files.policyholder_document, policy_number || 'unknown');
            const doc = await (0, policyReceiptRepository_1.createUploadedDocument)({
                policy_id: policy_id,
                file_name: uploaded.fileName,
                original_name: files.policyholder_document.originalname,
                relative_path: uploaded.url,
                category: client_1.DocumentCategory.PROPOSER_DOCUMENT,
                file_type: client_1.FileType.PDF, // or infer from extension
                uploaded_by: user_Id,
                proposer_id: proposer_id,
            });
            policyholderDocumentIds.push(doc.id);
        }
        // 3. Family Member Documents
        let familyMemberDocumentIds = [];
        const familyMemberFiles = toArray(files.family_member_documents);
        for (let i = 0; i < familyMemberFiles.length; i++) {
            const file = familyMemberFiles[i];
            const uploaded = await (0, fileStorage_1.uploadFile)(file, policy_number || 'unknown');
            const doc = await (0, policyReceiptRepository_1.createUploadedDocument)({
                policy_id: policy_id,
                file_name: uploaded.fileName,
                original_name: file.originalname,
                relative_path: uploaded.url,
                category: client_1.DocumentCategory.INSURED_MEMBER_DOCUMENT,
                file_type: client_1.FileType.PDF, // or infer from extension
                uploaded_by: user_Id,
                insured_member_id: Array.isArray(insured_member_ids) ? insured_member_ids[i] : undefined,
            });
            familyMemberDocumentIds.push(doc.id);
        }
        // 4. Images
        let imageUrls = [];
        const imageFiles = toArray(files.images);
        for (const file of imageFiles) {
            const uploaded = await (0, fileStorage_1.uploadFile)(file, policy_number || 'unknown');
            imageUrls.push(uploaded.url);
        }
        // --- Create policy receipt in DB ---
        const policyReceipt = await (0, policyReceiptRepository_1.createPolicyReceipt)({
            policy_number,
            policy_type,
            remark,
            user_id: user_Id,
            policy_document_id: policyDocumentId,
            images: imageUrls,
        });
        // --- Prepare response ---
        res.status(201).json({
            ...policyReceipt,
            policy_document_id: policyDocumentId,
            policyholder_document_ids: policyholderDocumentIds,
            family_member_document_ids: familyMemberDocumentIds,
            images: imageUrls.map(url => ({ url, directUrl: getCleanImageUrl(url), isPlaceholder: false })),
        });
    }
    catch (error) {
        // Clean up temp files if error
        Object.values(files).flat().forEach((file) => {
            try {
                if (file && file.path && fs_1.default.existsSync(file.path)) {
                    fs_1.default.unlinkSync(file.path);
                }
            }
            catch (cleanupError) {
                console.error('Error cleaning up temp file:', cleanupError);
            }
        });
        throw error;
    }
});
// Get all policy receipts
exports.getAllPolicyReceipts = (0, errorHandler_1.asyncTryCatch)(async (req, res) => {
    const receipts = await (0, policyReceiptRepository_1.getAllPolicyReceipts)();
    const receiptsWithImages = receipts.map(receipt => ({
        ...receipt,
        images: (receipt.images ?? []).map((image) => ({
            ...image,
            directUrl: getCleanImageUrl(image.url),
            isPlaceholder: false
        }))
    }));
    res.status(200).json(receiptsWithImages);
});
// Get single policy receipt
exports.getPolicyReceipt = (0, errorHandler_1.asyncTryCatch)(async (req, res) => {
    const { params } = policyReceiptSchema_1.getPolicyReceiptSchema.parse({ params: req.params });
    const receipt = await (0, policyReceiptRepository_1.getPolicyReceiptById)(params.id);
    if (!receipt) {
        res.status(404).json({ error: 'Policy receipt not found' });
        return;
    }
    res.status(200).json(receipt);
});
// Update policy receipt
exports.updatePolicyReceipt = (0, errorHandler_1.asyncTryCatch)(async (req, res) => {
    const validatedData = policyReceiptSchema_1.updatePolicyReceiptSchema.parse({
        params: req.params,
        body: req.body,
        files: req.files
    });
    const { id } = validatedData.params;
    const { policy_number, policy_type, remark } = validatedData.body;
    const policy_id = req.body.policy_id || undefined;
    const proposer_id = req.body.proposer_id || undefined;
    const insured_member_ids = req.body.insured_member_ids || undefined;
    const files = validatedData.files || {};
    const user_Id = extractUserIdFromRequest(req);
    if (!user_Id) {
        res.status(401).json({ error: 'Unauthorized: Invalid or missing token' });
        return;
    }
    // --- Handle file uploads ---
    // 1. Policy Document
    let policyDocumentId;
    if (files.policy_document) {
        const uploaded = await (0, fileStorage_1.uploadFile)(files.policy_document, policy_number || 'unknown');
        const doc = await (0, policyReceiptRepository_1.createUploadedDocument)({
            policy_id: policy_id,
            file_name: uploaded.fileName,
            original_name: files.policy_document.originalname,
            relative_path: uploaded.url,
            category: client_1.DocumentCategory.POLICY_DOCUMENT,
            file_type: client_1.FileType.PDF, // or infer from extension
            uploaded_by: user_Id,
        });
        policyDocumentId = doc.id;
    }
    // 2. Policyholder Document
    let policyholderDocumentIds = [];
    if (files.policyholder_document) {
        const uploaded = await (0, fileStorage_1.uploadFile)(files.policyholder_document, policy_number || 'unknown');
        const doc = await (0, policyReceiptRepository_1.createUploadedDocument)({
            policy_id: policy_id,
            file_name: uploaded.fileName,
            original_name: files.policyholder_document.originalname,
            relative_path: uploaded.url,
            category: client_1.DocumentCategory.PROPOSER_DOCUMENT,
            file_type: client_1.FileType.PDF, // or infer from extension
            uploaded_by: user_Id,
            proposer_id: proposer_id,
        });
        policyholderDocumentIds.push(doc.id);
    }
    // 3. Family Member Documents
    let familyMemberDocumentIds = [];
    const familyMemberFiles = toArray(files.family_member_documents);
    for (let i = 0; i < familyMemberFiles.length; i++) {
        const file = familyMemberFiles[i];
        const uploaded = await (0, fileStorage_1.uploadFile)(file, policy_number || 'unknown');
        const doc = await (0, policyReceiptRepository_1.createUploadedDocument)({
            policy_id: policy_id,
            file_name: uploaded.fileName,
            original_name: file.originalname,
            relative_path: uploaded.url,
            category: client_1.DocumentCategory.INSURED_MEMBER_DOCUMENT,
            file_type: client_1.FileType.PDF, // or infer from extension
            uploaded_by: user_Id,
            insured_member_id: Array.isArray(insured_member_ids) ? insured_member_ids[i] : undefined,
        });
        familyMemberDocumentIds.push(doc.id);
    }
    // 4. Images
    let imageUrls = [];
    const imageFiles = toArray(files.images);
    for (const file of imageFiles) {
        const uploaded = await (0, fileStorage_1.uploadFile)(file, policy_number || 'unknown');
        imageUrls.push(uploaded.url);
    }
    // --- Update policy receipt in DB ---
    const updatedReceipt = await (0, policyReceiptRepository_1.updatePolicyReceipt)(id, {
        policy_number: policy_number ?? undefined,
        policy_type: policy_type ?? undefined,
        remark: remark ?? undefined,
        policy_document_id: policyDocumentId,
        images: imageUrls.length > 0 ? imageUrls : undefined,
    });
    res.status(200).json({
        ...updatedReceipt,
        policy_document_id: policyDocumentId,
        policyholder_document_ids: policyholderDocumentIds,
        family_member_document_ids: familyMemberDocumentIds,
        images: (updatedReceipt.images ?? []).map((img) => ({ url: img.url, directUrl: getCleanImageUrl(img.url), isPlaceholder: false })),
    });
});
// Delete policy receipt
exports.deletePolicyReceipt = (0, errorHandler_1.asyncTryCatch)(async (req, res) => {
    const { params } = policyReceiptSchema_1.deletePolicyReceiptSchema.parse({ params: req.params });
    await (0, policyReceiptRepository_1.deletePolicyReceipt)(params.id);
    res.status(204).end();
});
// Get policy receipts by time period
exports.getPolicyReceiptsByTimePeriod = (0, errorHandler_1.asyncTryCatch)(async (req, res) => {
    const validatedData = policyReceiptSchema_1.getPolicyReceiptsByTimePeriodSchema.parse({
        params: req.params,
        query: req.query
    });
    const { timePeriod } = validatedData.params;
    // Only pass one argument as per repository signature
    const receipts = await (0, policyReceiptRepository_1.getPolicyReceiptsByTimePeriod)(timePeriod);
    res.status(200).json(receipts);
});
