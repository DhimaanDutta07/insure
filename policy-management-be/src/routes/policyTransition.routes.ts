import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  createPolicyRenewal,
  createPolicyMigration,
  createPolicyPortability,
  getPolicyTransitionHistory,
  getPolicyDocuments,
  validateTransitionEligibility,
  getDocumentAccessStats,
  clearDocumentCache,
  getDocumentTransferStats,
  deleteDocumentReference,
  updateExistingReferencesToDeletable
} from '../controllers/policyTransition.controller';

const router = Router();

// Configure multer for file uploads
const uploadPath = process.env.VERCEL ? "/tmp/uploads" : (process.env.STORAGE_DIR || path.join(process.cwd(), "storage"));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const destination = path.join(uploadPath, 'policy-documents');

    // Ensure directory exists
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
    }

    cb(null, destination);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, images, and documents are allowed.'));
    }
  }
});

// Policy transition routes with file upload support
router.post('/policies/:parentPolicyId/renew', upload.array('documents', 10), createPolicyRenewal);
router.post('/policies/:parentPolicyId/migrate', upload.array('documents', 10), createPolicyMigration);
router.post('/policies/:parentPolicyId/port', upload.array('documents', 10), createPolicyPortability);

// Policy history and document access routes
router.get('/policies/:policyId/transition-history', getPolicyTransitionHistory);
router.get('/policies/:policyId/documents', getPolicyDocuments);
router.get('/policies/:parentPolicyId/validate-eligibility', validateTransitionEligibility);
router.get('/policies/:policyId/document-stats', getDocumentAccessStats);
router.delete('/policies/:policyId/document-cache', clearDocumentCache);

// Document transfer statistics route
router.get('/policies/:parentPolicyId/document-transfer-stats', getDocumentTransferStats);

// Delete document reference route
router.delete('/document-references/:referenceId', deleteDocumentReference);

// Migration route to update existing references
router.patch('/document-references/migrate-to-deletable', updateExistingReferencesToDeletable);

export default router; 