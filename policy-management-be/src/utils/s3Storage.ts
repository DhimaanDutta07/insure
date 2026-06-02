// src/utils/s3Storage.ts (modified to preserve original filename)
import { S3 } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const s3Client = new S3({
  endpoint: process.env.DO_SPACES_ENDPOINT,
  region: 'us-east-1', // Digital Ocean Spaces default region
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY || '',
    secretAccessKey: process.env.DO_SPACES_SECRET || '',
  },
});

const bucketName = process.env.DO_SPACES_BUCKET || '';

export async function uploadFile(file: Express.Multer.File) {
  // Generate a unique ID but preserve the original filename in the stored object
  const fileExtension = file.originalname.split('.').pop();
  // Create a unique filename with the original name included
  const uniquePrefix = uuidv4();
  const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `purchase-orders/${uniquePrefix}-${sanitizedOriginalName}`;
  
  const params = {
    Bucket: bucketName,
    Key: fileName,
    Body: fs.createReadStream(file.path),
    ACL: 'public-read' as 'public-read',
    ContentType: file.mimetype,
  };

  const upload = new Upload({
    client: s3Client,
    params,
  });

  await upload.done();
  
  // Clean up temp file
  fs.unlinkSync(file.path);
  
  const endpoint = process.env.DO_SPACES_ENDPOINT?.replace(/^https?:\/\//, ''); 

  return {
    url: `https://${bucketName}.${endpoint}/${fileName}`,
    fileName: file.originalname,
  };

}

export function getFileUrl(key: string) {
  return `https://${bucketName}.${process.env.DO_SPACES_ENDPOINT}/${key}`;
}

export async function deleteFile(fileUrl: string) {
  // Extract the key from the URL
  const urlParts = fileUrl.split(`https://${bucketName}.${process.env.DO_SPACES_ENDPOINT}/`);
  if (urlParts.length !== 2) return;
  
  const key = urlParts[1];
  
  const params = {
    Bucket: bucketName,
    Key: key,
  };
  
  await s3Client.deleteObject(params);
}