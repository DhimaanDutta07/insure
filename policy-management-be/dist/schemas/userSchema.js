"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.phoneLogin = exports.adminUserCreation = exports.userUpdateSchema = exports.userDtoSchema = exports.userCreateSchema = exports.userSchema = exports.permissionsSchema = exports.UserStatusEnum = exports.UserRoleEnum = void 0;
const zod_1 = require("zod");
exports.UserRoleEnum = zod_1.z.enum(["ACCOUNTS", "ADMIN", "OPERATIONS"]);
exports.UserStatusEnum = zod_1.z.enum(["Active", "Inactive"]);
// Define permissions schema
exports.permissionsSchema = zod_1.z.object({
    app: zod_1.z.array(zod_1.z.string()),
    web: zod_1.z.array(zod_1.z.string()),
});
exports.userSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z
        .string()
        .min(1, "Name is required")
        .max(255, "Name must be at most 255 characters"),
    email: zod_1.z
        .string()
        .email("Invalid email format")
        .max(255, "Email must be at most 255 characters")
        .nullable()
        .optional(),
    phone: zod_1.z
        .string()
        .min(10, "Phone number must be at least 10 digits")
        .max(15, "Phone number must be at most 15 digits")
        .optional(),
    // password: z
    //   .string()
    //   .min(6, 'Password must be at least 6 characters')
    //   .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    //   .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    //   .regex(/\d/, 'Password must contain at least one number')
    //   .regex(/[@$!%*?&.#,^\-]/, 'Password must contain at least one special character.')
    //   .max(255, 'Password must be at most 255 characters'),
    // site_ids: z.array(z.string().uuid()).optional(),
    status: exports.UserStatusEnum.default("Active"),
    web_access: zod_1.z.boolean().default(true),
    app_access: zod_1.z.boolean().default(true),
    permissions: exports.permissionsSchema.default({ app: [], web: [] }),
    role_id: zod_1.z.string().uuid(),
    created_at: zod_1.z.date().default(new Date()),
    updated_at: zod_1.z.date().default(new Date()),
});
// ✅ Schema for creating users (omit system fields and role if handled separately)
exports.userCreateSchema = exports.userSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
    status: true,
    role_id: true,
    // site_ids: true, // Uncomment if needed
});
// ✅ Output schema (e.g., for API responses)
exports.userDtoSchema = exports.userSchema.omit({
// password: true, // Uncomment if password is used later
// created_at: true,
// updated_at: true,
});
// ✅ Schema for updating users
exports.userUpdateSchema = exports.userSchema.pick({
    name: true,
    email: true,
    phone: true,
    // site_ids: true, // Uncomment if used
    role_id: true,
    web_access: true,
    app_access: true,
    permissions: true,
});
// ✅ Schema for admin-level user creation
exports.adminUserCreation = exports.userSchema.pick({
    name: true,
    // email: true,
    phone: true,
    // password: true,
    // site_ids: true,
    role_id: true,
    web_access: true,
    app_access: true,
    permissions: true,
});
// ✅ Login schema using only phone number
exports.phoneLogin = exports.userSchema.pick({ phone: true });
