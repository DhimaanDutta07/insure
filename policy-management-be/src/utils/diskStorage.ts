import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { promisify } from 'util';
import { createGzip } from 'zlib';
import { pipeline } from 'stream';
import { mkdir } from 'fs/promises';

const pipelineAsync = promisify(pipeline);

// Base storage directory
const STORAGE_DIR = process.env.STORAGE_DIR || path.join(process.cwd(), 'storage');
const PURCHASE_ORDERS_DIR = path.join(__dirname, 'purchase-orders');

// Ensure storage directories exist
async function ensureDirectoriesExist() {
  try {
    await mkdir(STORAGE_DIR, { recursive: true });
    await mkdir(PURCHASE_ORDERS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating storage directories:', error);
    throw error;
  }
}

// Initialize storage on module load
ensureDirectoriesExist();

/**
 * Compresses and uploads a file to disk storage
 */
export async function uploadFile(file: Express.Multer.File) {
  const fileExtension = file.originalname.split('.').pop() || '';
  const fileName = `${uuidv4()}.${fileExtension}.gz`;
  const filePath = path.join(PURCHASE_ORDERS_DIR, fileName);
  
  try {
    // Create a gzip compressed version of the file
    const source = fs.createReadStream(file.path);
    const compress = createGzip();
    const destination = fs.createWriteStream(filePath);
    
    await pipelineAsync(
      source,
      compress,
      destination
    );
    
    // Clean up temp file
    fs.unlinkSync(file.path);
    
    return {
      url: `/api/files/purchase-orders/${fileName}`,
      fileName: file.originalname,
      storagePath: filePath
    };
  } catch (error) {
    console.error('Error compressing and storing file:', error);
    throw error;
  }
}

/**
 * Gets the full system path for a given file URL
 */
export function getFilePath(fileUrl: string): string | null {
  if (!fileUrl.startsWith('/api/files/purchase-orders/')) {
    return null;
  }
  
  const fileName = fileUrl.split('/').pop();
  if (!fileName) return null;
  
  return path.join(PURCHASE_ORDERS_DIR, fileName);
}

/**
 * Deletes a file from disk storage
 */
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

/**
 * Serves a file to the client, decompressing it first
 */
export function serveFile(fileUrl: string, res: any) {
  const filePath = getFilePath(fileUrl);
  if (!filePath) {
    res.status(404).send('File not found');
    return;
  }
  
  try {
    // Check if file exists
    fs.accessSync(filePath, fs.constants.F_OK);
    
    // Extract original filename from the stored path
    const originalFileName = path.basename(filePath, '.gz').split('.').slice(0, -1).join('.');
    
    // Set headers
    res.setHeader('Content-Disposition', `inline; filename="${originalFileName}"`);
    
    // Create read stream with decompression
    const fileStream = fs.createReadStream(filePath);
    const gunzip = createGzip();
    
    // Pipe the decompressed file to the response
    pipeline(
      fileStream,
      gunzip,
      res as NodeJS.WritableStream,
      (err: NodeJS.ErrnoException | null) => {
        if (err) {
          console.error('Error streaming file:', err);
          if (!res.headersSent) {
            res.status(500).send('Error streaming file');
          }
        }
      }
    );
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(404).send('File not found');
  }
}