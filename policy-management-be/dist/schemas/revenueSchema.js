"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.siteIdSchema = exports.timePeriodSchema = exports.updateRevenueSchema = exports.createRevenueSchema = void 0;
const zod_1 = require("zod");
exports.createRevenueSchema = zod_1.z.object({
    reimbursementId: zod_1.z.string().uuid("Invalid reimbursement ID"),
    siteId: zod_1.z.string().uuid("Invalid site ID"),
    area: zod_1.z.number().int().min(0, "Area must be a positive integer"),
    month: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
    clientId: zod_1.z.string().uuid("Invalid client ID"),
    amount: zod_1.z.number().int().min(0, "Amount must be a positive integer"),
    camCharge: zod_1.z.number().int().min(0, "CAM Charge must be a positive integer"),
    gst: zod_1.z.number().int().min(0, "GST must be a positive integer"),
    lessTds: zod_1.z.number().int().min(0, "Less TDS must be a positive integer"),
    receivable: zod_1.z.number().int().min(0, "Receivable must be a positive integer"),
    receivedInBank: zod_1.z.number().int().min(0, "Received in Bank must be a positive integer"),
    policyId: zod_1.z.string().uuid("Invalid policy ID"),
    agentId: zod_1.z.string().uuid("Invalid agent ID"),
    commissionId: zod_1.z.string().uuid("Invalid commission ID"),
});
exports.updateRevenueSchema = exports.createRevenueSchema.partial();
exports.timePeriodSchema = zod_1.z.enum(["last3Days", "thisWeek", "thisMonth", "lastMonth"]);
exports.siteIdSchema = zod_1.z.string().uuid("Invalid site ID");
