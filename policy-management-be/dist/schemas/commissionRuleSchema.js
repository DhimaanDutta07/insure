"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commissionRuleSearchSchema = exports.commissionRuleUpdateSchema = exports.commissionRuleSchema = exports.AgeConditionEnum = exports.DeductibleTypeEnum = exports.PolicyCreationStatusEnum = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.PolicyCreationStatusEnum = zod_1.z.nativeEnum(client_1.PolicyCreationStatus);
exports.DeductibleTypeEnum = zod_1.z.nativeEnum(client_1.DeductibleType);
exports.AgeConditionEnum = zod_1.z.nativeEnum(client_1.AgeCondition);
exports.commissionRuleSchema = zod_1.z.object({
    policy_name_id: zod_1.z.string().uuid({ message: 'policy_name_id must be a valid UUID' }),
    policyStatus: exports.PolicyCreationStatusEnum,
    deductibleType: exports.DeductibleTypeEnum,
    ageCondition: exports.AgeConditionEnum,
    commissionPercent: zod_1.z.number().min(0, 'Commission percent must be non-negative'),
    is_active: zod_1.z.boolean().default(true),
});
exports.commissionRuleUpdateSchema = exports.commissionRuleSchema.partial();
// Search schema for commission rules
exports.commissionRuleSearchSchema = zod_1.z.object({
    search: zod_1.z.string().optional(),
    policyStatus: zod_1.z.string().optional(),
    deductibleType: zod_1.z.string().optional(),
    ageCondition: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().int().positive().optional().default(1),
    limit: zod_1.z.coerce.number().int().positive().optional().default(10),
});
