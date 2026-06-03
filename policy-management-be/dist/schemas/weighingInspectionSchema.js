"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetWeighingInspectionByIdSchema = exports.CreateWeighingInspectionSchema = void 0;
const zod_1 = require("zod");
// Schema for creating a weighing inspection
exports.CreateWeighingInspectionSchema = zod_1.z.object({
    truck_number: zod_1.z.string().min(1, "Truck number is required"),
    token_number: zod_1.z.string(),
    material_id: zod_1.z.string().uuid("Valid material ID is required").optional().nullable(),
    gross_weight: zod_1.z.number().positive("Gross weight must be a positive number"),
    tare_weight: zod_1.z.number().positive("Tare weight must be a positive number"),
    net_weight: zod_1.z.number().positive("Net weight must be a positive number"),
    inspected_by: zod_1.z.string().uuid("Valid inspector ID is required")
});
// Schema for getting a weighing inspection by ID
exports.GetWeighingInspectionByIdSchema = zod_1.z.object({
    id: zod_1.z.string().uuid("Valid weighing inspection ID is required")
});
