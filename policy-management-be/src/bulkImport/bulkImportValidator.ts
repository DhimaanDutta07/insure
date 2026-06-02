import {
  mapExcelFieldsWithDynamicMembers,
  transformExcelData,
  validateComprehensiveRecord
} from '../utils/dynamicFieldMapper';

// Validate an array of policy records for bulk import using dynamic mapping and validation
export async function validateBulkPolicies(records: any[]) {
  console.log(`[BULK_VALIDATOR] Starting validation for ${records.length} records`);
  
  const seenPolicyNumbers = new Set<string>();
  const validPolicies: any[] = [];
  const errors: { row: number; errors: any[] }[] = [];

  for (let i = 0; i < records.length; i++) {
    const originalRow = records[i];
    const rowErrors: any[] = [];

    console.log(`[BULK_VALIDATOR] Processing row ${i + 2}:`, originalRow);

    // Step 1: Map Excel fields to standard structure
    let mappedRow: any;
    try {
      console.log(`[BULK_VALIDATOR] Step 1: Mapping fields for row ${i + 2}`, validPolicies);
      mappedRow = mapExcelFieldsWithDynamicMembers(originalRow);
      console.log(`[BULK_VALIDATOR] Step 1: Mapping successful for row ${i + 2}:`, mappedRow);
    } catch (err) {
      console.error(`[BULK_VALIDATOR] Step 1: Mapping failed for row ${i + 2}:`, err);
      rowErrors.push({
        field: 'mapping',
        message: 'Failed to map fields',
        code: 'MAPPING_ERROR',
        details: err instanceof Error ? err.message : String(err)
      });
      errors.push({ row: i + 2, errors: rowErrors });
      continue;
    }

    // Step 2: Transform (data normalization only - lookups handled in repository)
    let transformedRow: any;
    try {
      console.log(`[BULK_VALIDATOR] Step 2: Transforming data for row ${i + 2}`, mappedRow);
      transformedRow = transformExcelData(mappedRow);
      console.log(`[BULK_VALIDATOR] Step 2: Transformation successful for row ${i + 2}:`, transformedRow);
    } catch (err) {
      console.error(`[BULK_VALIDATOR] Step 2: Transformation failed for row ${i + 2}:`, err);
      rowErrors.push({
        field: 'transformation',
        message: 'Failed to transform data',
        code: 'TRANSFORM_ERROR',
        details: err instanceof Error ? err.message : String(err)
      });
      errors.push({ row: i + 2, errors: rowErrors });
      continue;
    }

    // Step 3: Check for duplicate policy_number in the file
    if (transformedRow.policy_number) {
      console.log(`[BULK_VALIDATOR] Step 3: Checking policy number "${transformedRow.policy_number}" for row ${i + 2}`,validPolicies);
      if (seenPolicyNumbers.has(transformedRow.policy_number)) {
        console.warn(`[BULK_VALIDATOR] Step 3: Duplicate policy number "${transformedRow.policy_number}" found in row ${i + 2}`);
        rowErrors.push({
          field: 'policy_number',
          message: 'Duplicate policy number in file',
          code: 'DUPLICATE_IN_FILE',
        });
      } else {
        seenPolicyNumbers.add(transformedRow.policy_number);
        console.log(`[BULK_VALIDATOR] Step 3: Policy number "${transformedRow.policy_number}" is unique for row ${i + 2}`);
      }
    } else {
      console.warn(`[BULK_VALIDATOR] Step 3: No policy number found for row ${i + 2}`);
    }

    // Step 4: Validate with ComprehensiveImportSchema
    console.log(`[BULK_VALIDATOR] Step 4: Validating comprehensive record for row ${i + 2}`, validPolicies);
    const validationResult = validateComprehensiveRecord(transformedRow);
    if (!validationResult.success) {
      console.error(`[BULK_VALIDATOR] Step 4: Validation failed for row ${i + 2}:`, validationResult.error);
      rowErrors.push(...(validationResult.error.errors || []));
    } else {
      console.log(`[BULK_VALIDATOR] Step 4: Validation successful for row ${i + 2}`);
    }

    if (rowErrors.length > 0) {
      console.error(`[BULK_VALIDATOR] Row ${i + 2} has ${rowErrors.length} errors:`, rowErrors);
      errors.push({ row: i + 2, errors: rowErrors }); // +2 for header and 0-index
    } else {
      console.log(`[BULK_VALIDATOR] Row ${i + 2} is valid, adding to valid policies`);
      if (validationResult.success && 'data' in validationResult) {
        validPolicies.push(validationResult.data);
      }
    }
  }

  console.log(`[BULK_VALIDATOR] Validation complete. Valid policies: ${validPolicies.length}, Errors: ${errors.length}`);
  console.log(`[BULK_VALIDATOR] Summary - Total processed: ${records.length}, Valid: ${validPolicies.length}, Invalid: ${errors.length}`);

  return { validPolicies, errors };
} 