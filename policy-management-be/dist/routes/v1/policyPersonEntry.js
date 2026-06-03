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
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const XLSX = __importStar(require("xlsx"));
const prismaClient_1 = __importDefault(require("../../utils/prismaClient")); // corrected import path
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ dest: 'uploads/' });
// POST /admin/policy-person – create single proposer record
router.post('/', async (req, res) => {
    try {
        const { full_name, mobile, email, address } = req.body;
        const proposer = await prismaClient_1.default.proposer.create({
            data: { full_name, mobile, email, address },
        });
        res.status(201).json(proposer);
    }
    catch (e) {
        console.error(e);
        res.status(400).json({ error: e.message });
    }
});
// POST /admin/policy-person/upload – bulk upload via Excel (first row = headers)
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        const created = [];
        const errors = [];
        for (const row of rows) {
            try {
                // expect columns: full_name, mobile, email, address (case‑insensitive)
                const proposer = await prismaClient_1.default.proposer.create({
                    data: {
                        full_name: row.full_name || row.FullName || '',
                        mobile: row.mobile || row.Mobile || '',
                        email: row.email || row.Email || '',
                        address: row.address || row.Address || '',
                    },
                });
                created.push(proposer);
            }
            catch (e) {
                errors.push({ row, error: e.message });
            }
        }
        res.json({ inserted: created.length, errors });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});
exports.default = router;
