import { parse } from 'csv-parse/sync';
import * as xlsx from 'xlsx';
import { validateBulkPolicies } from './bulkImportValidator';
import { policyService } from '../services/policy.service';

export async function importPoliciesBulk(fileBuffer: Buffer, originalname: string, userId: string) {
  let records: any[] = [];

  console.log("fileBuffer", fileBuffer);
  console.log("originalname", originalname);
  console.log("userId", userId);

  //Parse file
  if (originalname.endsWith('.csv')) {
    const fileContent = fileBuffer.toString();
    records = parse(fileContent, { columns: true, skip_empty_lines: true });
  } else if (originalname.endsWith('.xlsx')) {
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    records = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  } else {
    throw new Error('Unsupported file type. Only CSV and XLSX are allowed.');
  }

  console.log(records, 'records')

  if (records.length === 0) {
    return {
      created: [],
      failed: [],
      errors: [{ row: 0, errors: [{ field: 'file', message: 'No data rows found', code: 'EMPTY_FILE' }] }],
      summary: { total: 0, successful: 0, failed: 0 }
    };
  }

  // Validate records (now async)
  const { validPolicies, errors } = await validateBulkPolicies(records);

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
  const result = await policyService.bulkCreatePolicies(validPolicies, userId);

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