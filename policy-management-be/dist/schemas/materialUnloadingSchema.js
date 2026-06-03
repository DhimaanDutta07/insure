"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateMaterialUnloadingSchema = void 0;
// materialUnloadingSchema.ts
const zod_1 = require("zod");
exports.CreateMaterialUnloadingSchema = zod_1.z.object({
    truck_number: zod_1.z.string().min(1, "Truck number is required"),
    token_number: zod_1.z.string(),
    // po_id: z.string().uuid("Invalid purchase order ID format").optional(),
    gross_weight: zod_1.z.number().min(0, "Gross weight must be greater than or equal to 0"),
    tare_weight: zod_1.z.number().min(0, "Tare weight must be greater than or equal to 0"),
    net_weight: zod_1.z.number().min(0, "Net weight must be greater than or equal to 0"),
    starch: zod_1.z.number().min(0).max(100).default(0),
    moisture: zod_1.z.number().min(0).max(100).default(0),
    remarks: zod_1.z.string().optional(),
    tfm: zod_1.z.number().min(0).max(100).default(0),
    challan_no: zod_1.z.string().min(1, "Challan number is required").optional(),
    inspected_by: zod_1.z.string().uuid("Invalid inspector ID format")
});
