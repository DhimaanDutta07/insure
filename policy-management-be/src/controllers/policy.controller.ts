import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { parse } from "csv-parse/sync";
import * as xlsx from "xlsx";
import * as fs from "fs";
import { PrismaClient } from '@prisma/client';
import { policyService } from "./../services/policy.service";
import { calculateAndSetCommission } from '../services/policy.service';
import { 
  insurancePolicySchema, 
  updatePolicySchema,
  validatePolicyCreation,
  validatePolicyUpdate,
  validateCoreEntities,
  validateDocumentLinking
} from '../schemas/policy.schema';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

const extractUserId = (req: Request, res: Response): string | undefined => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try { 
    const token = authHeader.split(" ")[1];
    if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined");
    const decoded = jwt.verify(token, JWT_SECRET) as { user_id: string };
    return decoded.user_id;
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
};

// Enhanced data conversion for nested objects
function convertPolicyDates(data: any) {
  const result = { ...data };
  
  // Helper function to convert date strings
  const convertDateString = (dateStr: any) => {
    if (!dateStr) return undefined;
    if (dateStr instanceof Date) return dateStr;
    try {
      return new Date(dateStr);
    } catch (error) {
      // console.log('Date parsing error:', error);
      return undefined;
    }
  };
  
  // Convert policy dates (already converted to ISO in convertDataTypes)
  result.start_date = convertDateString(result.start_date);
  result.end_date = convertDateString(result.end_date);
  result.issued_date = convertDateString(result.issued_date);
  
  // Convert proposer dates
  if (result.proposer && result.proposer.date_of_birth) {
    result.proposer.date_of_birth = convertDateString(result.proposer.date_of_birth);
  }
  
  // Convert member dates
  if (result.members && Array.isArray(result.members)) {
    result.members = result.members.map((member: any) => ({
      ...member,
      date_of_birth: convertDateString(member.date_of_birth),
    }));
  }
  
  // Convert insured_members dates
  if (result.insured_members && Array.isArray(result.insured_members)) {
    result.insured_members = result.insured_members.map((member: any) => ({
      ...member,
      date_of_birth: convertDateString(member.date_of_birth),
    }));
  }
  
  // Convert nominee dates
  if (result.nominee_payment && result.nominee_payment.nominee_dob) {
    result.nominee_payment.nominee_dob = convertDateString(result.nominee_payment.nominee_dob);
  }
  
  return result;
}

// Enhanced data type conversion with better error handling
function convertDataTypes(data: any) {
  const result = { ...data };
  
  try {
    // Convert numbers with validation
    if (typeof result.sum_insured === 'string' && result.sum_insured !== '') {
      const parsed = Number(result.sum_insured);
      result.sum_insured = isNaN(parsed) ? undefined : parsed;
    }
    if (typeof result.tenure_years === 'string' && result.tenure_years !== '') {
      const parsed = Number(result.tenure_years);
      result.tenure_years = isNaN(parsed) ? undefined : parsed;
    }
    if (typeof result.premium_amount === 'string' && result.premium_amount !== '') {
      const parsed = Number(result.premium_amount);
      result.premium_amount = isNaN(parsed) ? undefined : parsed;
    }
    if (typeof result.premium_amount_gst === 'string' && result.premium_amount_gst !== '') {
      const parsed = Number(result.premium_amount_gst);
      result.premium_amount_gst = isNaN(parsed) ? undefined : parsed;
    }
    if (typeof result.deductible_amount === 'string' && result.deductible_amount !== '') {
      const parsed = Number(result.deductible_amount);
      result.deductible_amount = isNaN(parsed) ? undefined : parsed;
    }
    if (typeof result.emi_amount === 'string' && result.emi_amount !== '') {
      const parsed = Number(result.emi_amount);
      result.emi_amount = isNaN(parsed) ? undefined : parsed;
    }
    if (typeof result.commission_add_on_percentage === 'string' && result.commission_add_on_percentage !== '') {
      const parsed = Number(result.commission_add_on_percentage);
      result.commission_add_on_percentage = isNaN(parsed) ? undefined : parsed;
    }
    if (typeof result.calculated_commission_amount === 'string' && result.calculated_commission_amount !== '') {
      const parsed = Number(result.calculated_commission_amount);
      result.calculated_commission_amount = isNaN(parsed) ? undefined : parsed;
    }
    
    // Convert booleans
    if (typeof result.declaration_accepted === 'string') {
      result.declaration_accepted = result.declaration_accepted === 'true' || result.declaration_accepted === '1';
    }
    if (typeof result.medical_condition === 'string') {
      result.medical_condition = result.medical_condition === 'true' || result.medical_condition === '1';
    }
    if (typeof result.deductible_amount_status === 'string') {
      result.deductible_amount_status = result.deductible_amount_status === 'true' || result.deductible_amount_status === '1';
    }
    if (typeof result.gst_status === 'string') {
      result.gst_status = result.gst_status === 'true' || result.gst_status === '1';
    }
    
    // Convert JSON strings for nested objects with better error handling
    const jsonFields = ['proposer', 'members', 'insured_members', 'nominee_payment', 'documents_to_delete', 'members_to_delete', 'insured_members_to_delete', 'removedDocumentIds'];
    jsonFields.forEach((field) => {
      if (typeof result[field] === 'string' && result[field].trim() !== '') {
        try {
          result[field] = JSON.parse(result[field]);
        } catch (error) {
          console.warn(`Failed to parse ${field} as JSON:`, error);
          result[field] = undefined;
        }
      }
    });

    // Handle form_values separately to ensure it's always an array or undefined
    if (typeof result.form_values === 'string') {
      try {
        const parsed = JSON.parse(result.form_values);
        result.form_values = Array.isArray(parsed) ? parsed : undefined;
      } catch (error) {
        console.warn(`Failed to parse form_values as JSON:`, error);
        result.form_values = undefined;
      }
    } else if (!Array.isArray(result.form_values)) {
      result.form_values = undefined;
    }
    
    // Handle empty string foreign keys - convert to null
    const foreignKeyFields = ['company_id', 'policy_type_id', 'policy_name_id', 'policy_group_id'];
    foreignKeyFields.forEach(field => {
      if (result[field] === '') {
        result[field] = null;
      }
    });
    
    // ✅ FIX: Convert date strings to ISO datetime format
    const convertToISODate = (dateStr: string) => {
      if (!dateStr) return undefined;
      try {
        // If it's already ISO format, return as is
        if (dateStr.includes('T')) return dateStr;
        // Convert YYYY-MM-DD to ISO datetime
        return new Date(dateStr + 'T00:00:00.000Z').toISOString();
      } catch (error) {
        console.log('Date conversion error:', error);
        return undefined;
      }
    };
    
    result.start_date = convertToISODate(result.start_date);
    result.end_date = convertToISODate(result.end_date);
    result.issued_date = convertToISODate(result.issued_date);
    
    if (result.nominee_payment && typeof result.nominee_payment === 'object') {
      // Only include fields that have actual values (not null, undefined, or empty strings)
      const { 
        nominee_salutation, 
        nominee_name, 
        nominee_relation, 
        nominee_dob, 
        payment_mode, 
        payment_reference,
        bank_name,
        bank_account_number,
        bank_ifsc_code,
        bank_branch_name
      } = result.nominee_payment;
      
      const cleanedNominee: any = {};
      
      // Only add fields that have meaningful values
      if (nominee_salutation && nominee_salutation.trim() !== '') {
        cleanedNominee.nominee_salutation = nominee_salutation;
      }
      if (nominee_name && nominee_name.trim() !== '') {
        cleanedNominee.nominee_name = nominee_name;
      }
      if (nominee_relation && nominee_relation.trim() !== '') {
        cleanedNominee.nominee_relation = nominee_relation;
      }
      if (nominee_dob) {
        cleanedNominee.nominee_dob = nominee_dob;
      }
      if (payment_mode && payment_mode.trim() !== '') {
        cleanedNominee.payment_mode = payment_mode;
      }
      if (payment_reference && payment_reference.trim() !== '') {
        cleanedNominee.payment_reference = payment_reference;
      }
      if (bank_name && bank_name.trim() !== '') {
        cleanedNominee.bank_name = bank_name;
      }
      if (bank_account_number && bank_account_number.trim() !== '') {
        cleanedNominee.bank_account_number = bank_account_number;
      }
      if (bank_ifsc_code && bank_ifsc_code.trim() !== '') {
        cleanedNominee.bank_ifsc_code = bank_ifsc_code;
      }
      if (bank_branch_name && bank_branch_name.trim() !== '') {
        cleanedNominee.bank_branch_name = bank_branch_name;
      }
      
      // Only set nominee_payment if it has at least one meaningful field
      if (Object.keys(cleanedNominee).length > 0) {
        result.nominee_payment = cleanedNominee;
      } else {
        // If no meaningful data, remove nominee_payment entirely
        delete result.nominee_payment;
      }
    }
    
    // Remove documents from nested objects for two-phase approach
    if (result.proposer?.documents) {
      delete result.proposer.documents;
    }
    
    if (result.members && Array.isArray(result.members)) {
      result.members.forEach((member: any) => {
        if (member.documents) {
          delete member.documents;
        }
      });
    }
    
    if (result.insured_members && Array.isArray(result.insured_members)) {
      result.insured_members.forEach((member: any) => {
        if (member.documents) {
          delete member.documents;
        }
      });
    }
    
    if (result.documents_to_delete && !Array.isArray(result.documents_to_delete)) {
      result.documents_to_delete = undefined;
    }
    if (result.members_to_delete && !Array.isArray(result.members_to_delete)) {
      result.members_to_delete = undefined;
    }
    if (result.insured_members_to_delete && !Array.isArray(result.insured_members_to_delete)) {
      result.insured_members_to_delete = undefined;
    }
    if (result.removedDocumentIds && !Array.isArray(result.removedDocumentIds)) {
      result.removedDocumentIds = undefined;
    }
    
  } catch (error) {
    console.error('Error in convertDataTypes:', error);
    throw new Error('Invalid data format provided');
  }
  
  return result;
}

// Helper to convert files array from upload.any() to object format expected by service
function convertFilesToObject(files: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] } | undefined) {
  if (!files) return {};
  
  // If already an object, return as is
  if (!Array.isArray(files)) return files;
  
  // Convert array to object grouped by fieldname
  const filesObject: { [fieldname: string]: Express.Multer.File[] } = {};
  files.forEach(file => {
    const fieldname = file.fieldname;
    if (!filesObject[fieldname]) {
      filesObject[fieldname] = [];
    }
    filesObject[fieldname].push(file);
  });
  
  console.log("🔧 [Controller] Converted files object keys:", Object.keys(filesObject));
  
  return filesObject;
}

// Helper to format validation errors for better user experience
function formatValidationErrors(errors: any[]) {
  return errors.map(error => ({
    field: error.path?.join('.') || 'unknown',
    message: error.message,
    code: error.code,
  }));
}

export const policyController = {
  // Create Policy with robust two-phase approach
  async createPolicy(req: Request, res: Response) {
    const startTime = Date.now();
    console.log('🚀 [CREATE] Starting robust policy creation request');

    const userId = extractUserId(req, res);
    if (!userId) {
      return;
    }
    
    try {
      // Debug incoming request data
      console.log("📥 [Controller] Incoming Request Body:", JSON.stringify(req.body, null, 2));
      console.log("📎 [Controller] Incoming Files:", req.files);
      
      // Convert data types with error handling
      const convertedData = convertDataTypes(req.body);

      console.log("🔍------------------ [Controller] Converted Data start:-----------------------------------");
      console.log("🔍 [Controller] Converted Data:", JSON.stringify(convertedData, null, 2));
      console.log("🔍------------------ [Controller] Converted Data end:-----------------------------------");
      console.log("🔍 [Controller] Nominee data after conversion:", convertedData.nominee_payment);
      
      // Enhanced validation using helper function
      const validationResult = validatePolicyCreation(convertedData);
      if (!validationResult.success) {
        console.error('Validation errors:', validationResult.error.errors);
        return res.status(400).json({ 
          error: 'Validation failed',
          details: formatValidationErrors(validationResult.error.errors)
        });
      }
      
      // Additional validation for core entities
      const coreValidationResult = validateCoreEntities(convertedData);
      if (!coreValidationResult.success) {
        console.error('Core entity validation errors:', coreValidationResult.error.errors);
        return res.status(400).json({ 
          error: 'Core entity validation failed',
          details: formatValidationErrors(coreValidationResult.error.errors)
        });
      }
      
      // Convert date strings to Date objects
      const dataWithDates = convertPolicyDates(validationResult.data);
      
      // Always set system_ip from request, not from client
      const systemIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
      
      // Pass files from Multer to the service
      const files = convertFilesToObject(req.files);

      // Calculate commission before saving (skip if user provided manual value)
      if (!dataWithDates.calculated_commission_amount) {
        await calculateAndSetCommission(dataWithDates);
      }

      // NOTE: emi_amount and commission_add_on_percentage are passed through to service layer
      console.log('📋 [CREATE] Processing policy:', {
        policy_number: dataWithDates.policy_number,
        customer_name: dataWithDates.customer_name,
        insured_members_count: dataWithDates.insured_members?.length || dataWithDates.members?.length || 0,
        files_count: files ? Object.keys(files).length : 0,
      });

      const policy = await policyService.createPolicy({
        ...dataWithDates,
        system_ip: typeof systemIp === 'string' ? systemIp : Array.isArray(systemIp) ? systemIp[0] : '',
        created_by: userId,
      }, files, userId);
      
      const duration = Date.now() - startTime;
      console.log(`✅ [CREATE] Policy created successfully in ${duration}ms`);
      console.log("✅ [Controller] Service Response:", {
        policyId: policy.id,
        proposerId: policy.proposer?.id,
        memberCount: policy.proposer?.insured_members?.length || 0,
        documentCount: policy.documents?.length || 0,
        proposerDocCount: policy.proposer?.documents?.length || 0,
        memberDocCount: policy.proposer?.insured_members?.reduce((total: number, member: any) => total + (member.documents?.length || 0), 0) || 0
      });

      res.status(201).json({
        success: true,
        message: 'Policy created successfully',
        data: policy,
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [CREATE] Policy creation failed in ${duration}ms:`, error);

      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          res.status(409).json({
            error: 'Policy number already exists',
            message: error.message,
            timestamp: new Date().toISOString(),
            duration: `${duration}ms`,
          });
        } else if (error.message.includes('Unique constraint failed')) {
          res.status(409).json({
            error: 'Duplicate entry',
            message: 'A policy with this number already exists',
            timestamp: new Date().toISOString(),
            duration: `${duration}ms`,
          });
        } else {
          res.status(500).json({
            error: 'Failed to create policy',
            message: error.message,
            timestamp: new Date().toISOString(),
            duration: `${duration}ms`,
          });
        }
      } else {
        res.status(500).json({
          error: 'Failed to create policy',
          message: 'An unexpected error occurred',
          timestamp: new Date().toISOString(),
          duration: `${duration}ms`,
        });
      }
    }
  },

  // Get all policies with enhanced response format
  async getAllPolicies(req: Request, res: Response) {
    try {
      const result = await policyService.getAllPolicies(req.query);
      res.json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          pages: result.pages
        }
      });
    } catch (error) {
      console.error("Error fetching policies:", error);
      res.status(500).json({ 
        error: "Failed to fetch policies",
        message: error instanceof Error ? error.message : "An unexpected error occurred",
        timestamp: new Date().toISOString()
      });
    }
  },

  // Get single policy by ID with enhanced response
  async getPolicyById(req: Request, res: Response) {
    try {
      // console.log(`Fetching policy with ID: ${req.params.id as string}`);
      
      const policy = await policyService.getPolicyById(req.params.id as string);
      
      if (!policy) {
        // console.log(`Policy not found with ID: ${req.params.id as string}`);
        return res.status(404).json({ 
          error: "Policy not found",
          message: `Policy with ID ${req.params.id as string} does not exist`,
          timestamp: new Date().toISOString()
        });
      }
      
      // console.log('Policy fetched successfully:', {
      //   id: policy.id,
      //   policy_number: policy.policy_number,
      //   customer_name: policy.customer_name,
      //   hasProposer: !!policy.proposer,
      //   memberCount: policy.members?.length || 0,
      //   documentCount: policy.documents?.length || 0,
      //   hasNomineePayment: !!policy.nominee_payment,
      //   formValueCount: policy.form_values?.length || 0
      // });
      
      res.json({
        success: true,
        data: policy
      });
    } catch (error) {
      console.error("Error fetching policy:", error);
      res.status(500).json({ 
        error: "Failed to fetch policy",
        message: error instanceof Error ? error.message : "An unexpected error occurred",
        timestamp: new Date().toISOString()
      });
    }
  },

  // Update policy with robust two-phase approach
  async updatePolicy(req: Request, res: Response) {
    const startTime = Date.now();
    console.log('🔄 [UPDATE] Starting robust policy update request');

    const userId = extractUserId(req, res);
    if (!userId) {
      return;
    }
    
    try {
      const policyId = req.params.id as string;
      if (!policyId) {
        res.status(400).json({
          error: 'Policy ID is required',
          message: 'Policy ID must be provided in the URL',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Debug incoming request data
      console.log("📥 [Controller] Incoming Request Body:", JSON.stringify(req.body, null, 2));
      console.log("📎 [Controller] Incoming Files:", req.files);
      console.log("🆔 [Controller] Policy ID:", policyId);

      const existingPolicy = await policyService.getPolicyById(policyId);
      if (!existingPolicy) {
        return res.status(404).json({ 
          error: "Policy not found",
          message: `Policy with ID ${policyId} does not exist`,
          timestamp: new Date().toISOString()
        });
      }
      
      // TODO: Temporarily commented out to allow any user to update policies
      // if (existingPolicy.created_by !== userId) {
      //   return res.status(403).json({ 
      //     error: "Forbidden",
      //     message: "You can only update your own policies",
      //     timestamp: new Date().toISOString()
      //   });
      // }
      
      // Convert data types with error handling
      const convertedData = convertDataTypes(req.body);
      const memberDocsMetadata = req.body.memberDocsMeta;

      // Fix: Parse memberDocsMeta if it's a string
        if (typeof req.body.memberDocsMeta === "string") {
          try {
            convertedData.memberDocsMeta = JSON.parse(req.body.memberDocsMeta);
          } catch (error) {
            console.error("❌ Failed to parse memberDocsMeta JSON:", error);
            return res.status(400).json({ error: "Invalid memberDocsMeta format" });
          }
        } else {
          convertedData.memberDocsMeta = req.body.memberDocsMeta;
        }
      
      console.log("📄 [Controller] Converted Data:", convertedData);
      
      // Enhanced validation using helper function
      const validationResult = validatePolicyUpdate(convertedData);
      if (!validationResult.success) {
        console.error("Validation error:", validationResult.error.errors);
        return res.status(400).json({ 
          error: 'Validation failed',
          details: formatValidationErrors(validationResult.error.errors)
        });
      }
      
      // Convert date strings to Date objects
      const dataWithDates = convertPolicyDates(validationResult.data);
      
      
      // Pass files from Multer to the service
      const files = convertFilesToObject(req.files);

      console.log("📄 [Controller] Files:", files);
      
      console.log('📋 [UPDATE] Processing policy update:', {
        policy_id: policyId,
        customer_name: dataWithDates.customer_name,
        insured_members_count: dataWithDates.insured_members?.length || dataWithDates.members?.length || 0,
        files_count: files ? Object.keys(files).length : 0,
        removed_docs_count: dataWithDates.removedDocumentIds?.length || 0,
      });

      const updatedPolicy = await policyService.updatePolicy(
        policyId,
        dataWithDates,
        files,
        userId
      );
      
      const duration = Date.now() - startTime;
      console.log(`✅ [UPDATE] Policy updated successfully in ${duration}ms`);
      console.log("✅ [Controller] Service Response:", {
        policyId: updatedPolicy.id,
        proposerId: updatedPolicy.proposer?.id,
        memberCount: updatedPolicy.proposer?.insured_members?.length || 0,
        documentCount: updatedPolicy.documents?.length || 0,
        proposerDocCount: updatedPolicy.proposer?.documents?.length || 0,
        memberDocCount: updatedPolicy.proposer?.insured_members?.reduce((total: number, member: any) => total + (member.documents?.length || 0), 0) || 0
      });

      res.json({
        success: true,
        message: 'Policy updated successfully',
        data: updatedPolicy,
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [UPDATE] Policy update failed in ${duration}ms:`, error);
      
      if (error instanceof Error) {
        // Handle specific error types
        if (error.message.includes('already exists')) {
          res.status(409).json({ 
            error: "Policy number already exists",
            message: error.message,
            timestamp: new Date().toISOString(),
            duration: `${duration}ms`,
          });
        } else if (error.message.includes('Unique constraint failed')) {
          res.status(409).json({ 
            error: "Duplicate entry",
            message: "A policy with this number already exists",
            timestamp: new Date().toISOString(),
            duration: `${duration}ms`,
          });
        } else {
          res.status(500).json({ 
            error: "Failed to update policy",
            message: error.message,
            timestamp: new Date().toISOString(),
            duration: `${duration}ms`,
          });
        }
      } else {
        res.status(500).json({ 
          error: "Failed to update policy",
          message: "An unexpected error occurred",
          timestamp: new Date().toISOString(),
          duration: `${duration}ms`,
        });
      }
    }
  },

  // Delete policy with enhanced response
  async deletePolicy(req: Request, res: Response) {
    const userId = extractUserId(req, res);
    if (!userId) {
      return;
    }

    try {
      const existingPolicy = await policyService.getPolicyById(req.params.id as string);
      if (!existingPolicy) {
        return res.status(404).json({ 
          error: "Policy not found",
          message: `Policy with ID ${req.params.id as string} does not exist`,
          timestamp: new Date().toISOString()
        });
      }
      
      // TODO: Temporarily commented out to allow any ADMIN/OPERATIONS user to delete policies
      // if (existingPolicy.created_by !== userId) {
      //   return res.status(403).json({ 
      //     error: "Forbidden",
      //     message: "You can only delete your own policies",
      //     timestamp: new Date().toISOString()
      //   });
      // }

      const policyId = req.params.id as string;

      // Step 1: Delete references where this policy's documents are the source
      await prisma.policyDocumentReference.deleteMany({
        where: {
          source_document: {
            policy_id: policyId
          }
        }
      });

      // Step 2: Delete references where this policy references ancestor documents
      await prisma.policyDocumentReference.deleteMany({
        where: {
          policy_id: policyId
        }
      });

      await policyService.deletePolicy(policyId);
      res.status(200).json({
        success: true,
        message: 'Policy deleted successfully'
      });
    } catch (error) {
      console.error("Error deleting policy:", error);
      res.status(500).json({ 
        error: "Failed to delete policy",
        message: error instanceof Error ? error.message : "An unexpected error occurred",
        timestamp: new Date().toISOString()
      });
    }
  },

  // Get policies by current user
  async getMyPolicies(req: Request, res: Response) {
    const userId = extractUserId(req, res);
    if (!userId) {
      return;
    }

    try {
      const policies = await policyService.getPoliciesByUserId(userId);
      res.json({
        success: true,
        data: policies,
        count: policies.length
      });
    } catch (error) {
      console.error("Error fetching user policies:", error);
      res.status(500).json({ 
        error: "Failed to fetch your policies",
        message: error instanceof Error ? error.message : "An unexpected error occurred",
        timestamp: new Date().toISOString()
      });
    }
  },

  // Enhanced bulk import with better error handling
  async importPolicies(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          error: 'No file uploaded',
          message: 'Please upload a CSV or XLSX file',
          timestamp: new Date().toISOString()
        });
      }
      
      const { originalname, buffer, path: filePath } = req.file as any;
      let records: any[] = [];
      
      try {
        if (originalname.endsWith('.csv')) {
          const fileContent = buffer ? buffer.toString() : fs.readFileSync(filePath, 'utf8');
          records = parse(fileContent, { columns: true, skip_empty_lines: true });
        } else if (originalname.endsWith('.xlsx')) {
          let workbook;
          if (filePath) {
            workbook = xlsx.readFile(filePath);
          } else if (buffer) {
            workbook = xlsx.read(buffer, { type: 'buffer' });
          } else {
            return res.status(400).json({ 
              error: 'No file data found for XLSX import',
              timestamp: new Date().toISOString()
            });
          }
          const sheetName = workbook.SheetNames[0];
          records = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
        } else {
          return res.status(400).json({ 
            error: 'Unsupported file type',
            message: 'Please upload CSV or XLSX files only',
            timestamp: new Date().toISOString()
          });
        }
      } catch (parseError) {
        console.error('File parsing error:', parseError);
        return res.status(400).json({ 
          error: 'Failed to parse file',
          message: 'The uploaded file appears to be corrupted or in an invalid format',
          timestamp: new Date().toISOString()
        });
      }
      
      if (records.length === 0) {
        return res.status(400).json({ 
          error: 'Empty file',
          message: 'The uploaded file contains no data rows',
          timestamp: new Date().toISOString()
        });
      }
      
      // Validate and collect errors
      const validPolicies = [];
      const errors = [];
      const systemIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
      
      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        
        // Remove any system_ip from import and inject from request
        if ('system_ip' in row) delete row.system_ip;
        
        try {
          // Convert data types
          const convertedRow = convertDataTypes(row);
          
          const validationResult = validatePolicyCreation(convertedRow);
          if (validationResult.success) {
            validPolicies.push({
              ...validationResult.data,
              system_ip: typeof systemIp === 'string' ? systemIp : Array.isArray(systemIp) ? systemIp[0] : '',
            });
          } else {
            errors.push({ 
              row: i + 2, 
              errors: formatValidationErrors(validationResult.error.errors)
            });
          }
        } catch (conversionError) {
          errors.push({ 
            row: i + 2, 
            errors: [{ 
              field: 'general', 
              message: 'Data conversion failed',
              code: 'CONVERSION_ERROR'
            }]
          });
        }
      }
      
      if (validPolicies.length === 0) {
        return res.status(400).json({ 
          error: 'No valid policies found',
          message: 'All rows in the file contain validation errors',
          details: errors,
          timestamp: new Date().toISOString()
        });
      }
      
      // Call service to batch create
      const userId = (req as any).user?.id || 'import';
      const result = await policyService.bulkCreatePolicies(validPolicies, userId);
      
      res.json({ 
        success: true,
        message: `Import completed. ${result.created.length} policies created successfully`,
        data: {
          created: result.created,
          failed: [...errors, ...result.failed],
          summary: {
            total: records.length,
            successful: result.created.length,
            failed: errors.length + result.failed.length
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error importing policies:', error);
      res.status(500).json({ 
        error: 'Failed to import policies',
        message: error instanceof Error ? error.message : "An unexpected error occurred",
        timestamp: new Date().toISOString()
      });
    }
  },

  // Enhanced document deletion with better authorization
  async deleteDocument(req: Request, res: Response) {
    const userId = extractUserId(req, res);
    if (!userId) {
      return;
    }
    
    try {
      const documentId = req.params.id as string;
      
      // Get document details from database first
      const document = await policyService.getDocumentById(documentId);
      if (!document) {
        return res.status(404).json({ 
          error: "Document not found",
          message: `Document with ID ${documentId} does not exist`,
          timestamp: new Date().toISOString()
        });
      }
      
      // Check if user has permission (they should own the policy)
      // Documents can be associated with policy, proposer, or insured member
      let policyOwnerId: string | null = null;
      
      if (document.policy_id && document.policy) {
        policyOwnerId = document.policy.created_by;
      } else if (document.proposer_id && document.proposer?.policy) {
        policyOwnerId = document.proposer.policy.created_by;
      } else if (document.insured_member_id && document.insured_member?.proposer?.policy) {
        policyOwnerId = document.insured_member.proposer.policy.created_by;
      }
      
      if (!policyOwnerId) {
        return res.status(400).json({ 
          error: "Invalid document",
          message: "Document is not associated with a policy",
          timestamp: new Date().toISOString()
        });
      }
      
      if (policyOwnerId !== userId) {
        return res.status(403).json({ 
          error: "Forbidden",
          message: "You can only delete documents from your own policies",
          timestamp: new Date().toISOString()
        });
      }
      
      // Delete document from database and file system
      await policyService.deleteDocument(documentId);
      
      res.status(200).json({ 
        success: true,
        message: "Document deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ 
        error: "Failed to delete document",
        message: error instanceof Error ? error.message : "An unexpected error occurred",
        timestamp: new Date().toISOString()
      });
    }
  },

  // Get document URL
  async getDocumentUrl(req: Request, res: Response) {
    const userId = extractUserId(req, res);
    if (!userId) {
      return;
    }
    
    try {
      const documentId = req.params.id as string;
      
      if (!documentId) {
        return res.status(400).json({ 
          error: "Document ID is required",
          timestamp: new Date().toISOString()
        });
      }

      // Get document details from database first
      const document = await policyService.getDocumentById(documentId);
      if (!document) {
        return res.status(404).json({ 
          error: "Document not found",
          message: `Document with ID ${documentId} does not exist`,
          timestamp: new Date().toISOString()
        });
      }
      
      // Check if user has permission (they should own the policy)
      // Documents can be associated with policy, proposer, or insured member
      let policyOwnerId: string | null = null;
      
      if (document.policy_id && document.policy) {
        policyOwnerId = document.policy.created_by;
      } else if (document.proposer_id && document.proposer?.policy) {
        policyOwnerId = document.proposer.policy.created_by;
      } else if (document.insured_member_id && document.insured_member?.proposer?.policy) {
        policyOwnerId = document.insured_member.proposer.policy.created_by;
      }
      
      // Temporarily allow all users to access documents (remove this check if needed)
      // if (policyOwnerId !== userId) {
      //   return res.status(403).json({ 
      //     error: "Forbidden",
      //     message: "You can only access documents from your own policies",
      //     timestamp: new Date().toISOString()
      //   });
      // }

      // Get document metadata instead of constructing URL
      const documentMetadata = await policyService.getDocumentMetadata(documentId);
      
      if (!documentMetadata) {
        return res.status(404).json({ 
          error: "Document metadata not found",
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        data: {
          ...documentMetadata,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
        }
      });
    } catch (error) {
      console.error("Error getting document URL:", error);
      res.status(500).json({ 
        error: "Failed to get document URL",
        message: error instanceof Error ? error.message : "An unexpected error occurred",
        timestamp: new Date().toISOString()
      });
    }
  },

  // Enhanced dashboard statistics
  async dashboardStats(req: Request, res: Response) {
    console.log('🔍 [Controller] Dashboard stats endpoint called');
    console.log('🔍 [Controller] Query params:', req.query);
    console.log('🔍 [Controller] Headers:', req.headers);
    
    try {
      const timeRange = req.query.timeRange as string || "7d";
      console.log('🔍 [Controller] Time range:', timeRange);
      
      const stats = await policyService.getDashboardStats(timeRange);
      console.log('🔍 [Controller] Stats received from service');
      
      res.json({
        success: true,
        data: stats,
        timeRange,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("[DashboardStats] Error fetching dashboard stats:", error);
      res.status(500).json({ 
        error: "Failed to fetch dashboard stats",
        message: error instanceof Error ? error.message : "An unexpected error occurred",
        timestamp: new Date().toISOString()
      });
    }
  },
};