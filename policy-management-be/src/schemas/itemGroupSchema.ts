import { z } from 'zod';

// Base schemas
const baseItemGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
});

const baseItemNameSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  item_group_id: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
});

// Request schemas
export const createItemGroupSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Item group name is required"),
    description: z.string().nullable(),
  }),
});

export const updateItemGroupSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    name: z.string().min(1, "Item group name is required"),
    description: z.string().nullable(),
  }),
});

export const createItemNameSchema = z.object({
  params: z.object({
    id: z.string(), // itemGroupId
  }),
  body: z.object({
    name: z.string().min(1, "Item name is required"),
    description: z.string().nullable(),
  }),
});

export const updateItemNameSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    name: z.string().min(1, "Item name is required"),
    description: z.string().nullable(),
    item_group_id: z.string(),
  }),
});

export const getItemGroupSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const getItemNamesSchema = z.object({
  params: z.object({
    id: z.string(), // itemGroupId
  }),
});

export const getItemNameSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const deleteItemGroupSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const deleteItemNameSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

// Response schemas
export const itemGroupResponseSchema = baseItemGroupSchema;

export const itemNameResponseSchema = baseItemNameSchema;

export const itemGroupListResponseSchema = z.object({
  inward_number: z.string(),
  itemGroups: z.array(itemGroupResponseSchema),
  sites: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })),
});

export const itemNameListResponseSchema = z.array(itemNameResponseSchema);

// Types
export type CreateItemGroupRequest = z.infer<typeof createItemGroupSchema>;
export type UpdateItemGroupRequest = z.infer<typeof updateItemGroupSchema>;
export type CreateItemNameRequest = z.infer<typeof createItemNameSchema>;
export type UpdateItemNameRequest = z.infer<typeof updateItemNameSchema>;
export type GetItemGroupRequest = z.infer<typeof getItemGroupSchema>;
export type GetItemNamesRequest = z.infer<typeof getItemNamesSchema>;
export type GetItemNameRequest = z.infer<typeof getItemNameSchema>;
export type DeleteItemGroupRequest = z.infer<typeof deleteItemGroupSchema>;
export type DeleteItemNameRequest = z.infer<typeof deleteItemNameSchema>;
export type ItemGroupResponse = z.infer<typeof itemGroupResponseSchema>;
export type ItemNameResponse = z.infer<typeof itemNameResponseSchema>;
export type ItemGroupListResponse = z.infer<typeof itemGroupListResponseSchema>;
export type ItemNameListResponse = z.infer<typeof itemNameListResponseSchema>;

// Schema for item name
export const ItemNameSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  item_group_id: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
  is_deleted: z.boolean(),
});

// Schema for creating an item name
export const CreateItemNameSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
});

// Schema for updating an item name
export const UpdateItemNameSchema = z.object({
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  item_group_id: z.string().optional(),
});

// Schema for item group
export const ItemGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
  is_deleted: z.boolean(),
  itemNames: z.array(ItemNameSchema).optional(),
});

// Schema for creating an item group
export const CreateItemGroupSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
});

// Schema for updating an item group
export const UpdateItemGroupSchema = z.object({
  name: z.string().optional(),
  description: z.string().nullable().optional(),
});

// Schema for item group with token response
export const ItemGroupWithTokenSchema = z.object({
  inward_number: z.string(),
  itemGroups: z.array(ItemGroupSchema),
  site: z.string().nullable(),
});

// Schema for item name with group response
export const ItemNameWithGroupSchema = ItemNameSchema.extend({
  itemGroup: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

// Create Item Group Request Schema
export const CreateItemGroupRequestSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
});

// Update Item Group Request Schema
export const UpdateItemGroupRequestSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
});

// Create Item Name Request Schema
export const CreateItemNameRequestSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
});

// Update Item Name Request Schema
export const UpdateItemNameRequestSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  item_group_id: z.string(),
});

// Get All Item Groups Response Schema
export const GetAllItemGroupsResponseSchema = z.object({
  inward_number: z.string(),
  itemGroups: z.array(ItemGroupSchema),
  sites: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })),
});

// Error Response Schema
export const ErrorResponseSchema = z.object({
  error: z.string(),
}); 