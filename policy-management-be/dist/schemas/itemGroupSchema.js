"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorResponseSchema = exports.GetAllItemGroupsResponseSchema = exports.UpdateItemNameRequestSchema = exports.CreateItemNameRequestSchema = exports.UpdateItemGroupRequestSchema = exports.CreateItemGroupRequestSchema = exports.ItemNameWithGroupSchema = exports.ItemGroupWithTokenSchema = exports.UpdateItemGroupSchema = exports.CreateItemGroupSchema = exports.ItemGroupSchema = exports.UpdateItemNameSchema = exports.CreateItemNameSchema = exports.ItemNameSchema = exports.itemNameListResponseSchema = exports.itemGroupListResponseSchema = exports.itemNameResponseSchema = exports.itemGroupResponseSchema = exports.deleteItemNameSchema = exports.deleteItemGroupSchema = exports.getItemNameSchema = exports.getItemNamesSchema = exports.getItemGroupSchema = exports.updateItemNameSchema = exports.createItemNameSchema = exports.updateItemGroupSchema = exports.createItemGroupSchema = void 0;
const zod_1 = require("zod");
// Base schemas
const baseItemGroupSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    created_at: zod_1.z.date(),
    updated_at: zod_1.z.date(),
});
const baseItemNameSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    item_group_id: zod_1.z.string(),
    created_at: zod_1.z.date(),
    updated_at: zod_1.z.date(),
});
// Request schemas
exports.createItemGroupSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, "Item group name is required"),
        description: zod_1.z.string().nullable(),
    }),
});
exports.updateItemGroupSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string(),
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, "Item group name is required"),
        description: zod_1.z.string().nullable(),
    }),
});
exports.createItemNameSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string(), // itemGroupId
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, "Item name is required"),
        description: zod_1.z.string().nullable(),
    }),
});
exports.updateItemNameSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string(),
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, "Item name is required"),
        description: zod_1.z.string().nullable(),
        item_group_id: zod_1.z.string(),
    }),
});
exports.getItemGroupSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string(),
    }),
});
exports.getItemNamesSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string(), // itemGroupId
    }),
});
exports.getItemNameSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string(),
    }),
});
exports.deleteItemGroupSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string(),
    }),
});
exports.deleteItemNameSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string(),
    }),
});
// Response schemas
exports.itemGroupResponseSchema = baseItemGroupSchema;
exports.itemNameResponseSchema = baseItemNameSchema;
exports.itemGroupListResponseSchema = zod_1.z.object({
    inward_number: zod_1.z.string(),
    itemGroups: zod_1.z.array(exports.itemGroupResponseSchema),
    sites: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
    })),
});
exports.itemNameListResponseSchema = zod_1.z.array(exports.itemNameResponseSchema);
// Schema for item name
exports.ItemNameSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    item_group_id: zod_1.z.string(),
    created_at: zod_1.z.date(),
    updated_at: zod_1.z.date(),
    is_deleted: zod_1.z.boolean(),
});
// Schema for creating an item name
exports.CreateItemNameSchema = zod_1.z.object({
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
});
// Schema for updating an item name
exports.UpdateItemNameSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    description: zod_1.z.string().nullable().optional(),
    item_group_id: zod_1.z.string().optional(),
});
// Schema for item group
exports.ItemGroupSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    created_at: zod_1.z.date(),
    updated_at: zod_1.z.date(),
    is_deleted: zod_1.z.boolean(),
    itemNames: zod_1.z.array(exports.ItemNameSchema).optional(),
});
// Schema for creating an item group
exports.CreateItemGroupSchema = zod_1.z.object({
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
});
// Schema for updating an item group
exports.UpdateItemGroupSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    description: zod_1.z.string().nullable().optional(),
});
// Schema for item group with token response
exports.ItemGroupWithTokenSchema = zod_1.z.object({
    inward_number: zod_1.z.string(),
    itemGroups: zod_1.z.array(exports.ItemGroupSchema),
    site: zod_1.z.string().nullable(),
});
// Schema for item name with group response
exports.ItemNameWithGroupSchema = exports.ItemNameSchema.extend({
    itemGroup: zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
    }),
});
// Create Item Group Request Schema
exports.CreateItemGroupRequestSchema = zod_1.z.object({
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
});
// Update Item Group Request Schema
exports.UpdateItemGroupRequestSchema = zod_1.z.object({
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
});
// Create Item Name Request Schema
exports.CreateItemNameRequestSchema = zod_1.z.object({
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
});
// Update Item Name Request Schema
exports.UpdateItemNameRequestSchema = zod_1.z.object({
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    item_group_id: zod_1.z.string(),
});
// Get All Item Groups Response Schema
exports.GetAllItemGroupsResponseSchema = zod_1.z.object({
    inward_number: zod_1.z.string(),
    itemGroups: zod_1.z.array(exports.ItemGroupSchema),
    sites: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
    })),
});
// Error Response Schema
exports.ErrorResponseSchema = zod_1.z.object({
    error: zod_1.z.string(),
});
