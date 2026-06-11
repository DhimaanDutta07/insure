//src/routes/vendorRoutes.ts
import express from "express";
// import { vendorController } from "../../controllers/vendorController";
import { authMiddleware, checkPermission } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import { restrictTo } from "../../middlewares/AuthMiddleware";
import { createUserByAdmin, deleteUser, getAllUsers, login, register, sendUserOTP, updateUser, updateUserAppAccess, updateUserStatus, updateUserWebAccess, validateUser, verifyUserOTP } from "../../controllers/userController";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../../utils/prismaClient';
// import { assignMultipleSitesToUser, assignSiteToUser, createSite, getAllSites, updateSite } from "../../controllers/siteController";
// import { createItemGroup, createItemName, deleteItemGroup, deleteItemName, getAllItemGroups, getAllItemNames, getItemGroup, getItemName, getItemNames, updateItemGroup, updateItemName } from "../../controllers/itemGroupController";
// import { createMaterialReceipt, deleteMaterialReceipt, getAllMaterialReceipts, getMaterialReceipt, updateMaterialReceipt,
//   getMaterialReceiptsByTimePeriod
//  } from "../../controllers/materialReceiptController";
import { enquiryController } from "../../controllers/enquiry.controller";
// import { clientController } from "../../controllers/clientController";
// import { reimbursementController } from "../../controllers/reimbursementController";
//  import { createClient, deleteClient, getAllClients, getClientById, updateClient } from "../../controllers/clientController";
import { getRevenuesByTimePeriod, createRevenueHandler, updateRevenueHandler, deleteRevenueHandler, getAllRevenues, getRevenue } from '../../controllers/revenueController';
// import { createRevenue, deleteRevenue, getRevenuesByTimePeriod, updateRevenue } from "../../controllers/revenueController";
import { companyController } from "../../controllers/companyController";
import { policyController } from "../../controllers/policy.controller";
import { agentController } from '../../controllers/agentController';
import { commissionController } from '../../controllers/commissionController';
import { companyFormFieldController } from '../../controllers/companyFormFieldController';
import { createPolicyReceipt, updatePolicyReceipt, getPolicyReceipt, getAllPolicyReceipts, deletePolicyReceipt, getPolicyReceiptsByTimePeriod } from '../../controllers/policyReceiptController';
import * as policyGroupController from '../../controllers/policyGroupController';
import { policyTypeController } from '../../controllers/policyTypeController';
import { commissionRuleController } from '../../controllers/commissionRuleController';
import { importPoliciesBulkHandler } from '../../bulkImport/bulkImportController';
import { requireAuth } from '../../middlewares/AuthMiddleware';
import claimRoutes from './claims';
import policyTransitionRoutes from '../policyTransition.routes';


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
const uploadPath = process.env.VERCEL ? "/tmp/uploads" : (process.env.STORAGE_DIR || path.join(process.cwd(), "storage"));

try {
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
  const materialReceiptsImagesPath = path.join(uploadPath, "material-receipts", "images");
  if (!fs.existsSync(materialReceiptsImagesPath)) {
    fs.mkdirSync(materialReceiptsImagesPath, { recursive: true });
  }
  const policyDocsPath = path.join(uploadPath, "policy-documents");
  if (!fs.existsSync(policyDocsPath)) {
    fs.mkdirSync(policyDocsPath, { recursive: true });
  }
} catch (err) {}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Check if this is a policy-related upload
    if (req.originalUrl.includes('/policies')) {
      const destination = path.join(uploadPath, 'policy-documents');
      
      // Ensure directory exists
      if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination, { recursive: true });
      }
      
      cb(null, destination);
    } else {
      // Default to material receipts for other uploads
      const destination = path.join(uploadPath, 'material-receipts', 'images');
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
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, PNG, DOC, XLSX, XLS, and CSV files are allowed.'));
    }
  }
});
const importFileFilter = (_: any, file: any, cb: any) => {
  const allowedTypes = [
    'text/csv',
    'application/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only CSV and XLSX files are allowed for import.'));
  }
};

const importUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: importFileFilter,
});
const router = express.Router();

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
    const params = req.params as any;
    const filePath = params[0]; // Gets everything after /uploads/policy-documents/
    const fileName = path.basename(filePath);

    // 1. Try to serve from database first (works on Vercel and persistent)
    const doc = await prisma.uploadedDocument.findFirst({
      where: { file_name: fileName }
    });

    if (doc?.file_data) {
      const ext = path.extname(fileName).toLowerCase();
      const contentTypes: Record<string, string> = {
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
    const fullPath = path.join(uploadPath, 'policy-documents', filePath);

    // Security: Prevent directory traversal
    if (!fullPath.startsWith(path.join(uploadPath, 'policy-documents'))) {
      console.log(`Invalid file path attempt: ${fullPath}`);
      res.status(400).json({ error: 'Invalid file path' });
      return;
    }

    let resolvedPath = fullPath;
    if (!fs.existsSync(resolvedPath)) {
      const flatPath = path.join(uploadPath, 'policy-documents', fileName);
      if (fs.existsSync(flatPath)) {
        resolvedPath = flatPath;
      } else {
        console.log(`File not found: ${fullPath} (also tried ${flatPath})`);
        if (process.env.VERCEL) {
          res.status(404).json({
            error: 'File not found',
            message: 'This file may have been lost due to Vercel serverless environment limitations. Please re-upload the document.',
            isEphemeral: true
          });
        } else {
          res.status(404).json({ error: 'File not found' });
        }
        return;
      }
    }

    const ext = path.extname(resolvedPath).toLowerCase();
    const contentTypes: Record<string, string> = {
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
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(resolvedPath)}"`);
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const fileStream = fs.createReadStream(resolvedPath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error serving file' });
      }
    });
  } catch (error) {
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
}, express.static(uploadPath));

// user Routes
router.post("/auth/login", login);
router.get("/user/validate", restrictTo(['ADMIN',"OPERATIONS"]), validateUser);
// router.post("/auth/admin/register", register);
router.post('/send-otp', sendUserOTP);
router.post('/verify-otp', verifyUserOTP);

router.post("/register", restrictTo(["ADMIN"]), createUserByAdmin);
router.get("/users",restrictTo(["ADMIN", "OPERATIONS"]) ,getAllUsers);
router.patch("/user/:id",restrictTo(["ADMIN"]) ,updateUser);
router.delete("/user/:id",restrictTo(["ADMIN"]) ,deleteUser);
router.patch("/user/:id/status",restrictTo(["ADMIN"]) ,updateUserStatus);


router.post("/enquiries", restrictTo(['ADMIN']), enquiryController.createEnquiry  as any);
router.get("/enquiries", restrictTo(['ADMIN']), enquiryController.getAllEnquiries as any);
router.get("/enquiries/:id", restrictTo(['ADMIN']), enquiryController.getEnquiryById as any);
router.put("/enquiries/:id", restrictTo(['ADMIN']), enquiryController.updateEnquiry as any);
router.delete("/enquiries/:id", restrictTo(['ADMIN']), enquiryController.deleteEnquiry as any);
router.get("/my-enquiries", restrictTo(['ADMIN']), enquiryController.getMyEnquiries as any); // New route for user-specific enquiries

// Revenue routes
router.get('/revenues/time-period/:timePeriod/siteId/:siteId', restrictTo(['ADMIN']), getRevenuesByTimePeriod);

router.get('/revenues', restrictTo(['ADMIN']), getAllRevenues);
router.get('/revenues/:id', restrictTo(['ADMIN']), getRevenue);
router.post('/revenues', restrictTo(['ADMIN']), createRevenueHandler);
router.patch('/revenues/:id', restrictTo(['ADMIN']), updateRevenueHandler);
router.delete('/revenues/:id', restrictTo(['ADMIN']), deleteRevenueHandler);

router.get("/companies", companyController.getAllCompanies);
router.get("/companies/:id/form-fields", companyController.getCompanyFormFields);

// Public endpoints for policy creation forms
router.get("/policy-groups/public", policyGroupController.getAllPolicyGroups);
router.get("/policy-names/public", policyGroupController.getAllPolicyNames);
router.get("/policy-groups/:id/policy-names/public", policyGroupController.getPolicyNames);

// Helper to wrap async route handlers for Express
function asyncHandler(fn: any) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Policy routes with file upload
// Dynamic upload validator to support memberDocs_<index>
function validatePolicyUploadFields(req: any, res: any, next: any) {
  const files = req.files as Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] } | undefined;
  if (!files) return next();

  // Normalize to array
  const filesArray: Express.Multer.File[] = Array.isArray(files)
    ? files
    : Object.values(files).flat();

  const byField = new Map<string, Express.Multer.File[]>();
  filesArray.forEach((f) => {
    const arr = byField.get(f.fieldname) || [];
    arr.push(f);
    byField.set(f.fieldname, arr);
  });

  const count = (name: string) => (byField.get(name)?.length || 0);

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

router.post(
  "/policies",
  restrictTo(['ADMIN','OPERATIONS']),
  upload.any(),
  validatePolicyUploadFields,
  asyncHandler(policyController.createPolicy)
);
router.patch(
  "/policies/:id",
  restrictTo(['ADMIN','OPERATIONS']),
  upload.any(),
  validatePolicyUploadFields,
  asyncHandler(policyController.updatePolicy)
);
router.get("/policies", restrictTo(['ADMIN','OPERATIONS']), asyncHandler(policyController.getAllPolicies));
router.get("/policies/dashboard-stats", restrictTo(['ADMIN','OPERATIONS']), asyncHandler(policyController.dashboardStats));
router.get("/policies/:id", restrictTo(['ADMIN','OPERATIONS']), asyncHandler(policyController.getPolicyById));
router.delete("/policies/:id", restrictTo(['ADMIN']), asyncHandler(policyController.deletePolicy));
router.delete("/policies/:id/term", restrictTo(['ADMIN','OPERATIONS']), asyncHandler(policyController.deletePolicyTerm));
router.get("/my-policies", restrictTo(['ADMIN','OPERATIONS']), asyncHandler(policyController.getMyPolicies));

// Document management routes
router.delete("/documents/:id", restrictTo(['ADMIN','OPERATIONS']), asyncHandler(policyController.deleteDocument));
router.get("/documents/:id/url", restrictTo(['ADMIN','OPERATIONS']), asyncHandler(policyController.getDocumentUrl));

// Bulk import policies (CSV/XLSX)
// router.post(
//   '/policies/import',
//   restrictTo(['ADMIN', 'OPERATIONS']),
//   importUpload.single('file'),
//   asyncHandler(policyController.importPolicies)
// );

// Add new bulk import route (keep old one untouched)
router.post(
  '/policies/import',
  restrictTo(['ADMIN', 'OPERATIONS']),
  importUpload.single('file'),
  importPoliciesBulkHandler
);

// PolicyReceipt routes
router.post(
  '/policy-receipts',
  restrictTo(['ADMIN', 'OPERATIONS']),
  upload.fields([
    { name: 'policy_document', maxCount: 1 },
    { name: 'policyholder_document', maxCount: 1 },
    { name: 'family_member_documents', maxCount: 10 },
    { name: 'images', maxCount: 10 },
  ]),
  createPolicyReceipt
);

router.patch(
  '/policy-receipts/:id',
  restrictTo(['ADMIN', 'OPERATIONS']),
  upload.fields([
    { name: 'policy_document', maxCount: 1 },
    { name: 'policyholder_document', maxCount: 1 },
    { name: 'family_member_documents', maxCount: 10 },
    { name: 'images', maxCount: 10 },
  ]),
  updatePolicyReceipt
);

router.get('/policy-receipts', restrictTo(['ADMIN', 'OPERATIONS']), getAllPolicyReceipts);
router.get('/policy-receipts/:id', restrictTo(['ADMIN', 'OPERATIONS']), getPolicyReceipt);
router.delete('/policy-receipts/:id', restrictTo(['ADMIN', 'OPERATIONS']), deletePolicyReceipt);
router.get('/policy-receipts/time-period/:timePeriod', restrictTo(['ADMIN', 'OPERATIONS']), getPolicyReceiptsByTimePeriod);

// PolicyGroup CRUD (admin only except GET)
router.post('/policy-groups', restrictTo(["ADMIN"]), policyGroupController.createPolicyGroup);
router.get('/policy-groups', restrictTo(['ADMIN','OPERATIONS']), policyGroupController.getAllPolicyGroups);
router.get('/policy-groups/:id', restrictTo(['ADMIN','OPERATIONS']), policyGroupController.getPolicyGroup);
router.patch('/policy-groups/:id', restrictTo(["ADMIN"]), policyGroupController.updatePolicyGroup);
router.delete('/policy-groups/:id', restrictTo(["ADMIN"]), policyGroupController.deletePolicyGroup);

// PolicyName CRUD (admin only except GET)
router.post('/policy-groups/:id/policy-names', restrictTo(["ADMIN"]), policyGroupController.createPolicyName);
router.post('/policy-names', restrictTo(["ADMIN"]), policyGroupController.createPolicyNameDirect); // New route for creating policy names directly with company_id
router.get('/policy-names', restrictTo(['ADMIN','OPERATIONS']), policyGroupController.getAllPolicyNames);
router.get('/policy-groups/policy-names/all', restrictTo(['ADMIN','OPERATIONS']), policyGroupController.getAllPolicyNames); // Alias for frontend
router.get('/policy-groups/:id/policy-names', restrictTo(['ADMIN','OPERATIONS']), policyGroupController.getPolicyNames);
router.get('/policy-names/:id', restrictTo(['ADMIN','OPERATIONS']), policyGroupController.getPolicyName);
router.patch('/policy-names/:id', restrictTo(["ADMIN"]), policyGroupController.updatePolicyName);
router.delete('/policy-names/:id', restrictTo(["ADMIN"]), policyGroupController.deletePolicyName);

// PolicyType CRUD (admin only except GET)
router.get('/policy-types', restrictTo(['ADMIN','OPERATIONS']), asyncHandler(policyTypeController.getAllPolicyTypes));
router.get('/policy-types/:id', restrictTo(['ADMIN','OPERATIONS']), asyncHandler(policyTypeController.getPolicyTypeById));
router.post('/policy-types', restrictTo(["ADMIN"]), asyncHandler(policyTypeController.createPolicyType));
router.patch('/policy-types/:id', restrictTo(["ADMIN"]), asyncHandler(policyTypeController.updatePolicyType));
router.delete('/policy-types/:id', restrictTo(["ADMIN"]), asyncHandler(policyTypeController.deletePolicyType));

// Agent Routes
router.post('/agents', restrictTo(['ADMIN']), (req, res) => { agentController.createAgent(req, res); });
router.get('/agents', restrictTo(['ADMIN']), (req, res) => { agentController.getAllAgents(req, res); });
router.get('/agents/:id', restrictTo(['ADMIN']), (req, res) => { agentController.getAgentById(req, res); });
router.patch('/agents/:id', restrictTo(['ADMIN']), (req, res) => { agentController.updateAgent(req, res); });
router.delete('/agents/:id', restrictTo(['ADMIN']), (req, res) => { agentController.deleteAgent(req, res); });

// Commission Routes
router.post('/commissions', restrictTo(['ADMIN']), (req, res) => { commissionController.createCommission(req, res); });
router.get('/commissions', restrictTo(['ADMIN', 'OPERATIONS']), (req, res) => { commissionController.getAllCommissions(req, res); });
router.get('/commissions/:id', restrictTo(['ADMIN']), (req, res) => { commissionController.getCommissionById(req, res); });
router.patch('/commissions/:id', restrictTo(['ADMIN']), (req, res) => { commissionController.updateCommission(req, res); });
router.delete('/commissions/:id', restrictTo(['ADMIN']), (req, res) => { commissionController.deleteCommission(req, res); });

// Commission Rules by Policy Name (for frontend calculation)
router.get('/commission-rules/policy/:policyNameId', restrictTo(['ADMIN', 'OPERATIONS']), (req, res) => { commissionController.getCommissionRulesByPolicyName(req, res); });
router.get('/commission-rules/policy-name/:policyNameId', restrictTo(['ADMIN', 'OPERATIONS']), (req, res) => { commissionController.getCommissionRulesByPolicyName(req, res); }); // Alias for frontend

// CommissionRule Routes
router.post('/commission-rules', restrictTo(['ADMIN']), (req, res) => { commissionRuleController.createCommissionRule(req, res); });
router.get('/commission-rules', restrictTo(['ADMIN', 'OPERATIONS']), (req, res) => { commissionRuleController.getAllCommissionRules(req, res); });
router.get('/commission-rules/test', restrictTo(['ADMIN']), (req, res) => { commissionRuleController.testGetAllCommissionRules(req, res); });
router.get('/commission-rules/:id', restrictTo(['ADMIN']), (req, res) => { commissionRuleController.getCommissionRuleById(req, res); });
router.patch('/commission-rules/:id', restrictTo(['ADMIN']), (req, res) => { commissionRuleController.updateCommissionRule(req, res); });
router.patch('/commission-rules/:id/status', restrictTo(['ADMIN']), commissionRuleController.updateCommissionRuleStatus);
router.patch('/commission-rules/policy/:policyNameId/status', restrictTo(['ADMIN']), commissionRuleController.updateCommissionRulesStatusByPolicyName);
router.delete('/commission-rules/:id', restrictTo(['ADMIN']), (req, res) => { commissionRuleController.deleteCommissionRule(req, res); });
router.get('/commission-rules/dashboard/stats', restrictTo(['ADMIN']), (req, res) => { commissionRuleController.getCommissionDashboardStats(req, res); });

// Simplified product-based commission routes
router.get('/commission-rules/product/:policyNameId', restrictTo(['ADMIN', 'OPERATIONS']), (req, res) => { commissionRuleController.getCommissionByProduct(req, res); });
router.patch('/commission-rules/product/:policyNameId', restrictTo(['ADMIN']), (req, res) => { commissionRuleController.upsertCommissionByProduct(req, res); });
router.post('/commission-rules/product/:policyNameId/recalculate', restrictTo(['ADMIN']), (req, res) => { commissionRuleController.recalculateCommissionsForPolicyName(req, res); });
router.post('/commission-rules/calculate', restrictTo(['ADMIN', 'OPERATIONS']), (req, res) => { commissionRuleController.calculateCommission(req, res); });

// Company Routes
router.post('/companies', restrictTo(['ADMIN']), (req, res) => { companyController.createCompany(req, res); });
router.get('/companies', restrictTo(['ADMIN', 'OPERATIONS']), (req, res) => { companyController.getAllCompanies(req, res); });
router.get('/companies/:id', restrictTo(['ADMIN']), (req, res) => { companyController.getCompanyById(req, res); });
router.patch('/companies/:id', restrictTo(['ADMIN']), (req, res) => { companyController.updateCompany(req, res); });
router.delete('/companies/:id', restrictTo(['ADMIN']), (req, res) => { companyController.deleteCompany(req, res); });
router.get('/companies/:id/form-fields', restrictTo(['ADMIN']), (req, res) => { companyController.getCompanyFormFields(req, res); });

// CompanyFormField Routes
router.post('/company-form-fields', restrictTo(['ADMIN']), (req, res) => { companyFormFieldController.createCompanyFormField(req, res); });
router.get('/company-form-fields/:companyId', restrictTo(['ADMIN']), (req, res) => { companyFormFieldController.getCompanyFormFields(req, res); });
router.get('/company-form-field/:id', restrictTo(['ADMIN']), (req, res) => { companyFormFieldController.getCompanyFormFieldById(req, res); });
router.patch('/company-form-field/:id', restrictTo(['ADMIN']), (req, res) => { companyFormFieldController.updateCompanyFormField(req, res); });
router.delete('/company-form-field/:id', restrictTo(['ADMIN']), (req, res) => { companyFormFieldController.deleteCompanyFormField(req, res); });

// Claim Routes
router.use('/', claimRoutes);

// Policy Transition Routes
router.use('/', requireAuth, policyTransitionRoutes);

export default router
