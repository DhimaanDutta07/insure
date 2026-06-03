"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDocumentTransferStats = exports.updateExistingReferencesToDeletable = exports.deleteDocumentReference = exports.clearDocumentCache = exports.getDocumentAccessStats = exports.validateTransitionEligibility = exports.getPolicyDocuments = exports.getPolicyTransitionHistory = exports.createPolicyPortability = exports.createPolicyMigration = exports.createPolicyRenewal = void 0;
const policyTransition_service_1 = require("../services/policyTransition.service");
const documentAccess_service_1 = require("../services/documentAccess.service");
const asyncTryCatch_1 = require("../utils/asyncTryCatch");
// Validation helper for policy transition input
function validatePolicyTransitionInput(data) {
    const errors = {};
    const requiredStringFields = [
        { key: "policy_number", label: "Policy number" },
        { key: "customer_name", label: "Customer name" },
        { key: "company_id", label: "Company" },
        { key: "policy_name_id", label: "Product name" },
    ];
    const requiredDateFields = [
        { key: "start_date", label: "Start date" },
        { key: "end_date", label: "End date" },
        { key: "issued_date", label: "Issued date" },
    ];
    const requiredNumericFields = [
        { key: "sum_insured", label: "Sum insured" },
        { key: "premium_amount", label: "Premium amount" },
        { key: "tenure_years", label: "Tenure (years)" },
    ];
    for (const { key, label } of requiredStringFields) {
        if (!data[key] || String(data[key]).trim() === "") {
            errors[key] = label + " is required";
        }
    }
    for (const { key, label } of requiredDateFields) {
        if (!data[key] || String(data[key]).trim() === "") {
            errors[key] = label + " is required";
        }
        else if (isNaN(Date.parse(String(data[key])))) {
            errors[key] = label + " is not a valid date";
        }
    }
    for (const { key, label } of requiredNumericFields) {
        const val = Number(data[key]);
        if (isNaN(val)) {
            errors[key] = label + " must be a valid number";
        }
        else if (val <= 0) {
            errors[key] = label + " must be greater than 0";
        }
    }
    if (data["gst_status"] !== undefined && typeof data["gst_status"] !== "boolean") {
        errors["gst_status"] = "GST status must be true or false";
    }
    return { valid: Object.keys(errors).length === 0, errors };
}
// Create policy renewal
exports.createPolicyRenewal = (0, asyncTryCatch_1.asyncTryCatch)(async (req, res) => {
    const parentPolicyId = req.params.parentPolicyId;
    const newPolicyData = req.body;
    // Validate transition eligibility
    const eligibility = await policyTransition_service_1.PolicyTransitionService.validateTransitionEligibility(parentPolicyId, 'RENEWAL');
    if (!eligibility.eligible) {
        res.status(400).json({
            error: 'Policy not eligible for renewal',
            reasons: eligibility.reasons,
            requirements: eligibility.requirements
        });
        return;
    }
    const result = await policyTransition_service_1.PolicyTransitionService.createPolicyTransition(parentPolicyId, 'RENEWAL', newPolicyData);
    if (result.errors.length > 0) {
        res.status(400).json({
            error: 'Failed to create policy renewal',
            details: result.errors
        });
        return;
    }
    res.status(201).json({
        data: result.newPolicy,
        message: 'Policy renewed successfully',
        documentReferences: result.documentReferences.length,
        documentTransferInfo: {
            totalDocumentsTransferred: result.documentReferences.length,
            transitionType: 'RENEWAL',
            message: `Successfully transferred ${result.documentReferences.length} documents from ancestor policies`
        },
        errors: result.errors
    });
});
// Create policy migration
exports.createPolicyMigration = (0, asyncTryCatch_1.asyncTryCatch)(async (req, res) => {
    const parentPolicyId = req.params.parentPolicyId;
    const newPolicyData = req.body;
    // Validate transition eligibility
    const eligibility = await policyTransition_service_1.PolicyTransitionService.validateTransitionEligibility(parentPolicyId, 'MIGRATION');
    if (!eligibility.eligible) {
        res.status(400).json({
            error: 'Policy not eligible for migration',
            reasons: eligibility.reasons,
            requirements: eligibility.requirements
        });
        return;
    }
    const result = await policyTransition_service_1.PolicyTransitionService.createPolicyTransition(parentPolicyId, 'MIGRATION', newPolicyData);
    if (result.errors.length > 0) {
        res.status(400).json({
            error: 'Failed to create policy migration',
            details: result.errors
        });
        return;
    }
    res.status(201).json({
        data: result.newPolicy,
        message: 'Policy migrated successfully',
        documentReferences: result.documentReferences.length,
        documentTransferInfo: {
            totalDocumentsTransferred: result.documentReferences.length,
            transitionType: 'MIGRATION',
            message: `Successfully transferred ${result.documentReferences.length} documents from ancestor policies`
        },
        errors: result.errors
    });
});
// Create policy portability
exports.createPolicyPortability = (0, asyncTryCatch_1.asyncTryCatch)(async (req, res) => {
    const parentPolicyId = req.params.parentPolicyId;
    const newPolicyData = req.body;
    // Validate transition eligibility
    const eligibility = await policyTransition_service_1.PolicyTransitionService.validateTransitionEligibility(parentPolicyId, 'PORTABILITY');
    if (!eligibility.eligible) {
        res.status(400).json({
            error: 'Policy not eligible for portability',
            reasons: eligibility.reasons,
            requirements: eligibility.requirements
        });
        return;
    }
    const result = await policyTransition_service_1.PolicyTransitionService.createPolicyTransition(parentPolicyId, 'PORTABILITY', newPolicyData);
    if (result.errors.length > 0) {
        res.status(400).json({
            error: 'Failed to create policy portability',
            details: result.errors
        });
        return;
    }
    res.status(201).json({
        data: result.newPolicy,
        message: 'Policy portability created successfully',
        documentReferences: result.documentReferences.length,
        documentTransferInfo: {
            totalDocumentsTransferred: result.documentReferences.length,
            transitionType: 'PORTABILITY',
            message: `Successfully transferred ${result.documentReferences.length} documents from ancestor policies`
        },
        errors: result.errors
    });
});
// Get policy transition history
exports.getPolicyTransitionHistory = (0, asyncTryCatch_1.asyncTryCatch)(async (req, res) => {
    const policyId = req.params.policyId;
    const history = await policyTransition_service_1.PolicyTransitionService.getPolicyTransitionHistory(policyId);
    res.json({
        data: history,
        message: 'Policy transition history retrieved successfully'
    });
});
// Get policy documents with inheritance
exports.getPolicyDocuments = (0, asyncTryCatch_1.asyncTryCatch)(async (req, res) => {
    const policyId = req.params.policyId;
    const { includeInherited = 'true', transitionType } = req.query;
    console.log(`🌐 getPolicyDocuments API called for policy: ${policyId}`);
    console.log(`🌐 Query params:`, { includeInherited, transitionType });
    const documents = await documentAccess_service_1.DocumentAccessService.getPolicyDocuments(policyId, {
        includeInherited: includeInherited === 'true',
        transitionType: transitionType,
        cacheResults: true
    });
    console.log(`🌐 Documents retrieved:`, documents.length);
    const stats = await documentAccess_service_1.DocumentAccessService.getDocumentAccessStats(policyId);
    console.log(`🌐 Stats:`, stats);
    res.json({
        data: documents,
        stats,
        total: documents.length,
        direct: documents.filter(d => d.access_type === 'DIRECT').length,
        referenced: documents.filter(d => d.access_type === 'REFERENCED').length
    });
});
// Validate transition eligibility
exports.validateTransitionEligibility = (0, asyncTryCatch_1.asyncTryCatch)(async (req, res) => {
    const parentPolicyId = req.params.parentPolicyId;
    const { transitionType } = req.query;
    if (!transitionType || !['RENEWAL', 'MIGRATION', 'PORTABILITY'].includes(transitionType)) {
        res.status(400).json({
            error: 'Invalid transition type. Must be RENEWAL, MIGRATION, or PORTABILITY'
        });
        return;
    }
    const eligibility = await policyTransition_service_1.PolicyTransitionService.validateTransitionEligibility(parentPolicyId, transitionType);
    res.json({
        data: eligibility,
        message: eligibility.eligible ? 'Policy is eligible for transition' : 'Policy is not eligible for transition'
    });
});
// Get document access statistics
exports.getDocumentAccessStats = (0, asyncTryCatch_1.asyncTryCatch)(async (req, res) => {
    const policyId = req.params.policyId;
    const stats = await documentAccess_service_1.DocumentAccessService.getDocumentAccessStats(policyId);
    res.json({
        data: stats,
        message: 'Document access statistics retrieved successfully'
    });
});
// Clear document cache
exports.clearDocumentCache = (0, asyncTryCatch_1.asyncTryCatch)(async (req, res) => {
    const policyId = req.params.policyId;
    documentAccess_service_1.DocumentAccessService.clearCache(policyId);
    res.json({
        message: 'Document cache cleared successfully'
    });
});
// Delete document reference
exports.deleteDocumentReference = (0, asyncTryCatch_1.asyncTryCatch)(async (req, res) => {
    const referenceId = req.params.referenceId;
    if (!referenceId) {
        res.status(400).json({
            error: 'Reference ID is required'
        });
        return;
    }
    try {
        const success = await policyTransition_service_1.PolicyTransitionService.deleteDocumentReference(referenceId);
        if (success) {
            res.status(200).json({
                message: 'Document reference deleted successfully',
                success: true
            });
        }
        else {
            res.status(400).json({
                error: 'Failed to delete document reference'
            });
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(400).json({
            error: 'Failed to delete document reference',
            message: errorMessage
        });
    }
});
// Update existing document references to be deletable (migration endpoint)
exports.updateExistingReferencesToDeletable = (0, asyncTryCatch_1.asyncTryCatch)(async (req, res) => {
    try {
        const result = await policyTransition_service_1.PolicyTransitionService.updateExistingReferencesToDeletable();
        res.status(200).json({
            message: 'Document references updated successfully',
            data: result
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({
            error: 'Failed to update document references',
            message: errorMessage
        });
    }
});
// Get document transfer statistics for policy transition
exports.getDocumentTransferStats = (0, asyncTryCatch_1.asyncTryCatch)(async (req, res) => {
    const parentPolicyId = req.params.parentPolicyId;
    const { transitionType } = req.query;
    if (!transitionType || !['RENEWAL', 'MIGRATION', 'PORTABILITY'].includes(transitionType)) {
        res.status(400).json({
            error: 'Invalid transition type. Must be RENEWAL, MIGRATION, or PORTABILITY'
        });
        return;
    }
    const stats = await policyTransition_service_1.PolicyTransitionService.getDocumentTransferStats(parentPolicyId, transitionType);
    res.json({
        data: stats,
        message: 'Document transfer statistics retrieved successfully'
    });
});
