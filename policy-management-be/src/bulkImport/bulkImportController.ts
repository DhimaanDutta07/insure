import { Request, Response } from 'express';
import { importPoliciesBulk } from './bulkImportService';
import * as fs from 'fs';

export async function importPoliciesBulkHandler(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({
        error: 'No file uploaded',
        message: 'Please upload a CSV or XLSX file',
        timestamp: new Date().toISOString(),
      });
      return;
    }
    const { originalname, buffer, path: filePath } = req.file as any;
    let fileBuffer: Buffer;
    if (buffer) {
      fileBuffer = buffer;
    } else if (filePath) {
      fileBuffer = fs.readFileSync(filePath);
    } else {
      res.status(400).json({
        error: 'File data not found',
        message: 'Could not read uploaded file',
        timestamp: new Date().toISOString(),
      });
      return;
    }
    const userId = (req as any).user?.id || 'import';
    const result = await importPoliciesBulk(fileBuffer, originalname, userId);
    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({
      error: 'Failed to import policies',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    });
  }
} 