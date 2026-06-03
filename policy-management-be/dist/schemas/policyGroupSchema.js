"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorResponseSchema = exports.PolicyNameWithGroupSchema = exports.PolicyGroupWithNamesSchema = exports.UpdatePolicyGroupSchema = exports.CreatePolicyGroupSchema = exports.PolicyGroupSchema = exports.UpdatePolicyNameSchema = exports.CreatePolicyNameSchema = exports.PolicyNameSchema = exports.policyNameListResponseSchema = exports.policyGroupListResponseSchema = exports.policyNameResponseSchema = exports.policyGroupResponseSchema = exports.deletePolicyNameSchema = exports.deletePolicyGroupSchema = exports.getPolicyNameSchema = exports.getPolicyNamesSchema = exports.getPolicyGroupSchema = exports.updatePolicyNameSchema = exports.createPolicyNameSchema = exports.updatePolicyGroupSchema = exports.createPolicyGroupSchema = void 0;
const zod_1 = require("zod");
// Base schemas
const basePolicyGroupSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    created_at: zod_1.z.date(),
    updated_at: zod_1.z.date(),
    is_deleted: zod_1.z.boolean(),
});
const basePolicyNameSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    policy_group_id: zod_1.z.string(),
    created_at: zod_1.z.date(),
    updated_at: zod_1.z.date(),
    is_deleted: zod_1.z.boolean(),
});
// Request schemas
exports.createPolicyGroupSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, "Policy group name is required"),
        description: zod_1.z.string().nullable(),
    }),
});
exports.updatePolicyGroupSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string(),
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, "Policy group name is required"),
        description: zod_1.z.string().nullable(),
    }),
});
exports.createPolicyNameSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string(), // policyGroupId
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, "Policy name is required"),
        description: zod_1.z.string().nullable(),
    }),
});
exports.updatePolicyNameSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string(),
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, "Policy name is required"),
        description: zod_1.z.string().nullable(),
        policy_group_id: zod_1.z.string(),
    }),
});
exports.getPolicyGroupSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string(),
    }),
});
exports.getPolicyNamesSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string(), // policyGroupId
    }),
});
exports.getPolicyNameSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string(),
    }),
});
exports.deletePolicyGroupSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string(),
    }),
});
exports.deletePolicyNameSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string(),
    }),
});
// Response schemas
exports.policyGroupResponseSchema = basePolicyGroupSchema;
exports.policyNameResponseSchema = basePolicyNameSchema;
exports.policyGroupListResponseSchema = zod_1.z.object({
    policyGroups: zod_1.z.array(exports.policyGroupResponseSchema),
});
exports.policyNameListResponseSchema = zod_1.z.array(exports.policyNameResponseSchema);
// Schema for policy name
exports.PolicyNameSchema = basePolicyNameSchema;
// Schema for creating a policy name
exports.CreatePolicyNameSchema = zod_1.z.object({
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
});
// Schema for updating a policy name
exports.UpdatePolicyNameSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    description: zod_1.z.string().nullable().optional(),
    policy_group_id: zod_1.z.string().optional(),
});
// Schema for policy group
exports.PolicyGroupSchema = basePolicyGroupSchema.extend({
    itemNames: zod_1.z.array(exports.PolicyNameSchema).optional(),
});
// Schema for creating a policy group
exports.CreatePolicyGroupSchema = zod_1.z.object({
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
});
// Schema for updating a policy group
exports.UpdatePolicyGroupSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    description: zod_1.z.string().nullable().optional(),
});
// Schema for policy group with names response
exports.PolicyGroupWithNamesSchema = zod_1.z.object({
    policyGroups: zod_1.z.array(exports.PolicyGroupSchema),
});
// Schema for policy name with group response
exports.PolicyNameWithGroupSchema = exports.PolicyNameSchema.extend({
    policyGroup: zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        description: zod_1.z.string().nullable(),
        created_at: zod_1.z.date(),
        updated_at: zod_1.z.date(),
    }),
});
// Error Response Schema
exports.ErrorResponseSchema = zod_1.z.object({
    error: zod_1.z.string(),
});
