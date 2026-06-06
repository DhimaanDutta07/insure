"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//src/routes/vendorRoutes.ts
const express_1 = __importDefault(require("express"));
const AuthMiddleware_1 = require("../../middlewares/AuthMiddleware");
const userController_1 = require("../../controllers/userController");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const prismaClient_1 = __importDefault(require("../../utils/prismaClient"));
// import { assignMultipleSitesToUser, assignSiteToUser, createSite, getAllSites, updateSite } from "../../controllers/siteController";
// import { createItemGroup, createItemName, deleteItemGroup, deleteItemName, getAllItemGroups, getAllItemNames, getItemGroup, getItemName, getItemNames, updateItemGroup, updateItemName } from "../../controllers/itemGroupController";
// import { createMaterialReceipt, deleteMaterialReceipt, getAllMaterialReceipts, getMaterialReceipt, updateMaterialReceipt,
//   getMaterialReceiptsByTimePeriod
//  } from "../../controllers/materialReceiptController";
const enquiry_controller_1 = require("../../controllers/enquiry.controller");
// import { clientController } from "../../controllers/clientController";
// import { reimbursementController } from "../../controllers/reimbursementController";
//  import { createClient, deleteClient, getAllClients, getClientById, updateClient } from "../../controllers/clientController";
const revenueController_1 = require("../../controllers/revenueController");
// import { createRevenue, deleteRevenue, getRevenuesByTimePeriod, updateRevenue } from "../../controllers/revenueController";
const companyController_1 = require("../../controllers/companyController");
const policy_controller_1 = require("../../controllers/policy.controller");
const agentController_1 = require("../../controllers/agentController");
const commissionController_1 = require("../../controllers/commissionController");
const companyFormFieldController_1 = require("../../controllers/companyFormFieldController");
const policyReceiptController_1 = require("../../controllers/policyReceiptController");
const policyGroupController = __importStar(require("../../controllers/policyGroupController"));
const policyTypeController_1 = require("../../controllers/policyTypeController");
const commissionRuleController_1 = require("../../controllers/commissionRuleController");
const bulkImportController_1 = require("../../bulkImport/bulkImportController");
const claims_1 = __importDefault(require("./claims"));
const policyTransition_routes_1 = __importDefault(require("../policyTransition.routes"));
// import { 
//   // AssignPO, 
//   createTruckRegistration, DashboardDetails, generateToken, 
//   // getAllTruckHavingActivePO, 
//   getTodaysTruckRegistrationsByUser, getTruckRegistrationById, getTruckRegistrations } from "../../controllers/truckRegistrationController";
// import { createWeighingInspection, getTodaysWeighingInspectionsByUser, getTruckWeighing, getWeighingInspectionById, getWeighingInspectionsByTruckNumber } from "../../controllers/weighingInspectionController";
// import { createQualityInspection, getTodaysQualityInspectionsByUser } from "../../controllers/qualityInspectionController";
// import { createMaterialUnloading, getTodaysMaterialUnloadingsByUser } from "../../controllers/materialUnloadingController";
// import { createRawMaterial, deleteRawMaterial, getRawMaterialById, getRawMaterials, searchRawMaterials, updateRawMaterial } from "../../controllers/materialController";
// import { vendorCreateSchema, vendorUpdateSchema } from "../../schemas/vendorSchema";
// import { createPurchaseOrder, deletePurchaseOrder, downloadPurchaseOrder, getAllPurchaseOrders, getPurchaseOrder, updatePurchaseOrder,searchPurchaseOrders, getOrderAnalytics, getPurchaseOrderTrucks, getPurchaseOrders } from "../../controllers/purchaseOrderController";
// import { createTruck, deleteTruck, getAllTrucksDetails, getTruckById, getTrucks, searchTrucks } from "../../controllers/truckController";
// import { CreateTruckSchema } from "../../schemas/truckSchema";
// Use consistent storage path with upload logic
const uploadPath = process.env.VERCEL ? "/tmp/uploads" : (process.env.STORAGE_DIR || path_1.default.join(process.cwd(), "storage"));
try {
    if (!fs_1.default.existsSync(uploadPath)) {
        fs_1.default.mkdirSync(uploadPath, { recursive: true });
    }
    const materialReceiptsImagesPath = path_1.default.join(uploadPath, "material-receipts", "images");
    if (!fs_1.default.existsSync(materialReceiptsImagesPath)) {
        fs_1.default.mkdirSync(materialReceiptsImagesPath, { recursive: true });
    }
    const policyDocsPath = path_1.default.join(uploadPath, "policy-documents");
    if (!fs_1.default.existsSync(policyDocsPath)) {
        fs_1.default.mkdirSync(policyDocsPath, { recursive: true });
    }
}
catch (err) { }
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        // Check if this is a policy-related upload
        if (req.originalUrl.includes('/policies')) {
            const destination = path_1.default.join(uploadPath, 'policy-documents');
            // Ensure directory exists
            if (!fs_1.default.existsSync(destination)) {
                fs_1.default.mkdirSync(destination, { recursive: true });
            }
            cb(null, destination);
        }
        else {
            // Default to material receipts for other uploads
            const destination = path_1.default.join(uploadPath, 'material-receipts', 'images');
            console.log(`File upload destination: ${destination}`);
            cb(null, destination);
        }
    },
    filename: function (req, file, cb) {
        // Use UUID instead of timestamp to be consistent with our storage format
        const fileExtension = file.originalname.split('.').pop() || '';
        const uuid = require('uuid').v4();
        const filename = `${uuid}.${fileExtension}`;
        console.log(`Generated filename: ${filename} for original: ${file.originalname}`);
        cb(null, filename);
    },
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
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv' // .csv
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only PDF, JPG, PNG, DOC, XLSX, XLS, and CSV files are allowed.'));
        }
    }
});
const importFileFilter = (_, file, cb) => {
    const allowedTypes = [
        'text/csv',
        'application/csv',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only CSV and XLSX files are allowed for import.'));
    }
};
const importUpload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: importFileFilter,
});
const router = express_1.default.Router();
// CORS middleware specifically for policy documents
router.use('/uploads/policy-documents/*', (req, res, next) => {
    // Set CORS headers for all requests (including preflight OPTIONS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, role');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    next();
});
// Serve policy documents with policy-specific folder structure (MUST be before express.static)
router.get('/uploads/policy-documents/*', async (req, res) => {
    try {
        const params = req.params;
        const filePath = params[0]; // Gets everything after /uploads/policy-documents/
        const fileName = path_1.default.basename(filePath);
        // 1. Try to serve from database first (works on Vercel and persistent)
        const doc = await prismaClient_1.default.uploadedDocument.findFirst({
            where: { file_name: fileName }
        });
        if (doc?.file_data) {
            const ext = path_1.default.extname(fileName).toLowerCase();
            const contentTypes = {
                '.jpeg': 'image/jpeg',
                '.jpg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.pdf': 'application/pdf',
                '.doc': 'application/msword',
                '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                '.xls': 'application/vnd.ms-excel',
                '.csv': 'text/csv'
            };
            const contentType = contentTypes[ext] || 'application/octet-stream';
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `inline; filename="${doc.original_name || fileName}"`);
            res.setHeader('Cache-Control', 'public, max-age=3600');
            const buffer = Buffer.from(doc.file_data);
      res.send(buffer);
            return;
        }
        // 2. Fallback to disk for legacy files
        const fullPath = path_1.default.join(uploadPath, 'policy-documents', filePath);
        // Security: Prevent directory traversal
        if (!fullPath.startsWith(path_1.default.join(uploadPath, 'policy-documents'))) {
            console.log(`Invalid file path attempt: ${fullPath}`);
            res.status(400).json({ error: 'Invalid file path' });
            return;
        }
        let resolvedPath = fullPath;
        if (!fs_1.default.existsSync(resolvedPath)) {
            const flatPath = path_1.default.join(uploadPath, 'policy-documents', fileName);
            if (fs_1.default.existsSync(flatPath)) {
                resolvedPath = flatPath;
            }
            else {
                console.log(`File not found: ${fullPath} (also tried ${flatPath})`);
                if (process.env.VERCEL) {
                    res.status(404).json({
                        error: 'File not found',
                        message: 'This file may have been lost due to Vercel serverless environment limitations. Please re-upload the document.',
                        isEphemeral: true
                    });
                }
                else {
                    res.status(404).json({ error: 'File not found' });
                }
                return;
            }
        }
        const ext = path_1.default.extname(resolvedPath).toLowerCase();
        const contentTypes = {
            '.jpeg': 'image/jpeg',
            '.jpg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.xls': 'application/vnd.ms-excel',
            '.csv': 'text/csv'
        };
        const contentType = contentTypes[ext] || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${path_1.default.basename(resolvedPath)}"`);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        const fileStream = fs_1.default.createReadStream(resolvedPath);
        fileStream.pipe(res);
        fileStream.on('error', (error) => {
            console.error('Error streaming file:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Error serving file' });
            }
        });
    }
    catch (error) {
        console.error('Error serving policy document:', error);
        res.status(500).json({ error: 'Error serving file' });
    }
});
// CORS + static middleware for all other uploads (registered AFTER policy-documents route)
router.use('/uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, role');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    next();
}, express_1.default.static(uploadPath));
// user Routes
router.post("/auth/login", userController_1.login);
router.get("/user/validate", (0, AuthMiddleware_1.restrictTo)(['ADMIN', "OPERATIONS"]), userController_1.validateUser);
// router.post("/auth/admin/register", register);
router.post('/send-otp', userController_1.sendUserOTP);
router.post('/verify-otp', userController_1.verifyUserOTP);
router.post("/register", (0, AuthMiddleware_1.restrictTo)(["ADMIN"]), userController_1.createUserByAdmin);
router.get("/users", (0, AuthMiddleware_1.restrictTo)(["ADMIN", "OPERATIONS"]), userController_1.getAllUsers);
router.patch("/user/:id", (0, AuthMiddleware_1.restrictTo)(["ADMIN"]), userController_1.updateUser);
router.delete("/user/:id", (0, AuthMiddleware_1.restrictTo)(["ADMIN"]), userController_1.deleteUser);
router.patch("/user/:id/status", (0, AuthMiddleware_1.restrictTo)(["ADMIN"]), userController_1.updateUserStatus);
router.post("/enquiries", (0, AuthMiddleware_1.restrictTo)(['ADMIN']), enquiry_controller_1.enquiryController.createEnquiry);
router.get("/enquiries", (0, AuthMiddleware_1.restrictTo)(['ADMIN']), enquiry_controller_1.enquiryController.getAllEnquiries);
router.get("/enquiries/:id", (0, AuthMiddleware_1.restrictTo)(['ADMIN']), enquiry_controller_1.enquiryController.getEnquiryById);
router.put("/enquiries/:id", (0, AuthMiddleware_1.restrictTo)(['ADMIN']), enquiry_controller_1.enquiryController.updateEnquiry);
router.delete("/enquiries/:id", (0, AuthMiddleware_1.restrictTo)(['ADMIN']), enquiry_controller_1.enquiryController.deleteEnquiry);
router.get("/my-enquiries", (0, AuthMiddleware_1.restrictTo)(['ADMIN']), enquiry_controller_1.enquiryController.getMyEnquiries); // New route for user-specific enquiries
// Revenue routes
router.get('/revenues/time-period/:timePeriod/siteId/:siteId', (0, AuthMiddleware_1.restrictTo)(['ADMIN']), revenueController_1.getRevenuesByTimePeriod);
router.get('/revenues', (0, AuthMiddleware_1.restrictTo)(['ADMIN']), revenueController_1.getAllRevenues);
router.get('/revenues/:id', (0, AuthMiddleware_1.restrictTo)(['ADMIN']), revenueController_1.getRevenue);
router.post('/revenues', (0, AuthMiddleware_1.restrictTo)(['ADMIN']), revenueController_1.createRevenueHandler);
router.patch('/revenues/:id', (0, AuthMiddleware_1.restrictTo)(['ADMIN']), revenueController_1.updateRevenueHandler);
router.delete('/revenues/:id', (0, AuthMiddleware_1.restrictTo)(['ADMIN']), revenueController_1.deleteRevenueHandler);
router.get("/companies", companyController_1.companyController.getAllCompanies);
router.get("/companies/:id/form-fields", companyController_1.companyController.getCompanyFormFields);
// Public endpoints for policy creation forms
router.get("/policy-groups/public", policyGroupController.getAllPolicyGroups);
router.get("/policy-names/public", policyGroupController.getAllPolicyNames);
router.get("/policy-groups/:id/policy-names/public", policyGroupController.getPolicyNames);
// Helper to wrap async route handlers for Express
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
// Policy routes with file upload
// Dynamic upload validator to support memberDocs_<index>
function validatePolicyUploadFields(req, res, next) {
    const files = req.files;
    if (!files)
        return next();
    // Normalize to array
    const filesArray = Array.isArray(files)
        ? files
        : Object.values(files).flat();
    const byField = new Map();
    filesArray.forEach((f) => {
        const arr = byField.get(f.fieldname) || [];
        arr.push(f);
        byField.set(f.fieldname, arr);
    });
    const count = (name) => (byField.get(name)?.length || 0);
    if (count('policyDocs') > 5) {
        return res.status(400).json({ error: 'Too many files', message: 'You can upload a maximum of 5 policy documents' });
    }
    if (count('proposerDocs') > 5) {
        return res.status(400).json({ error: 'Too many files', message: 'You can upload a maximum of 5 proposer documents' });
    }
    // Legacy flat memberDocs cap
    if (count('memberDocs') > 10) {
        return res.status(400).json({ error: 'Too many files', message: 'You can upload a maximum of 10 member documents (legacy field)' });
    }
    // Per-member dynamic caps: memberDocs_<index> up to 5 each
    for (const [field, arr] of byField.entries()) {
        if (field.startsWith('memberDocs_') && arr.length > 5) {
            return res.status(400).json({ error: 'Too many files', message: `You can upload a maximum of 5 documents for ${field}` });
        }
    }
    next();
}
router.post("/policies", (0, AuthMiddleware_1.restrictTo)(['ADMIN', 'OPERATIONS']), upload.any(), validatePolicyUploadFields, asyncHandler(policy_controller_1.policyController.createPolicy));
router.patch("/policies/:id", (0, AuthMiddleware_1.restrictTo)(['ADMIN', 'OPERATIONS']), upload.any(), validatePolicyUploadFields, asyncHandler(policy_controller_1.policyController.updatePolicy));
router.get("/policies", (0, AuthMiddleware_1.restrictTo)(['ADMIN', 'OPERATIONS']), asyncHandler(policy_controller_1.policyController.getAllPolicies));
router.get("/policies/dashboard-stats", (0, AuthMiddleware_1.restrictTo)(['ADMIN', 'OPERATIONS']), asyncHandler(policy_controller_1.policyController.dashboardStats));
router.get("/policies/:id", (0, AuthMiddleware_1.restrictTo)(['ADMIN', 'OPERATIONS']), asyncHandler(policy_controller_1.policyController.getPolicyById));
router.delete("/policies/:id", (0, AuthMiddleware_1.restrictTo)(['ADMIN', 'OPERATIONS']), asyncHandler(policy_controller_1.policyController.deletePolicy));
router.get("/my-policies", (0, AuthMiddleware_1.restrictTo)(['ADMIN', 'OPERATIONS']), asyncHandler(policy_controller_1.policyController.getMyPolicies));
// Document management routes
router.delete("/documents/:id", (0, AuthMiddleware_1.restrictTo)(['ADMIN', 'OPERATIONS']), asyncHandler(policy_controller_1.policyController.deleteDocument));
router.get("/documents/:id/url", (0, AuthMiddleware_1.restrictTo)(['ADMIN', 'OPERATIONS']), asyncHandler(policy_controller_1.policyController.getDocumentUrl));
// Bulk import policies (CSV/XLSX)
// router.post(
//   '/policies/import',
//   restrictTo(['ADMIN', 'OPERATIONS']),
//   importUpload.single('file'),
//   asyncHandler(policyController.importPolicies)
// );
// Add new bulk import route (keep old one untouched)
router.post('/policies/import', (0, AuthMiddleware_1.restrictTo)(['ADMIN', 'OPERATIONS']), importUpload.single('file'), bulkImportController_1.importPoliciesBulkHandler);
// PolicyReceipt routes
router.post('/policy-receipts', (0, AuthMiddleware_1.restrictTo)(['ADMIN', 'OPERATIONS']), upload.fields([
    { name: 'policy_document', maxCount: 1 },
    { name: 'policyholder_document', maxCount: 1 },
    { name: 'family_member_documents', maxCount: 10 },
    { name: 'images', maxCount: 10 },
]), policyReceiptController_1.createPolicyReceipt);
router.patch('/policy-receipts/:id', (0, AuthMiddleware_1.restrictTo)(['ADMIN', 'OPERATIONS']), upload.fields([
    { name: 'policy_document', maxCount: 1 },
    { name: 'policyholder_document', maxCount: 1 },
    { name: 'family_member_documents', maxCount: 10 },
    { name: 'images', maxCount: 10 },
]), policyReceiptController_1.updatePolicyReceipt);
router.get('/policy-receipts', (0, AuthMiddleware_1.restrictTo)(['ADMIN', 'OPERATIONS']), policyReceiptController_1.getAllPolicyReceipts);
router.get('/policy-receipts/:id', (0, AuthMiddleware_1.restrictTo)(['ADMIN', 'OPERATIONS']), policyReceiptController_1.getPolicyReceipt);
router.delete('/policy-receipts/:id', (0, AuthMiddleware_1.restrictTo)(['ADMIN', 'OPERATIONS']), policyReceiptController_1.deletePolicyReceipt);
router.get('/policy-receipts/time-period/:timePeriod', (0, AuthMiddleware_1.restrictTo)(['ADMIN', 'OPERATIONS']), policyReceiptController_1.getPolicyReceiptsByTimePeriod);
// PolicyGroup CRUD (admin only except GET)
router.post('/policy-groups', (0, AuthMiddleware_1.restrictTo)(["ADMIN"]), policyGroupController.createPolicyGroup);
router.get('/policy-groups', (0, AuthMiddleware_1.restrictTo)(['ADMIN', 'OPERATIONS']), policyGroupController.getAllPolicyGroups);
router.get('/policy-groups/:id', (0, AuthMiddleware_1.restrictTo)(['ADMIN', 'OPERATIONS']), policyGroupController.getPolicyGroup);
router.patch('/policy-groups/:id', (0, AuthMiddleware_1.restrictTo)(["ADMIN"]), policyGroupController.updatePolicyGroup);
router.delete('/policy-groups/:id', (0, AuthMiddleware_1.restrictTo)(["ADMIN"]), policyGroupController.deletePolicyGroup);
// PolicyName CRUD (admin only except GET)
router.post('/policy-groups/:id/policy-names', (0, AuthMiddleware_1.restrictTo)(["ADMIN"]), policyGroupController.createPolicyName);
router.get('/policy-names', (0, AuthMiddleware_1.restrictTo)(['ADMIN', 'OPERATIONS']), policyGroupController.getAllPolicyNames);
router.get('/policy-groups/:id/policy-names', (0, AuthMiddleware_1.restrictTo)(['ADMIN', 'OPERATIONS']), policyGroupController.getPolicyNames);
router.get('/policy-names/:id', (0, AuthMiddleware_1.restrictTo)(['ADMIN', 'OPERATIONS']), policyGroupController.getPolicyName);
router.patch('/policy-names/:id', (0, AuthMiddleware_1.restrictTo)(["ADMIN"]), policyGroupController.updatePolicyName);
router.delete('/policy-names/:id', (0, AuthMiddleware_1.restrictTo)(["ADMIN"]), policyGroupController.deletePolicyName);
// PolicyType CRUD (admin only except GET)
router.get('/policy-types', (0, AuthMiddleware_1.restrictTo)(['ADMIN', 'OPERATIONS']), asyncHandler(policyTypeController_1.policyTypeController.getAllPolicyTypes));
router.get('/policy-types/:id', (0, AuthMiddleware_1.restrictTo)(['ADMIN', 'OPERATIONS']), asyncHandler(policyTypeController_1.policyTypeController.getPolicyTypeById));
router.post('/policy-types', (0, AuthMiddleware_1.restrictTo)(["ADMIN"]), asyncHandler(policyTypeController_1.policyTypeController.createPolicyType));
router.patch('/policy-types/:id', (0, AuthMiddleware_1.restrictTo)(["ADMIN"]), asyncHandler(policyTypeController_1.policyTypeController.updatePolicyType));
router.delete('/policy-types/:id', (0, AuthMiddleware_1.restrictTo)(["ADMIN"]), asyncHandler(policyTypeController_1.policyTypeController.deletePolicyType));
// Agent Routes
router.post('/agents', (0, AuthMiddleware_1.restrictTo)(['ADMIN']), (req, res) => { agentController_1.agentController.createAgent(req, res); });
router.get('/agents', (0, AuthMiddleware_1.restrictTo)(['ADMIN']), (req, res) => { agentController_1.agentController.getAllAgents(req, res); });
router.get('/agents/:id', (0, AuthMiddleware_1.restrictTo)(['ADMIN']), (req, res) => { agentController_1.agentController.getAgentById(req, res); });
router.patch('/agents/:id', (0, AuthMiddleware_1.restrictTo)(['ADMIN']), (req, res) => { agentController_1.agentController.updateAgent(req, res); });
router.delete('/agents/:id', (0, AuthMiddleware_1.restrictTo)(['ADMIN']), (req, res) => { agentController_1.agentController.deleteAgent(req, res); });
// Commission Routes
router.post('/commissions', (0, AuthMiddleware_1.restrictTo)(['ADMIN']), (req, res) => { commissionController_1.commissionController.createCommission(req, res); });
router.get('/commissions', (0, AuthMiddleware_1.restrictTo)(['ADMIN', 'OPERATIONS']), (req, res) => { commissionController_1.commissionController.getAllCommissions(req, res); });
router.get('/commissions/:id', (0, AuthMiddleware_1.restrictTo)(['ADMIN']), (req, res) => { commissionController_1.commissionController.getCommissionById(req, res); });
router.patch('/commissions/:id', (0, AuthMiddleware_1.restrictTo)(['ADMIN']), (req, res) => { commissionController_1.commissionController.updateCommission(req, res); });
router.delete('/commissions/:id', (0, AuthMiddleware_1.restrictTo)(['ADMIN']), (req, res) => { commissionController_1.commissionController.deleteCommission(req, res); });
// Commission Rules by Policy Name (for frontend calculation)
router.get('/commission-rules/policy/:policyNameId', (0, AuthMiddleware_1.restrictTo)(['ADMIN', 'OPERATIONS']), (req, res) => { commissionController_1.commissionController.getCommissionRulesByPolicyName(req, res); });
// CommissionRule Routes
router.post('/commission-rules', (0, AuthMiddleware_1.restrictTo)(['ADMIN']), (req, res) => { commissionRuleController_1.commissionRuleController.createCommissionRule(req, res); });
router.get('/commission-rules', (0, AuthMiddleware_1.restrictTo)(['ADMIN', 'OPERATIONS']), (req, res) => { commissionRuleController_1.commissionRuleController.getAllCommissionRules(req, res); });
router.get('/commission-rules/test', (0, AuthMiddleware_1.restrictTo)(['ADMIN']), (req, res) => { commissionRuleController_1.commissionRuleController.testGetAllCommissionRules(req, res); });
router.get('/commission-rules/:id', (0, AuthMiddleware_1.restrictTo)(['ADMIN']), (req, res) => { commissionRuleController_1.commissionRuleController.getCommissionRuleById(req, res); });
router.patch('/commission-rules/:id', (0, AuthMiddleware_1.restrictTo)(['ADMIN']), (req, res) => { commissionRuleController_1.commissionRuleController.updateCommissionRule(req, res); });
router.patch('/commission-rules/:id/status', (0, AuthMiddleware_1.restrictTo)(['ADMIN']), commissionRuleController_1.commissionRuleController.updateCommissionRuleStatus);
router.patch('/commission-rules/policy/:policyNameId/status', (0, AuthMiddleware_1.restrictTo)(['ADMIN']), commissionRuleController_1.commissionRuleController.updateCommissionRulesStatusByPolicyName);
router.delete('/commission-rules/:id', (0, AuthMiddleware_1.restrictTo)(['ADMIN']), (req, res) => { commissionRuleController_1.commissionRuleController.deleteCommissionRule(req, res); });
router.get('/commission-rules/dashboard/stats', (0, AuthMiddleware_1.restrictTo)(['ADMIN']), (req, res) => { commissionRuleController_1.commissionRuleController.getCommissionDashboardStats(req, res); });
// Simplified product-based commission routes
router.get('/commission-rules/product/:policyNameId', (0, AuthMiddleware_1.restrictTo)(['ADMIN', 'OPERATIONS']), (req, res) => { commissionRuleController_1.commissionRuleController.getCommissionByProduct(req, res); });
router.patch('/commission-rules/product/:policyNameId', (0, AuthMiddleware_1.restrictTo)(['ADMIN']), (req, res) => { commissionRuleController_1.commissionRuleController.upsertCommissionByProduct(req, res); });
// Company Routes
router.post('/companies', (0, AuthMiddleware_1.restrictTo)(['ADMIN']), (req, res) => { companyController_1.companyController.createCompany(req, res); });
router.get('/companies', (0, AuthMiddleware_1.restrictTo)(['ADMIN', 'OPERATIONS']), (req, res) => { companyController_1.companyController.getAllCompanies(req, res); });
router.get('/companies/:id', (0, AuthMiddleware_1.restrictTo)(['ADMIN']), (req, res) => { companyController_1.companyController.getCompanyById(req, res); });
router.patch('/companies/:id', (0, AuthMiddleware_1.restrictTo)(['ADMIN']), (req, res) => { companyController_1.companyController.updateCompany(req, res); });
router.delete('/companies/:id', (0, AuthMiddleware_1.restrictTo)(['ADMIN']), (req, res) => { companyController_1.companyController.deleteCompany(req, res); });
router.get('/companies/:id/form-fields', (0, AuthMiddleware_1.restrictTo)(['ADMIN']), (req, res) => { companyController_1.companyController.getCompanyFormFields(req, res); });
// CompanyFormField Routes
router.post('/company-form-fields', (0, AuthMiddleware_1.restrictTo)(['ADMIN']), (req, res) => { companyFormFieldController_1.companyFormFieldController.createCompanyFormField(req, res); });
router.get('/company-form-fields/:companyId', (0, AuthMiddleware_1.restrictTo)(['ADMIN']), (req, res) => { companyFormFieldController_1.companyFormFieldController.getCompanyFormFields(req, res); });
router.get('/company-form-field/:id', (0, AuthMiddleware_1.restrictTo)(['ADMIN']), (req, res) => { companyFormFieldController_1.companyFormFieldController.getCompanyFormFieldById(req, res); });
router.patch('/company-form-field/:id', (0, AuthMiddleware_1.restrictTo)(['ADMIN']), (req, res) => { companyFormFieldController_1.companyFormFieldController.updateCompanyFormField(req, res); });
router.delete('/company-form-field/:id', (0, AuthMiddleware_1.restrictTo)(['ADMIN']), (req, res) => { companyFormFieldController_1.companyFormFieldController.deleteCompanyFormField(req, res); });
// Claim Routes
router.use('/', claims_1.default);
// Policy Transition Routes
router.use('/', policyTransition_routes_1.default);
exports.default = router;
