import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { config } from 'dotenv';
import {
  createPolicyReceipt as createPolicyReceiptRepo,
  createUploadedDocument,
  getAllPolicyReceipts as getAllPolicyReceiptsRepo,
  getPolicyReceiptById,
  updatePolicyReceipt as updatePolicyReceiptRepo,
  deletePolicyReceipt as deletePolicyReceiptRepo,
  getPolicyReceiptsByTimePeriod as getPolicyReceiptsByTimePeriodRepo,
} from '../repositories/policyReceiptRepository';
import { getPublicUrl, uploadFile } from '../utils/fileStorage';
import { asyncTryCatch } from '../utils/errorHandler';
import { createPolicyReceiptSchema, updatePolicyReceiptSchema, getPolicyReceiptSchema, deletePolicyReceiptSchema, getPolicyReceiptsByTimePeriodSchema } from '../schemas/policyReceiptSchema';
import { FileType, DocumentCategory } from '@prisma/client';

// Load environment variables
config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

const pipelineAsync = promisify(pipeline);

// Helper: Clean image URL for frontend
export function getCleanImageUrl(url: string): string {
  let fullUrl = getPublicUrl(url);
  fullUrl = fullUrl.replace(/([^:])\/+/g, '$1/');
  return fullUrl;
}

// Helper: Normalize file field to array
function toArray(fileOrArray: any) {
  if (!fileOrArray) return [];
  return Array.isArray(fileOrArray) ? fileOrArray : [fileOrArray];
}

// Helper: Extract user ID from JWT
function extractUserIdFromRequest(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return undefined;
  if (!JWT_SECRET) return undefined;
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === 'object' && decoded && 'user_id' in decoded) {
      return (decoded as any).user_id;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

// Create Policy Receipt
export const createPolicyReceipt = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
  const validatedData = createPolicyReceiptSchema.parse({
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
    let policyDocumentId: string | undefined;
    if (files.policy_document) {
      const uploaded = await uploadFile(files.policy_document, policy_number || 'unknown');
      const doc = await createUploadedDocument({
        policy_id: policy_id,
        file_name: uploaded.fileName,
        original_name: files.policy_document.originalname,
        relative_path: uploaded.url,
        category: DocumentCategory.POLICY_DOCUMENT,
        file_type: FileType.PDF, // or infer from extension
        uploaded_by: user_Id,
      });
      policyDocumentId = doc.id;
    }
    // 2. Policyholder Document
    let policyholderDocumentIds: string[] = [];
    if (files.policyholder_document) {
      const uploaded = await uploadFile(files.policyholder_document, policy_number || 'unknown');
      const doc = await createUploadedDocument({
        policy_id: policy_id,
        file_name: uploaded.fileName,
        original_name: files.policyholder_document.originalname,
        relative_path: uploaded.url,
        category: DocumentCategory.PROPOSER_DOCUMENT,
        file_type: FileType.PDF, // or infer from extension
        uploaded_by: user_Id,
        proposer_id: proposer_id,
      });
      policyholderDocumentIds.push(doc.id);
    }
    // 3. Family Member Documents
    let familyMemberDocumentIds: string[] = [];
    const familyMemberFiles = toArray(files.family_member_documents);
    for (let i = 0; i < familyMemberFiles.length; i++) {
      const file = familyMemberFiles[i];
      const uploaded = await uploadFile(file, policy_number || 'unknown');
      const doc = await createUploadedDocument({
        policy_id: policy_id,
        file_name: uploaded.fileName,
        original_name: file.originalname,
        relative_path: uploaded.url,
        category: DocumentCategory.INSURED_MEMBER_DOCUMENT,
        file_type: FileType.PDF, // or infer from extension
        uploaded_by: user_Id,
        insured_member_id: Array.isArray(insured_member_ids) ? insured_member_ids[i] : undefined,
      });
      familyMemberDocumentIds.push(doc.id);
    }
    // 4. Images
    let imageUrls: string[] = [];
    const imageFiles = toArray(files.images);
    for (const file of imageFiles) {
      const uploaded = await uploadFile(file, policy_number || 'unknown');
      imageUrls.push(uploaded.url);
    }

    // --- Create policy receipt in DB ---
    const policyReceipt = await createPolicyReceiptRepo({
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
  } catch (error) {
    // Clean up temp files if error
    Object.values(files).flat().forEach((file: any) => {
      try {
        if (file && file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError);
      }
    });
    throw error;
  }
});

// Get all policy receipts
export const getAllPolicyReceipts = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
  const receipts = await getAllPolicyReceiptsRepo();
  const receiptsWithImages = receipts.map(receipt => ({
    ...receipt,
    images: ((receipt as any).images ?? []).map((image: any) => ({
      ...image,
      directUrl: getCleanImageUrl(image.url),
      isPlaceholder: false
    }))
  }));
  res.status(200).json(receiptsWithImages);
});

// Get single policy receipt
export const getPolicyReceipt = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
  const { params } = getPolicyReceiptSchema.parse({ params: req.params });
  const receipt = await getPolicyReceiptById(params.id);
  if (!receipt) {
    res.status(404).json({ error: 'Policy receipt not found' });
    return;
  }
  res.status(200).json(receipt);
});

// Update policy receipt
export const updatePolicyReceipt = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
  const validatedData = updatePolicyReceiptSchema.parse({
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
  let policyDocumentId: string | undefined;
  if (files.policy_document) {
    const uploaded = await uploadFile(files.policy_document, policy_number || 'unknown');
    const doc = await createUploadedDocument({
      policy_id: policy_id,
      file_name: uploaded.fileName,
      original_name: files.policy_document.originalname,
      relative_path: uploaded.url,
      category: DocumentCategory.POLICY_DOCUMENT,
      file_type: FileType.PDF, // or infer from extension
      uploaded_by: user_Id,
    });
    policyDocumentId = doc.id;
  }
  // 2. Policyholder Document
  let policyholderDocumentIds: string[] = [];
  if (files.policyholder_document) {
    const uploaded = await uploadFile(files.policyholder_document, policy_number || 'unknown');
    const doc = await createUploadedDocument({
      policy_id: policy_id,
      file_name: uploaded.fileName,
      original_name: files.policyholder_document.originalname,
      relative_path: uploaded.url,
      category: DocumentCategory.PROPOSER_DOCUMENT,
      file_type: FileType.PDF, // or infer from extension
      uploaded_by: user_Id,
      proposer_id: proposer_id,
    });
    policyholderDocumentIds.push(doc.id);
  }
  // 3. Family Member Documents
  let familyMemberDocumentIds: string[] = [];
  const familyMemberFiles = toArray(files.family_member_documents);
  for (let i = 0; i < familyMemberFiles.length; i++) {
    const file = familyMemberFiles[i];
    const uploaded = await uploadFile(file, policy_number || 'unknown');
    const doc = await createUploadedDocument({
      policy_id: policy_id,
      file_name: uploaded.fileName,
      original_name: file.originalname,
      relative_path: uploaded.url,
      category: DocumentCategory.INSURED_MEMBER_DOCUMENT,
      file_type: FileType.PDF, // or infer from extension
      uploaded_by: user_Id,
      insured_member_id: Array.isArray(insured_member_ids) ? insured_member_ids[i] : undefined,
    });
    familyMemberDocumentIds.push(doc.id);
  }
  // 4. Images
  let imageUrls: string[] = [];
  const imageFiles = toArray(files.images);
  for (const file of imageFiles) {
    const uploaded = await uploadFile(file, policy_number || 'unknown');
    imageUrls.push(uploaded.url);
  }

  // --- Update policy receipt in DB ---
  const updatedReceipt = await updatePolicyReceiptRepo(id, {
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
    images: ((updatedReceipt as any).images ?? []).map((img: any) => ({ url: img.url, directUrl: getCleanImageUrl(img.url), isPlaceholder: false })),
  });
});

// Delete policy receipt
export const deletePolicyReceipt = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
  const { params } = deletePolicyReceiptSchema.parse({ params: req.params });
  await deletePolicyReceiptRepo(params.id);
  res.status(204).end();
});

// Get policy receipts by time period
export const getPolicyReceiptsByTimePeriod = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
  const validatedData = getPolicyReceiptsByTimePeriodSchema.parse({
    params: req.params,
    query: req.query
  });

  const { timePeriod } = validatedData.params;
  // Only pass one argument as per repository signature
  const receipts = await getPolicyReceiptsByTimePeriodRepo(timePeriod);
  res.status(200).json(receipts);
});
