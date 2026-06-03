"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = uploadFile;
exports.getFilePath = getFilePath;
exports.deleteFile = deleteFile;
exports.serveFile = serveFile;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const util_1 = require("util");
const zlib_1 = require("zlib");
const stream_1 = require("stream");
const promises_1 = require("fs/promises");
const pipelineAsync = (0, util_1.promisify)(stream_1.pipeline);
// Base storage directory
const STORAGE_DIR = process.env.STORAGE_DIR || path_1.default.join(process.cwd(), 'storage');
const PURCHASE_ORDERS_DIR = path_1.default.join(__dirname, 'purchase-orders');
// Ensure storage directories exist
async function ensureDirectoriesExist() {
    try {
        await (0, promises_1.mkdir)(STORAGE_DIR, { recursive: true });
        await (0, promises_1.mkdir)(PURCHASE_ORDERS_DIR, { recursive: true });
    }
    catch (error) {
        console.error('Error creating storage directories:', error);
        throw error;
    }
}
// Initialize storage on module load
ensureDirectoriesExist();
/**
 * Compresses and uploads a file to disk storage
 */
async function uploadFile(file) {
    const fileExtension = file.originalname.split('.').pop() || '';
    const fileName = `${(0, uuid_1.v4)()}.${fileExtension}.gz`;
    const filePath = path_1.default.join(PURCHASE_ORDERS_DIR, fileName);
    try {
        // Create a gzip compressed version of the file
        const source = fs_1.default.createReadStream(file.path);
        const compress = (0, zlib_1.createGzip)();
        const destination = fs_1.default.createWriteStream(filePath);
        await pipelineAsync(source, compress, destination);
        // Clean up temp file
        fs_1.default.unlinkSync(file.path);
        return {
            url: `/api/files/purchase-orders/${fileName}`,
            fileName: file.originalname,
            storagePath: filePath
        };
    }
    catch (error) {
        console.error('Error compressing and storing file:', error);
        throw error;
    }
}
/**
 * Gets the full system path for a given file URL
 */
function getFilePath(fileUrl) {
    if (!fileUrl.startsWith('/api/files/purchase-orders/')) {
        return null;
    }
    const fileName = fileUrl.split('/').pop();
    if (!fileName)
        return null;
    return path_1.default.join(PURCHASE_ORDERS_DIR, fileName);
}
/**
 * Deletes a file from disk storage
 */
async function deleteFile(fileUrl) {
    const filePath = getFilePath(fileUrl);
    if (!filePath)
        return false;
    try {
        await fs_1.default.promises.access(filePath, fs_1.default.constants.F_OK);
        await fs_1.default.promises.unlink(filePath);
        return true;
    }
    catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
}
/**
 * Serves a file to the client, decompressing it first
 */
function serveFile(fileUrl, res) {
    const filePath = getFilePath(fileUrl);
    if (!filePath) {
        res.status(404).send('File not found');
        return;
    }
    try {
        // Check if file exists
        fs_1.default.accessSync(filePath, fs_1.default.constants.F_OK);
        // Extract original filename from the stored path
        const originalFileName = path_1.default.basename(filePath, '.gz').split('.').slice(0, -1).join('.');
        // Set headers
        res.setHeader('Content-Disposition', `inline; filename="${originalFileName}"`);
        // Create read stream with decompression
        const fileStream = fs_1.default.createReadStream(filePath);
        const gunzip = (0, zlib_1.createGzip)();
        // Pipe the decompressed file to the response
        (0, stream_1.pipeline)(fileStream, gunzip, res, (err) => {
            if (err) {
                console.error('Error streaming file:', err);
                if (!res.headersSent) {
                    res.status(500).send('Error streaming file');
                }
            }
        });
    }
    catch (error) {
        console.error('Error serving file:', error);
        res.status(404).send('File not found');
    }
}
