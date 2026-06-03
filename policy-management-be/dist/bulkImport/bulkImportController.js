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
exports.importPoliciesBulkHandler = importPoliciesBulkHandler;
const bulkImportService_1 = require("./bulkImportService");
const fs = __importStar(require("fs"));
async function importPoliciesBulkHandler(req, res) {
    try {
        if (!req.file) {
            res.status(400).json({
                error: 'No file uploaded',
                message: 'Please upload a CSV or XLSX file',
                timestamp: new Date().toISOString(),
            });
            return;
        }
        const { originalname, buffer, path: filePath } = req.file;
        let fileBuffer;
        if (buffer) {
            fileBuffer = buffer;
        }
        else if (filePath) {
            fileBuffer = fs.readFileSync(filePath);
        }
        else {
            res.status(400).json({
                error: 'File data not found',
                message: 'Could not read uploaded file',
                timestamp: new Date().toISOString(),
            });
            return;
        }
        const userId = req.user?.id || 'import';
        const result = await (0, bulkImportService_1.importPoliciesBulk)(fileBuffer, originalname, userId);
        res.json({
            success: true,
            ...result,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Bulk import error:', error);
        res.status(500).json({
            error: 'Failed to import policies',
            message: error instanceof Error ? error.message : 'An unexpected error occurred',
            timestamp: new Date().toISOString(),
        });
    }
}
