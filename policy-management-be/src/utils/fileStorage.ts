import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { promisify } from 'util';
// import { createGunzip, createGzip } from 'zlib';  // Commented out as we're not using compression
import { pipeline } from 'stream';
import { mkdir } from 'fs/promises';

const pipelineAsync = promisify(pipeline);

// Use a web-accessible path on DigitalOcean, or /tmp on Vercel
const STORAGE_DIR = process.env.STORAGE_DIR || (process.env.VERCEL ? '/tmp/uploads' : '/var/www/html/uploads');
const MATERIAL_RECEIPTS_DIR = path.join(STORAGE_DIR, 'material-receipts');
export const IMAGES_DIR = path.join(MATERIAL_RECEIPTS_DIR, 'images');

// This should be your server's domain or IP address
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'https://footprints-api.mindrops.com'; 
const PUBLIC_PATH = '/api/files';  // Update to match the route path in the routes file

async function ensureDirectoriesExist() {
  try {
    console.log(`Ensuring directory exists: ${IMAGES_DIR}`);
    await mkdir(IMAGES_DIR, { recursive: true });
    console.log(`Directory created/confirmed: ${IMAGES_DIR}`);
  } catch (error) {
    console.error('Error creating storage directories:', error);
    console.error('Full error:', error);
    throw error;
  }
}

// Ensure directories exist on startup
ensureDirectoriesExist().catch(error => {
  console.error('Failed to create storage directories:', error);
  // Don't exit on Vercel - /tmp may not exist at startup but will be created on demand
  if (!process.env.VERCEL) {
    process.exit(1);
  }
});

// export async function uploadFile(file: Express.Multer.File) {
//   const fileExtension = file.originalname.split('.').pop() || '';
//   // Removed .gz extension since we're no longer compressing files
//   const fileName = `${uuidv4()}.${fileExtension}`;
//   const filePath = path.join(IMAGES_DIR, fileName);
  
//   // Create the public URL that will be accessible on the web
//   // Use a consistent URL format that works with the static file serving
//   const publicUrl = `/api/files/material-receipts/images/${fileName}`;

//   try {
//     const source = fs.createReadStream(file.path);
//     // Removed compression step
//     // const compress = createGzip();
//     const destination = fs.createWriteStream(filePath);

//     // Upload file directly without compression
//     // await pipelineAsync(source, compress, destination);
//     await pipelineAsync(source, destination);
//     fs.unlinkSync(file.path); // Remove temporary file

//     console.log(`File uploaded successfully: ${filePath}`);
//     console.log(`Public URL: ${publicUrl}`);

//     // Check if file exists after upload
//     const fileExists = fs.existsSync(filePath);
//     const directUrl = fileExists ? getPublicUrl(publicUrl) : undefined;
//     const isPlaceholder = !fileExists;

//     return {
//       url: publicUrl, // This will be stored in the database
//       fileName: file.originalname,
//       storagePath: filePath,
//       directUrl,
//       isPlaceholder,
//     };
//   } catch (error) {
//     console.error('Error storing file:', error);
//     throw error;
//   }
// }
export async function uploadFile(file: Express.Multer.File, policyNumber: string) {
  if (!policyNumber) {
    throw new Error('Policy number is required to organize uploads');
  }

  // Sanitize policy number to make it filesystem-safe (optional but recommended)
  const safePolicyNumber = policyNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
  const policyDir = path.join(IMAGES_DIR, safePolicyNumber);
  await mkdir(policyDir, { recursive: true });

  const fileExtension = file.originalname.split('.').pop() || '';
  const fileName = `${uuidv4()}.${fileExtension}`;
  const filePath = path.join(policyDir, fileName);

  const publicUrl = `/api/files/material-receipts/images/${safePolicyNumber}/${fileName}`;

  try {
    const source = fs.createReadStream(file.path);
    const destination = fs.createWriteStream(filePath);
    await pipelineAsync(source, destination);
    fs.unlinkSync(file.path);

    const fileExists = fs.existsSync(filePath);
    const directUrl = fileExists ? getPublicUrl(publicUrl) : undefined;
    const isPlaceholder = !fileExists;

    return {
      url: publicUrl,
      fileName: file.originalname,
      storagePath: filePath,
      directUrl,
      isPlaceholder,
    };
  } catch (error) {
    console.error('Error storing file:', error);
    throw error;
  }
}


export function getFilePath(fileUrl: string): string | null {
  console.log(`Getting file path for URL: ${fileUrl}`);
  
  // If the input is already a full filesystem path
  if (fileUrl.startsWith(STORAGE_DIR)) {
    console.log(`URL is already a file system path: ${fileUrl}`);
    // Check if file exists at the given path
    if (fs.existsSync(fileUrl)) {
      return fileUrl;
    }
    console.log(`File does not exist at path: ${fileUrl}`);
  }
  
  // Remove /api/files prefix 
  if (fileUrl.startsWith('/api/files/')) {
    const relativePath = fileUrl.substring('/api/files/'.length);
    const fullPath = path.join(STORAGE_DIR, relativePath);
    console.log(`Converted /api/files/ path to: ${fullPath}`);
    return fullPath;
  }
  
  if (fileUrl.startsWith(PUBLIC_PATH)) {
    const relativePath = fileUrl.substring(PUBLIC_PATH.length);
    if (!relativePath) return null;
    const fullPath = path.join(STORAGE_DIR, relativePath);
    console.log(`Converted ${PUBLIC_PATH} path to: ${fullPath}`);
    return fullPath;
  }
  
  // Check for timestamp-based filenames (multer default naming)
  if (/\/\d{13}-[^\/]+$/.test(fileUrl)) {
    const filename = fileUrl.split('/').pop();
    if (!filename) return null;
    
    // If file exists as is, return it
    if (fs.existsSync(fileUrl)) {
      console.log(`Found timestamp-based file at original path: ${fileUrl}`);
      return fileUrl;
    }
    
    // Try to locate in upload folder
    const uploadFolderPath = path.join(STORAGE_DIR, filename);
    if (fs.existsSync(uploadFolderPath)) {
      console.log(`Found timestamp-based file in upload folder: ${uploadFolderPath}`);
      return uploadFolderPath;
    }
    
    console.log(`Could not find timestamp-based file: ${filename} in any expected location`);
  }
  
  console.log(`Invalid file URL format: ${fileUrl}`);
  return null;
}

export async function deleteFile(fileUrl: string): Promise<boolean> {
  const filePath = getFilePath(fileUrl);
  if (!filePath) return false;

  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    await fs.promises.unlink(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

export function serveFile(fileUrl: string, res: any) {
  console.log(`Attempting to serve file: ${fileUrl}`);
  
  // Normalize URL to handle potential double slashes
  const fileUrl_2 = fileUrl.replace(/\/+/g, '/');
  console.log(`Normalized URL: ${fileUrl_2}`);
  
  const filePath = getFilePath(fileUrl);
  if (!filePath) {
    console.error(`File path could not be determined from URL: ${fileUrl}`);
    res.status(404).send('File not found - invalid URL format');
    return;
  }

  try {
    console.log(`Checking if file exists: ${filePath}`);
    fs.accessSync(filePath, fs.constants.F_OK);
    const originalFileName = path.basename(filePath);
    
    // Set appropriate content type based on file extension
    const ext = path.extname(originalFileName).toLowerCase();
    let contentType = 'application/octet-stream';
    switch (ext) {
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.doc':
        contentType = 'application/msword';
        break;
      case '.docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      case '.xls':
        contentType = 'application/vnd.ms-excel';
        break;
      case '.xlsx':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
    }
    

    // Set headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${originalFileName}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).send('Error streaming file');
      }
    });
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(404).send('File not found');
  }
}

// Helper function to get the real URL for a file
export function getPublicUrl(relativePath: string): string {
  // Don't add domain if it's already a full URL
  if (relativePath.startsWith('http')) {
    return relativePath;
  }
  
  // Remove any leading slash from relativePath to avoid double slashes
  const cleanPath = relativePath.replace(/^\//, '');
  
  // Fix double /api paths in URLs
  if (cleanPath.startsWith('api/files/')) {
    return `${PUBLIC_BASE_URL}/${cleanPath}`;
  }
  
  if (cleanPath.includes('/api/files/')) {
    // Extract the part after /api/files/
    const parts = cleanPath.split('/api/files/');
    return `${PUBLIC_BASE_URL}/api/files/${parts[1]}`;
  }
  
  // Normal case for other relative paths
  return `${PUBLIC_BASE_URL}/${cleanPath.startsWith('api/v1') ? cleanPath : `api/v1${relativePath}`}`;
}