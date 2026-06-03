"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaimController = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const claim_service_1 = require("../services/claim.service");
const claim_schema_1 = require("../schemas/claim.schema");
const JWT_SECRET = process.env.JWT_SECRET;
const extractUserId = (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Unauthorized" });
        return undefined;
    }
    try {
        const token = authHeader.split(" ")[1];
        if (!JWT_SECRET)
            throw new Error("JWT_SECRET is not defined");
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return decoded.user_id;
    }
    catch (error) {
        res.status(401).json({ error: "Unauthorized" });
        return undefined;
    }
};
// Enhanced data conversion for claim data
function convertClaimDataTypes(data) {
    const result = { ...data };
    try {
        // Convert numbers with validation
        if (typeof result.claim_amount === 'string' && result.claim_amount !== '') {
            const parsed = Number(result.claim_amount);
            result.claim_amount = isNaN(parsed) ? undefined : parsed;
        }
        // Convert booleans
        if (typeof result.is_full_claim === 'string') {
            result.is_full_claim = result.is_full_claim === 'true' || result.is_full_claim === '1';
        }
        // Convert JSON strings for nested objects
        const jsonFields = ['members'];
        jsonFields.forEach((field) => {
            if (typeof result[field] === 'string' && result[field].trim() !== '') {
                try {
                    result[field] = JSON.parse(result[field]);
                }
                catch (error) {
                    console.warn(`Failed to parse ${field} as JSON:`, error);
                    result[field] = undefined;
                }
            }
        });
        // Convert date strings to ISO datetime format
        const convertToISODate = (dateStr) => {
            if (!dateStr)
                return undefined;
            try {
                // If it's already ISO format, return as is
                if (dateStr.includes('T'))
                    return dateStr;
                // Convert YYYY-MM-DD to ISO datetime
                return new Date(dateStr + 'T00:00:00.000Z').toISOString();
            }
            catch (error) {
                console.log('Date conversion error:', error);
                return undefined;
            }
        };
        result.claim_date = convertToISODate(result.claim_date);
        result.approved_at = convertToISODate(result.approved_at);
    }
    catch (error) {
        console.error('Error in convertClaimDataTypes:', error);
        throw new Error('Invalid data format provided');
    }
    return result;
}
// Helper to format validation errors for better user experience
function formatValidationErrors(errors) {
    return errors.map(error => ({
        field: error.path?.join('.') || 'unknown',
        message: error.message,
        code: error.code,
    }));
}
class ClaimController {
    async createClaim(req, res) {
        const startTime = Date.now();
        console.log('🚀 [CREATE] Starting robust claim creation request');
        const userId = extractUserId(req, res);
        if (!userId) {
            return;
        }
        try {
            // Debug incoming request data
            console.log("📥 [Controller] Incoming Request Body:", JSON.stringify(req.body, null, 2));
            console.log("📎 [Controller] Incoming Files:", req.files);
            // Convert data types with error handling
            const convertedData = convertClaimDataTypes(req.body);
            console.log("🔍------------------ [Controller] Converted Data start:-----------------------------------");
            console.log("🔍 [Controller] Converted Data:", JSON.stringify(convertedData, null, 2));
            console.log("🔍------------------ [Controller] Converted Data end:-----------------------------------");
            // Enhanced validation using helper function
            const validationResult = (0, claim_schema_1.validateClaimCreation)(convertedData);
            if (!validationResult.success) {
                console.error('Validation errors:', validationResult.error.errors);
                res.status(400).json({
                    error: 'Validation failed',
                    details: formatValidationErrors(validationResult.error.errors)
                });
                return;
            }
            // Pass files from Multer to the service
            const files = req.files;
            console.log('📋 [CREATE] Processing claim:', {
                policy_id: validationResult.data.policy_id,
                claimant_type: validationResult.data.claimant_type,
                claim_amount: validationResult.data.claim_amount,
                members_count: validationResult.data.members?.length || 0,
                files_count: files ? Object.keys(files).length : 0,
            });
            // Add policy_id from URL params if not in body
            if (!validationResult.data.policy_id && req.params.policyId) {
                validationResult.data.policy_id = req.params.policyId;
            }
            const claim = await claim_service_1.claimService.createClaim(validationResult.data, files, userId);
            const duration = Date.now() - startTime;
            console.log(`✅ [CREATE] Claim created successfully in ${duration}ms`);
            console.log("✅ [Controller] Service Response:", {
                claimId: claim.id,
                policyId: claim.policy_id,
                memberCount: claim.claim_members?.length || 0,
                documentCount: claim.documents?.length || 0,
            });
            res.status(201).json({
                success: true,
                message: "Claim created successfully",
                data: claim,
                timestamp: new Date().toISOString(),
                duration: `${duration}ms`,
            });
        }
        catch (error) {
            const duration = Date.now() - startTime;
            console.error(`❌ [CREATE] Claim creation failed in ${duration}ms:`, error);
            if (error instanceof Error) {
                res.status(500).json({
                    error: 'Failed to create claim',
                    message: error.message,
                    timestamp: new Date().toISOString(),
                    duration: `${duration}ms`,
                });
            }
            else {
                res.status(500).json({
                    error: 'Failed to create claim',
                    message: 'An unexpected error occurred',
                    timestamp: new Date().toISOString(),
                    duration: `${duration}ms`,
                });
            }
        }
    }
    async getPolicyClaims(req, res) {
        try {
            const policyId = req.params.policyId;
            const claims = await claim_service_1.claimService.getClaimsByPolicy(policyId);
            res.status(200).json({
                success: true,
                message: "Claims retrieved successfully",
                data: claims
            });
        }
        catch (error) {
            console.error('Error fetching claims:', error);
            res.status(500).json({
                error: "Failed to fetch claims",
                message: error instanceof Error ? error.message : "An unexpected error occurred",
                timestamp: new Date().toISOString()
            });
        }
    }
    async updateClaimStatus(req, res) {
        const startTime = Date.now();
        console.log('🔄 [UPDATE STATUS] Starting claim status update request');
        const userId = extractUserId(req, res);
        if (!userId) {
            return;
        }
        try {
            const id = req.params.id;
            const validation = (0, claim_schema_1.validateClaimStatusUpdate)(req.body);
            if (!validation.success) {
                console.error('Validation errors:', validation.error.errors);
                res.status(400).json({
                    error: "Validation failed",
                    details: formatValidationErrors(validation.error.errors)
                });
                return;
            }
            const claim = await claim_service_1.claimService.updateClaimStatus(id, validation.data.status, userId, validation.data.rejection_reason);
            const duration = Date.now() - startTime;
            console.log(`✅ [UPDATE STATUS] Claim status updated successfully in ${duration}ms`);
            res.status(200).json({
                success: true,
                message: "Claim status updated successfully",
                data: claim,
                timestamp: new Date().toISOString(),
                duration: `${duration}ms`,
            });
        }
        catch (error) {
            const duration = Date.now() - startTime;
            console.error(`❌ [UPDATE STATUS] Claim status update failed in ${duration}ms:`, error);
            if (error instanceof Error) {
                res.status(500).json({
                    error: "Failed to update claim status",
                    message: error.message,
                    timestamp: new Date().toISOString(),
                    duration: `${duration}ms`,
                });
            }
            else {
                res.status(500).json({
                    error: "Failed to update claim status",
                    message: "An unexpected error occurred",
                    timestamp: new Date().toISOString(),
                    duration: `${duration}ms`,
                });
            }
        }
    }
    async updateClaim(req, res) {
        const startTime = Date.now();
        console.log('🔄 [UPDATE] Starting robust claim update request');
        const userId = extractUserId(req, res);
        if (!userId) {
            return;
        }
        try {
            const claimId = req.params.id;
            if (!claimId) {
                res.status(400).json({
                    error: 'Claim ID is required',
                    message: 'Claim ID must be provided in the URL',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            // Debug incoming request data
            console.log("📥 [Controller] Incoming Request Body:", JSON.stringify(req.body, null, 2));
            console.log("📎 [Controller] Incoming Files:", req.files);
            console.log("🆔 [Controller] Claim ID:", claimId);
            const existingClaim = await claim_service_1.claimService.getClaimById(claimId);
            if (!existingClaim) {
                res.status(404).json({
                    error: "Claim not found",
                    message: `Claim with ID ${claimId} does not exist`,
                    timestamp: new Date().toISOString()
                });
                return;
            }
            // Convert data types with error handling
            const convertedData = convertClaimDataTypes(req.body);
            console.log("📄 [Controller] Converted Data:", convertedData);
            // Enhanced validation using helper function
            const validationResult = (0, claim_schema_1.validateClaimUpdate)(convertedData);
            if (!validationResult.success) {
                console.error("Validation error:", validationResult.error.errors);
                res.status(400).json({
                    error: 'Validation failed',
                    details: formatValidationErrors(validationResult.error.errors)
                });
                return;
            }
            // Pass files from Multer to the service
            const files = req.files;
            console.log("📄 [Controller] Files:", files);
            console.log('📋 [UPDATE] Processing claim update:', {
                claim_id: claimId,
                policy_id: validationResult.data.policy_id,
                claimant_type: validationResult.data.claimant_type,
                claim_amount: validationResult.data.claim_amount,
                members_count: validationResult.data.members?.length || 0,
                files_count: files ? Object.keys(files).length : 0,
            });
            const updatedClaim = await claim_service_1.claimService.updateClaim(claimId, validationResult.data, files, userId);
            const duration = Date.now() - startTime;
            console.log(`✅ [UPDATE] Claim updated successfully in ${duration}ms`);
            console.log("✅ [Controller] Service Response:", {
                claimId: updatedClaim.id,
                policyId: updatedClaim.policy_id,
                memberCount: updatedClaim.claim_members?.length || 0,
                documentCount: updatedClaim.documents?.length || 0,
            });
            res.json({
                success: true,
                message: 'Claim updated successfully',
                data: updatedClaim,
                timestamp: new Date().toISOString(),
                duration: `${duration}ms`,
            });
        }
        catch (error) {
            const duration = Date.now() - startTime;
            console.error(`❌ [UPDATE] Claim update failed in ${duration}ms:`, error);
            if (error instanceof Error) {
                res.status(500).json({
                    error: "Failed to update claim",
                    message: error.message,
                    timestamp: new Date().toISOString(),
                    duration: `${duration}ms`,
                });
            }
            else {
                res.status(500).json({
                    error: "Failed to update claim",
                    message: "An unexpected error occurred",
                    timestamp: new Date().toISOString(),
                    duration: `${duration}ms`,
                });
            }
        }
    }
    async deleteClaim(req, res) {
        const userId = extractUserId(req, res);
        if (!userId) {
            return;
        }
        try {
            const id = req.params.id;
            const existingClaim = await claim_service_1.claimService.getClaimById(id);
            if (!existingClaim) {
                res.status(404).json({
                    error: "Claim not found",
                    message: `Claim with ID ${id} does not exist`,
                    timestamp: new Date().toISOString()
                });
                return;
            }
            await claim_service_1.claimService.deleteClaim(id);
            res.status(200).json({
                success: true,
                message: "Claim deleted successfully",
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Error deleting claim:', error);
            res.status(500).json({
                error: "Failed to delete claim",
                message: error instanceof Error ? error.message : "An unexpected error occurred",
                timestamp: new Date().toISOString()
            });
        }
    }
    async getClaimById(req, res) {
        try {
            const claim = await claim_service_1.claimService.getClaimById(req.params.id);
            if (!claim) {
                res.status(404).json({
                    error: "Claim not found",
                    message: `Claim with ID ${req.params.id} does not exist`,
                    timestamp: new Date().toISOString()
                });
                return;
            }
            res.json({
                success: true,
                data: claim
            });
        }
        catch (error) {
            console.error("Error fetching claim:", error);
            res.status(500).json({
                error: "Failed to fetch claim",
                message: error instanceof Error ? error.message : "An unexpected error occurred",
                timestamp: new Date().toISOString()
            });
        }
    }
}
exports.ClaimController = ClaimController;
