import { PolicyReceipt } from '@prisma/client';
import {
  createPolicyReceipt as createPolicyReceiptRepo,
  updatePolicyReceipt as updatePolicyReceiptRepo,
  deletePolicyReceipt as deletePolicyReceiptRepo,
  getAllPolicyReceipts,
  getPolicyReceiptById,
  getPolicyReceiptsByTimePeriod,
  createUploadedDocument,
} from '../repositories/policyReceiptRepository';
import { uploadFile } from '../utils/fileStorage';
import { FileType, DocumentCategory } from '@prisma/client';

export const addPolicyReceipt = async (
  data: {
    policy_number: string;
    policy_type: string;
    remark?: string;
    user_id: string;
    site_id?: string;
    files: {
      policy_document?: Express.Multer.File;
      policyholder_document?: Express.Multer.File;
      family_member_documents?: Express.Multer.File[];
      images?: Express.Multer.File[];
    };
    policy_id?: string;
    proposer_id?: string;
    insured_member_ids?: string[];
  }
): Promise<PolicyReceipt> => {
  const { files, policy_id, proposer_id, insured_member_ids, ...rest } = data;
  // 1. Policy Document
  let policyDocumentId: string | undefined;
  if (files.policy_document) {
    const uploaded = await uploadFile(files.policy_document, rest.policy_number || data.policy_number || 'unknown');
    const doc = await createUploadedDocument({
      policy_id: policy_id!,
      file_name: uploaded.fileName,
      original_name: files.policy_document.originalname,
      relative_path: uploaded.url,
      category: DocumentCategory.POLICY_DOCUMENT,
      file_type: FileType.PDF,
      uploaded_by: rest.user_id,
    });
    policyDocumentId = doc.id;
  }
  // 2. Policyholder Document
  let policyholderDocumentIds: string[] = [];
  if (files.policyholder_document) {
    const uploaded = await uploadFile(files.policyholder_document, rest.policy_number || data.policy_number || 'unknown');
    const doc = await createUploadedDocument({
      policy_id: policy_id!,
      file_name: uploaded.fileName,
      original_name: files.policyholder_document.originalname,
      relative_path: uploaded.url,
      category: DocumentCategory.PROPOSER_DOCUMENT,
      file_type: FileType.PDF,
      uploaded_by: rest.user_id,
      proposer_id: proposer_id,
    });
    policyholderDocumentIds.push(doc.id);
  }
  // 3. Family Member Documents
  let familyMemberDocumentIds: string[] = [];
  if (files.family_member_documents && Array.isArray(files.family_member_documents)) {
    for (let i = 0; i < files.family_member_documents.length; i++) {
      const file = files.family_member_documents[i];
      const uploaded = await uploadFile(file, rest.policy_number || data.policy_number || 'unknown');
      const doc = await createUploadedDocument({
        policy_id: policy_id!,
        file_name: uploaded.fileName,
        original_name: file.originalname,
        relative_path: uploaded.url,
        category: DocumentCategory.INSURED_MEMBER_DOCUMENT,
        file_type: FileType.PDF,
        uploaded_by: rest.user_id,
        insured_member_id: Array.isArray(insured_member_ids) ? insured_member_ids[i] : undefined,
      });
      familyMemberDocumentIds.push(doc.id);
    }
  }
  // 4. Images
  let imageUrls: string[] = [];
  if (files.images && Array.isArray(files.images)) {
    for (const file of files.images) {
      const uploaded = await uploadFile(file, rest.policy_number || data.policy_number || 'unknown');
      imageUrls.push(uploaded.url);
    }
  }
  // Create PolicyReceipt
  return createPolicyReceiptRepo({
    policy_number: rest.policy_number,
    policy_type: rest.policy_type,
    remark: rest.remark,
    user_id: rest.user_id,
    policy_document_id: policyDocumentId,
    images: imageUrls,
  });
};

export const fetchAllPolicyReceipts = async () => getAllPolicyReceipts();
export const fetchPolicyReceiptById = async (id: string) => getPolicyReceiptById(id);

export const updatePolicyReceiptService = async (
  id: string,
  data: {
    policy_number?: string;
    policy_type?: string;
    remark?: string;
    user_id?: string;
    files?: {
      policy_document?: Express.Multer.File;
      policyholder_document?: Express.Multer.File;
      family_member_documents?: Express.Multer.File[];
      images?: Express.Multer.File[];
    };
    policy_id?: string;
    proposer_id?: string;
    insured_member_ids?: string[];
  }
) => {
  const { files = {}, policy_id, proposer_id, insured_member_ids, ...rest } = data;
  // 1. Policy Document
  let policyDocumentId: string | undefined;
  if (files.policy_document) {
    const uploaded = await uploadFile(files.policy_document, rest.policy_number || data.policy_number || 'unknown');
    const doc = await createUploadedDocument({
      policy_id: policy_id!,
      file_name: uploaded.fileName,
      original_name: files.policy_document.originalname,
      relative_path: uploaded.url,
      category: DocumentCategory.POLICY_DOCUMENT,
      file_type: FileType.PDF,
      uploaded_by: rest.user_id!,
    });
    policyDocumentId = doc.id;
  }
  // 2. Policyholder Document
  let policyholderDocumentIds: string[] = [];
  if (files.policyholder_document) {
    const uploaded = await uploadFile(files.policyholder_document, rest.policy_number || data.policy_number || 'unknown');
    const doc = await createUploadedDocument({
      policy_id: policy_id!,
      file_name: uploaded.fileName,
      original_name: files.policyholder_document.originalname,
      relative_path: uploaded.url,
      category: DocumentCategory.PROPOSER_DOCUMENT,
      file_type: FileType.PDF,
      uploaded_by: rest.user_id!,
      proposer_id: proposer_id,
    });
    policyholderDocumentIds.push(doc.id);
  }
  // 3. Family Member Documents
  let familyMemberDocumentIds: string[] = [];
  if (files.family_member_documents && Array.isArray(files.family_member_documents)) {
    for (let i = 0; i < files.family_member_documents.length; i++) {
      const file = files.family_member_documents[i];
      const uploaded = await uploadFile(file, rest.policy_number || data.policy_number || 'unknown');
      const doc = await createUploadedDocument({
        policy_id: policy_id!,
        file_name: uploaded.fileName,
        original_name: file.originalname,
        relative_path: uploaded.url,
        category: DocumentCategory.INSURED_MEMBER_DOCUMENT,
        file_type: FileType.PDF,
        uploaded_by: rest.user_id!,
        insured_member_id: Array.isArray(insured_member_ids) ? insured_member_ids[i] : undefined,
      });
      familyMemberDocumentIds.push(doc.id);
    }
  }
  // 4. Images
  let imageUrls: string[] = [];
  if (files.images && Array.isArray(files.images)) {
    for (const file of files.images) {
      const uploaded = await uploadFile(file, rest.policy_number || data.policy_number || 'unknown');
      imageUrls.push(uploaded.url);
    }
  }
  // Update PolicyReceipt
  return updatePolicyReceiptRepo(id, {
    ...rest,
    policy_document_id: policyDocumentId,
    images: imageUrls.length > 0 ? imageUrls : undefined,
  });
};

export const removePolicyReceipt = async (id: string) => deletePolicyReceiptRepo(id);

export const getPolicyReceiptsByTimePeriodService = async (
  arg: string | { start: string; end: string }
) => getPolicyReceiptsByTimePeriod(arg);