import { z } from 'zod';

// Base schemas
const basePolicyGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
  is_deleted: z.boolean(),
});

const basePolicyNameSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  policy_group_id: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
  is_deleted: z.boolean(),
});

// Request schemas
export const createPolicyGroupSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Policy group name is required"),
    description: z.string().nullable(),
  }),
});

export const updatePolicyGroupSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    name: z.string().min(1, "Policy group name is required"),
    description: z.string().nullable(),
  }),
});

export const createPolicyNameSchema = z.object({
  params: z.object({
    id: z.string(), // policyGroupId
  }),
  body: z.object({
    name: z.string().min(1, "Policy name is required"),
    description: z.string().nullable(),
  }),
});

export const updatePolicyNameSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    name: z.string().min(1, "Policy name is required"),
    description: z.string().nullable(),
    policy_group_id: z.string(),
  }),
});

export const getPolicyGroupSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const getPolicyNamesSchema = z.object({
  params: z.object({
    id: z.string(), // policyGroupId
  }),
});

export const getPolicyNameSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const deletePolicyGroupSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const deletePolicyNameSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

// Response schemas
export const policyGroupResponseSchema = basePolicyGroupSchema;

export const policyNameResponseSchema = basePolicyNameSchema;

export const policyGroupListResponseSchema = z.object({
  policyGroups: z.array(policyGroupResponseSchema),
});

export const policyNameListResponseSchema = z.array(policyNameResponseSchema);

// Types
export type CreatePolicyGroupRequest = z.infer<typeof createPolicyGroupSchema>;
export type UpdatePolicyGroupRequest = z.infer<typeof updatePolicyGroupSchema>;
export type CreatePolicyNameRequest = z.infer<typeof createPolicyNameSchema>;
export type UpdatePolicyNameRequest = z.infer<typeof updatePolicyNameSchema>;
export type GetPolicyGroupRequest = z.infer<typeof getPolicyGroupSchema>;
export type GetPolicyNamesRequest = z.infer<typeof getPolicyNamesSchema>;
export type GetPolicyNameRequest = z.infer<typeof getPolicyNameSchema>;
export type DeletePolicyGroupRequest = z.infer<typeof deletePolicyGroupSchema>;
export type DeletePolicyNameRequest = z.infer<typeof deletePolicyNameSchema>;
export type PolicyGroupResponse = z.infer<typeof policyGroupResponseSchema>;
export type PolicyNameResponse = z.infer<typeof policyNameResponseSchema>;
export type PolicyGroupListResponse = z.infer<typeof policyGroupListResponseSchema>;
export type PolicyNameListResponse = z.infer<typeof policyNameListResponseSchema>;

// Schema for policy name
export const PolicyNameSchema = basePolicyNameSchema;

// Schema for creating a policy name
export const CreatePolicyNameSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
});

// Schema for updating a policy name
export const UpdatePolicyNameSchema = z.object({
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  policy_group_id: z.string().optional(),
});

// Schema for policy group
export const PolicyGroupSchema = basePolicyGroupSchema.extend({
  itemNames: z.array(PolicyNameSchema).optional(),
});

// Schema for creating a policy group
export const CreatePolicyGroupSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
});

// Schema for updating a policy group
export const UpdatePolicyGroupSchema = z.object({
  name: z.string().optional(),
  description: z.string().nullable().optional(),
});

// Schema for policy group with names response
export const PolicyGroupWithNamesSchema = z.object({
  policyGroups: z.array(PolicyGroupSchema),
});

// Schema for policy name with group response
export const PolicyNameWithGroupSchema = PolicyNameSchema.extend({
  policyGroup: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    created_at: z.date(),
    updated_at: z.date(),
  }),
});

// Error Response Schema
export const ErrorResponseSchema = z.object({
  error: z.string(),
}); 