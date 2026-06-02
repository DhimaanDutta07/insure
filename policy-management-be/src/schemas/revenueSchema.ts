import { z } from "zod";

export const createRevenueSchema = z.object({
  reimbursementId: z.string().uuid("Invalid reimbursement ID"),
  siteId: z.string().uuid("Invalid site ID"),
  area: z.number().int().min(0, "Area must be a positive integer"),
  month: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
  clientId: z.string().uuid("Invalid client ID"),
  amount: z.number().int().min(0, "Amount must be a positive integer"),
  camCharge: z.number().int().min(0, "CAM Charge must be a positive integer"),
  gst: z.number().int().min(0, "GST must be a positive integer"),
  lessTds: z.number().int().min(0, "Less TDS must be a positive integer"),
  receivable: z.number().int().min(0, "Receivable must be a positive integer"),
  receivedInBank: z.number().int().min(0, "Received in Bank must be a positive integer"),
  policyId: z.string().uuid("Invalid policy ID"),
  agentId: z.string().uuid("Invalid agent ID"),
  commissionId: z.string().uuid("Invalid commission ID"),
});

export const updateRevenueSchema = createRevenueSchema.partial();

export const timePeriodSchema = z.enum(["last3Days", "thisWeek", "thisMonth", "lastMonth"]);
export const siteIdSchema = z.string().uuid("Invalid site ID");