import { z } from "zod";

export const UserRoleEnum = z.enum(["ACCOUNTS", "ADMIN", "OPERATIONS"]);
export const UserStatusEnum = z.enum(["Active", "Inactive"]);

// Define permissions schema
export const permissionsSchema = z.object({
  app: z.array(z.string()),
  web: z.array(z.string()),
});

export const userSchema = z.object({
  id: z.string().uuid(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be at most 255 characters"),
  email: z
    .string()
    .email("Invalid email format")
    .max(255, "Email must be at most 255 characters")
    .nullable()
    .optional(),
  phone: z
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
  status: UserStatusEnum.default("Active"),
  web_access: z.boolean().default(true),
  app_access: z.boolean().default(true),
  permissions: permissionsSchema.default({ app: [], web: [] }),
  role_id: z.string().uuid(),
  created_at: z.date().default(new Date()),
  updated_at: z.date().default(new Date()),
});

// ✅ Schema for creating users (omit system fields and role if handled separately)
export const userCreateSchema = userSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  status: true,
  role_id: true,
  // site_ids: true, // Uncomment if needed
});

// ✅ Output schema (e.g., for API responses)
export const userDtoSchema = userSchema.omit({
  // password: true, // Uncomment if password is used later
  // created_at: true,
  // updated_at: true,
});

// ✅ Schema for updating users
export const userUpdateSchema = userSchema.pick({
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
export const adminUserCreation = userSchema.pick({
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
export const phoneLogin = userSchema.pick({ phone: true });
