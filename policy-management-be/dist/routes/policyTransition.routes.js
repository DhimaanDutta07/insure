"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const policyTransition_controller_1 = require("../controllers/policyTransition.controller");
const router = (0, express_1.Router)();
// Configure multer for file uploads
const uploadPath = process.env.VERCEL ? "/tmp/uploads" : (process.env.STORAGE_DIR || path_1.default.join(process.cwd(), "storage"));
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        const destination = path_1.default.join(uploadPath, 'policy-documents');
        // Ensure directory exists
        if (!fs_1.default.existsSync(destination)) {
            fs_1.default.mkdirSync(destination, { recursive: true });
        }
        cb(null, destination);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
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
        }
        else {
            cb(new Error('Invalid file type. Only PDF, images, and documents are allowed.'));
        }
    }
});
// Policy transition routes with file upload support
router.post('/policies/:parentPolicyId/renew', upload.array('documents', 10), policyTransition_controller_1.createPolicyRenewal);
router.post('/policies/:parentPolicyId/migrate', upload.array('documents', 10), policyTransition_controller_1.createPolicyMigration);
router.post('/policies/:parentPolicyId/port', upload.array('documents', 10), policyTransition_controller_1.createPolicyPortability);
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
