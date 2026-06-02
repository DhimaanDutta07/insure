import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { ClaimController } from "../../controllers/claim.controller";
import { restrictTo } from "../../middlewares/AuthMiddleware";

// Use consistent storage path with upload logic
const uploadPath = process.env.VERCEL ? "/tmp/uploads" : (process.env.STORAGE_DIR || path.join(process.cwd(), "storage"));

try {
  const claimDocsPath = path.join(uploadPath, "policy-documents");
  if (!fs.existsSync(claimDocsPath)) {
    fs.mkdirSync(claimDocsPath, { recursive: true });
  }
} catch (err) {}

const router = express.Router();
const claimController = new ClaimController();

// Configure multer for file uploads - use same logic as policies
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    // Check if this is a claim-related upload
    if (req.originalUrl.includes('/claims')) {
      let destination = path.join(uploadPath, 'policy-documents');
      
      try {
        // Get policy information to create the same folder structure as policies
        const policyId = req.params.policyId as string || req.body.policy_id;
        if (policyId) {
          try {
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            const policy = await prisma.policy.findUnique({
              where: { id: policyId },
              select: { 
                policy_number: true,
                customer_name: true,
                company: {
                  select: { name: true }
                }
              }
            });
            
            if (policy) {
              const policyNumber = policy.policy_number || 'unknown-policy';
              const customerName = (policy.customer_name || 'unknown-customer').replace(/[^a-zA-Z0-9\-]/g, '-');
              const companyName = (policy.company?.name || 'unknown-company').replace(/[^a-zA-Z0-9\-]/g, '-');
              
              // Create same folder structure as policies: policy-number-customer-name-company-name
              const folderName = `${policyNumber}-${customerName}-${companyName}`;
              destination = path.join(uploadPath, 'policy-documents', folderName);
            }
            
            await prisma.$disconnect();
          } catch (error) {
            console.error('Error fetching policy information:', error);
          }
        }
        
        // Ensure directory exists
        if (!fs.existsSync(destination)) {
          fs.mkdirSync(destination, { recursive: true });
          console.log(`Created claim-specific directory: ${destination}`);
        }
        
        console.log(`Claim file upload destination: ${destination}`);
        cb(null, destination);
      } catch (error) {
        console.error('Error creating destination directory:', error);
        // Fallback to basic policy-documents folder
        cb(null, path.join(uploadPath, 'policy-documents'));
      }
    } else {
      // Default to policy documents folder
      const destination = path.join(uploadPath, 'policy-documents');
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
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf', 
      'image/jpeg', 
      'image/png', 
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, PNG, DOC, XLSX, XLS, and CSV files are allowed.'));
    }
  }
});

// Get claim by ID
router.get(
  "/claims/:id", 
  restrictTo(["ADMIN", "OPERATIONS"]),
  claimController.getClaimById
);

// Create claim with multiple members and documents
router.post(
  "/policies/:policyId/claims", 
  restrictTo(["ADMIN", "OPERATIONS"]),
  upload.fields([
    { name: 'documents', maxCount: 10 }
  ]),
  claimController.createClaim
);

// Get all claims for a policy
router.get(
  "/policies/:policyId/claims", 
  claimController.getPolicyClaims
);

// Update claim status (approve/reject)
router.patch(
  "/claims/:id/status", 
  restrictTo(["ADMIN", "OPERATIONS"]),
  claimController.updateClaimStatus
);

// Update claim
router.put(
  "/claims/:id", 
  restrictTo(["ADMIN", "OPERATIONS"]),
  upload.fields([
    { name: 'documents', maxCount: 10 }
  ]),
  claimController.updateClaim
);

// Delete claim (soft delete)
router.delete(
  "/claims/:id", 
  restrictTo(["ADMIN", "OPERATIONS"]),
  claimController.deleteClaim
);

export default router; 