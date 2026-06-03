"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = uploadFile;
exports.getFileUrl = getFileUrl;
exports.deleteFile = deleteFile;
// src/utils/s3Storage.ts (modified to preserve original filename)
const client_s3_1 = require("@aws-sdk/client-s3");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const uuid_1 = require("uuid");
const fs_1 = __importDefault(require("fs"));
const s3Client = new client_s3_1.S3({
    endpoint: process.env.DO_SPACES_ENDPOINT,
    region: 'us-east-1', // Digital Ocean Spaces default region
    credentials: {
        accessKeyId: process.env.DO_SPACES_KEY || '',
        secretAccessKey: process.env.DO_SPACES_SECRET || '',
    },
});
const bucketName = process.env.DO_SPACES_BUCKET || '';
async function uploadFile(file) {
    // Generate a unique ID but preserve the original filename in the stored object
    const fileExtension = file.originalname.split('.').pop();
    // Create a unique filename with the original name included
    const uniquePrefix = (0, uuid_1.v4)();
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `purchase-orders/${uniquePrefix}-${sanitizedOriginalName}`;
    const params = {
        Bucket: bucketName,
        Key: fileName,
        Body: fs_1.default.createReadStream(file.path),
        ACL: 'public-read',
        ContentType: file.mimetype,
    };
    const upload = new lib_storage_1.Upload({
        client: s3Client,
        params,
    });
    await upload.done();
    // Clean up temp file
    fs_1.default.unlinkSync(file.path);
    const endpoint = process.env.DO_SPACES_ENDPOINT?.replace(/^https?:\/\//, '');
    return {
        url: `https://${bucketName}.${endpoint}/${fileName}`,
        fileName: file.originalname,
    };
}
function getFileUrl(key) {
    return `https://${bucketName}.${process.env.DO_SPACES_ENDPOINT}/${key}`;
}
async function deleteFile(fileUrl) {
    // Extract the key from the URL
    const urlParts = fileUrl.split(`https://${bucketName}.${process.env.DO_SPACES_ENDPOINT}/`);
    if (urlParts.length !== 2)
        return;
    const key = urlParts[1];
    const params = {
        Bucket: bucketName,
        Key: key,
    };
    await s3Client.deleteObject(params);
}
