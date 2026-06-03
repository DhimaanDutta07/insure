"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPolicyReceiptsByTimePeriod = exports.deletePolicyReceipt = exports.updatePolicyReceipt = exports.getPolicyReceiptById = exports.getAllPolicyReceipts = exports.createPolicyReceipt = void 0;
exports.createUploadedDocument = createUploadedDocument;
const client_1 = require("@prisma/client");
const AppError_1 = require("../utils/AppError");
const policyReceiptController_1 = require("../controllers/policyReceiptController");
const prisma = new client_1.PrismaClient();
// Helper to create an UploadedDocument
async function createUploadedDocument({ policy_id, file_name, original_name, relative_path, category, file_type, uploaded_by, proposer_id, insured_member_id, }) {
    return prisma.uploadedDocument.create({
        data: {
            policy_id,
            file_name,
            original_name,
            relative_path,
            category,
            file_type,
            uploaded_by,
            proposer_id,
            insured_member_id,
        },
    });
}
const createPolicyReceipt = async (data) => {
    const { images, policy_document_id, ...receiptData } = data;
    return prisma.policyReceipt.create({
        data: {
            ...receiptData,
            ...(policy_document_id && { policy_document_id }),
            images: {
                create: images.map((url) => ({ url })),
            },
        },
        include: {
            user: { select: { id: true, name: true } },
            images: true,
        },
    });
};
exports.createPolicyReceipt = createPolicyReceipt;
const getAllPolicyReceipts = async () => {
    return prisma.policyReceipt.findMany({
        where: { is_deleted: false },
        include: {
            user: { select: { id: true, name: true } },
            images: true,
        },
    });
};
exports.getAllPolicyReceipts = getAllPolicyReceipts;
const getPolicyReceiptById = async (id) => {
    return prisma.policyReceipt.findUnique({
        where: { id, is_deleted: false },
        include: {
            user: { select: { id: true, name: true } },
            images: true,
        },
    });
};
exports.getPolicyReceiptById = getPolicyReceiptById;
const updatePolicyReceipt = async (id, data) => {
    const { images, ...receiptData } = data;
    return prisma.policyReceipt.update({
        where: { id },
        data: {
            ...receiptData,
            ...(images && {
                images: {
                    deleteMany: {},
                    create: images.map((url) => ({ url })),
                },
            }),
        },
        include: {
            user: { select: { id: true, name: true } },
            images: true,
        },
    });
};
exports.updatePolicyReceipt = updatePolicyReceipt;
const deletePolicyReceipt = async (id) => {
    return prisma.policyReceipt.update({
        where: { id },
        data: { is_deleted: true },
        include: {
            images: true,
        },
    });
};
exports.deletePolicyReceipt = deletePolicyReceipt;
const getPolicyReceiptsByTimePeriod = async (timePeriod = 'today') => {
    try {
        const today = new Date();
        let startDate, endDate;
        switch (typeof timePeriod === 'string' ? timePeriod : 'custom') {
            case 'today':
                startDate = new Date(today);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(today);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'yesterday':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 1);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(today);
                endDate.setDate(today.getDate() - 1);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'last3Days':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 3);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(today);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'thisWeek':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - today.getDay());
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(today);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'thisMonth':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(today);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'lastMonth':
                startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(today.getFullYear(), today.getMonth(), 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'custom':
                if (typeof timePeriod !== 'string' && timePeriod.start && timePeriod.end) {
                    startDate = new Date(timePeriod.start);
                    endDate = new Date(timePeriod.end);
                    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                        throw new Error('Invalid custom date format');
                    }
                    startDate.setHours(0, 0, 0, 0);
                    endDate.setHours(23, 59, 59, 999);
                    break;
                }
            default:
                startDate = new Date(today);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(today);
                endDate.setHours(23, 59, 59, 999);
        }
        const whereClause = {
            created_at: {
                gte: startDate,
                lte: endDate
            },
            is_deleted: false,
        };
        const receipts = await prisma.policyReceipt.findMany({
            where: whereClause,
            include: {
                images: true,
                user: { select: { id: true, name: true } },
            },
            orderBy: {
                created_at: 'desc'
            }
        });
        const mappedReceipts = receipts.map(receipt => ({
            id: receipt.id,
            policy_number: receipt.policy_number ?? '', // fallback to empty string if null
            policy_type: receipt.policy_type ?? '', // fallback to empty string if null
            created_at: receipt.created_at ?? new Date(0), // fallback to epoch if null
            user: receipt.user,
            images: receipt.images.map(image => ({
                id: image.id,
                url: image.url ?? '', // fallback to empty string if null
                directUrl: (0, policyReceiptController_1.getCleanImageUrl)(image.url ?? ''),
                isPlaceholder: false,
                policy_receipt_id: image.policy_receipt_id ?? '', // fallback to empty string if null
            })),
            remark: receipt.remark,
            is_deleted: receipt.is_deleted ?? false // fallback to false if null
        }));
        return mappedReceipts;
    }
    catch (err) {
        console.error('Error in repository getPolicyReceiptsByTimePeriod:', err);
        throw new AppError_1.AppError(500, 'ServerError', 'Error retrieving policy receipts by time period', err);
    }
};
exports.getPolicyReceiptsByTimePeriod = getPolicyReceiptsByTimePeriod;
