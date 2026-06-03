"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const policyTransition_controller_1 = require("../controllers/policyTransition.controller");
const router = (0, express_1.Router)();
// Policy transition routes
router.post('/policies/:parentPolicyId/renew', policyTransition_controller_1.createPolicyRenewal);
router.post('/policies/:parentPolicyId/migrate', policyTransition_controller_1.createPolicyMigration);
router.post('/policies/:parentPolicyId/port', policyTransition_controller_1.createPolicyPortability);
// Policy history and document access routes
router.get('/policies/:policyId/transition-history', policyTransition_controller_1.getPolicyTransitionHistory);
router.get('/policies/:policyId/documents', policyTransition_controller_1.getPolicyDocuments);
router.get('/policies/:parentPolicyId/validate-eligibility', policyTransition_controller_1.validateTransitionEligibility);
router.get('/policies/:policyId/document-stats', policyTransition_controller_1.getDocumentAccessStats);
router.delete('/policies/:policyId/document-cache', policyTransition_controller_1.clearDocumentCache);
// Document transfer statistics route
router.get('/policies/:parentPolicyId/document-transfer-stats', policyTransition_controller_1.getDocumentTransferStats);
// Delete document reference route
router.delete('/document-references/:referenceId', policyTransition_controller_1.deleteDocumentReference);
// Migration route to update existing references
router.patch('/document-references/migrate-to-deletable', policyTransition_controller_1.updateExistingReferencesToDeletable);
exports.default = router;
