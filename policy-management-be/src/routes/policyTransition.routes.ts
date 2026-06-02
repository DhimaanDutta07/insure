import { Router } from 'express';
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

// Policy transition routes
router.post('/policies/:parentPolicyId/renew', createPolicyRenewal);
router.post('/policies/:parentPolicyId/migrate', createPolicyMigration);
router.post('/policies/:parentPolicyId/port', createPolicyPortability);

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