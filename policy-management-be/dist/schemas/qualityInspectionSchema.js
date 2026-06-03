"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateQualityInspectionSchema = exports.QualityInspectionSchema = void 0;
const zod_1 = require("zod");
exports.QualityInspectionSchema = zod_1.z.object({
    truck_registration_id: zod_1.z.string().uuid({
        message: 'Valid truck registration ID is required',
    }),
    material_id: zod_1.z.string().uuid({
        message: 'Valid material ID is required',
    }),
    starch_percentage: zod_1.z
        .number()
        .min(0, { message: 'Starch percentage must be at least 0%' })
        .max(100, { message: 'Starch percentage cannot exceed 100%' })
        .optional(),
    moisture_percentage: zod_1.z
        .number()
        .min(0, { message: 'Moisture percentage must be at least 0%' })
        .max(100, { message: 'Moisture percentage cannot exceed 100%' })
        .optional(),
    tfm_percentage: zod_1.z
        .number()
        .min(0, { message: 'TFM percentage must be at least 0%' })
        .max(100, { message: 'TFM percentage cannot exceed 100%' })
        .optional(),
    remarks: zod_1.z.string().optional(),
    result: zod_1.z.enum(['Accepted', 'Rejected']),
    inspected_by: zod_1.z.string().uuid({
        message: 'Valid inspector ID is required',
    }),
});
exports.CreateQualityInspectionSchema = zod_1.z.object({
    truck_number: zod_1.z.string({
        required_error: 'Truck registration number is required',
    }),
    token_number: zod_1.z.string(),
    material_id: zod_1.z.string().uuid({
        message: 'Valid material ID is required',
    }).optional(),
    starch_percentage: zod_1.z
        .number()
        .min(0, { message: 'Starch percentage must be at least 0%' })
        .max(100, { message: 'Starch percentage cannot exceed 100%' })
        .optional(),
    moisture_percentage: zod_1.z
        .number()
        .min(0, { message: 'Moisture percentage must be at least 0%' })
        .max(100, { message: 'Moisture percentage cannot exceed 100%' })
        .optional(),
    tfm_percentage: zod_1.z
        .number()
        .min(0, { message: 'TFM percentage must be at least 0%' })
        .max(100, { message: 'TFM percentage cannot exceed 100%' })
        .optional(),
    remarks: zod_1.z.string().optional(),
    result: zod_1.z.enum(['Accepted', 'Rejected']),
    inspected_by: zod_1.z.string().uuid({
        message: 'Valid inspector ID is required',
    }),
});
