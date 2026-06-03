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
Object.defineProperty(exports, "__esModule", { value: true });
exports.importPoliciesBulk = importPoliciesBulk;
const sync_1 = require("csv-parse/sync");
const xlsx = __importStar(require("xlsx"));
const bulkImportValidator_1 = require("./bulkImportValidator");
const policy_service_1 = require("../services/policy.service");
async function importPoliciesBulk(fileBuffer, originalname, userId) {
    let records = [];
    console.log("fileBuffer", fileBuffer);
    console.log("originalname", originalname);
    console.log("userId", userId);
    //Parse file
    if (originalname.endsWith('.csv')) {
        const fileContent = fileBuffer.toString();
        records = (0, sync_1.parse)(fileContent, { columns: true, skip_empty_lines: true });
    }
    else if (originalname.endsWith('.xlsx')) {
        const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        records = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    }
    else {
        throw new Error('Unsupported file type. Only CSV and XLSX are allowed.');
    }
    console.log(records, 'records');
    if (records.length === 0) {
        return {
            created: [],
            failed: [],
            errors: [{ row: 0, errors: [{ field: 'file', message: 'No data rows found', code: 'EMPTY_FILE' }] }],
            summary: { total: 0, successful: 0, failed: 0 }
        };
    }
    // Validate records (now async)
    const { validPolicies, errors } = await (0, bulkImportValidator_1.validateBulkPolicies)(records);
    // If no valid policies, return errors only
    if (validPolicies.length === 0) {
        return {
            created: [],
            failed: [],
            errors,
            summary: { total: records.length, successful: 0, failed: errors.length }
        };
    }
    // Call existing service to create valid policies
    const result = await policy_service_1.policyService.bulkCreatePolicies(validPolicies, userId);
    return {
        created: result.created,
        failed: [...errors, ...result.failed],
        errors,
        summary: {
            total: records.length,
            successful: result.created.length,
            failed: errors.length + result.failed.length
        }
    };
}
