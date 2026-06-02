import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError";
import { config } from "dotenv";

// Load environment variables
config();

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

import {
  findRoleByName,
  createRole,
  findRoleById,
  findRoleByNameRepo,
  updateUserRole,
  findUserByPhone,
} from "../repositories/roleRepository";
import {
  countUsers,
  createUserWithRole,
  deleteUser,
  findUserById,
  findUserWithRoleByPhone,
  getUsersWithPagination,
  updateUserRepo,
} from "../repositories/userRepository";
import {
  permissionsSchema,
  userDtoSchema,
  userSchema,
  userUpdateSchema,
} from "../schemas/userSchema";
import { z } from "zod";
import { generateAndSendOTP, verifyOTP } from "./otpService";
import prisma from "../utils/prismaClient";

export async function registerUser(userData: any) {
  const { name, email, phone, permissions } = userData;

  // Check if user already exists by phone
  const existingUser = await findUserByPhone(phone);
  if (existingUser) {
    throw new AppError(400, "ClientError", "Phone number already exists");
  }

  // Create or find admin role
  let adminRole = await findRoleByName("ADMIN");
  if (!adminRole) {
    adminRole = await createRole("ADMIN", {});
  }

  // Create user with permissions
  const user = await createUserWithRole({
    name,
    email: email || null,
    phone: phone,
    permissions: {
      app: [],
      web: [
        "Master",
        "Users_Panel",
        "All_Enquiry",
        "All_Policy",
        "Dashboard",
        // "Items",
        // "Site",
        "Revenues",
        // "Reimbursement",
        "Clients",
        "Agent",
        "Commission",
        "PolicyType",
        "PolicyGroup",
        "PolicyName",
        "Company",
        "CompanyFormField",
      ],
    }, // Set default permissions if not provided
    role_id: adminRole.id,
  });

  return user;
}

export async function loginUser(phone: string, password: string) {
  const user = await findUserWithRoleByPhone(phone);

  if (
    !user ||
    !user.password ||
    !(await bcrypt.compare(password, user.password)) ||
    user.status !== "Active"
  ) {
    return null;
  }

  if (user.web_access !== true) {
    throw new AppError(404, "ClientError", "User not allowed");
  }

  const { password: _, ...userWithoutPassword } = user;

  const expiresIn = "24h";
  const token = jwt.sign(
    {
      phone: user.phone,
      email: user.email,
      role: user.role ? user.role.role_name.trim() : null,
      permissions: user.permissions,
      user_id: user.id,
    },
    JWT_SECRET,
    { expiresIn }
  );

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  return {
    token,
    user: userWithoutPassword,
    role: user.role ? user.role.role_name : null,
    permissions: user.permissions,
    expiresAt,
  };
}

export async function validateUserToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { phone: string };
    const userPhone = decoded.phone;

    const user = await findUserWithRoleByPhone(userPhone);

    if (!user) return null;

    const role = user.role_id ? await findRoleById(user.role_id) : null;
    if (!role) return null;

    return { user, role };
  } catch (error) {
    return null;
  }
}

export async function createUser(userData: any, roleName: string) {
  const { name, email, phone, permissions } = userData;

  // Check if user already exists by phone
  const existingUser = await findUserByPhone(phone);
  if (existingUser) {
    throw new AppError(400, "ClientError", "Phone number already exists");
  }

  // Create or find role
  let role = await findRoleByName(roleName);
  if (!role) {
    role = await createRole(roleName, {});
  }

  // Create user with permissions
  const user = await createUserWithRole({
    name,
    email: email || null,
    phone,
    permissions: permissions || { app: [], web: [] }, // Set default permissions if not provided
    role_id: role ? role.id : null,
  });

  // Create UserSite entries for each site
  // if (site_ids && Array.isArray(site_ids)) {
  //   await Promise.all(
  //     site_ids.map(async (site_id: string) => {
  //       await prisma.userSite.create({
  //         data: {
  //           user_id: user.id,
  //           site_id: site_id,
  //         },
  //       });
  //     })
  //   );
  // }

  // Fetch the user with sites
  // const userWithSites = await prisma.user.findUnique({
  //   where: { id: user.id },
  //   include: {
  //     sites: {
  //       include: {
  //         site: true,
  //       },
  //     },
  //   },
  // });

  return user;
}

export async function getUsers(
  limit: number,
  offset: number,
  withCount: boolean,
  orderBy: any
) {
  const users = await getUsersWithPagination(limit, offset, orderBy);

  // Transform the response
  const formattedUsers = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    status: user.status,
    created_at: user.created_at,
    updated_at: user.updated_at,
    app_access: user.app_access,
    web_access: user.web_access,
    permissions: user.permissions,
    role: user.role ? user.role.role_name : null,
    // sites: user.sites.map((us) => us.site), // Transform sites array
  }));

  // Get total count if requested
  const totalCount = withCount ? await countUsers() : undefined;

  return {
    data: formattedUsers,
    totalCount,
  };
}

export async function updateUserService(
  userId: string,
  updateData: Partial<z.infer<typeof userUpdateSchema>> & {
    password?: string;
    // site_ids?: string[];
  },
  roleName: string
): Promise<z.infer<typeof userDtoSchema>> {
  try {
    // If role name is provided, convert to role_id
    const userRole = await findUserById(userId);

    if (!userRole) {
      throw new AppError(404, "ClientError", "User not found");
    }

    // Handle role update if roleName is provided
    if (roleName && roleName.trim() !== "") {
      let newRole = await findRoleByName(roleName);
      if (!newRole) {
        // Create the role if it doesn't exist
        newRole = await createRole(roleName, {});
      }
      updateData.role_id = newRole.id;
    }

    // Hash password if it's being updated
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    // Handle site updates if site_ids are provided
    // if (updateData.site_ids) {
    //   // Delete existing UserSite entries
    //   await prisma.userSite.deleteMany({
    //     where: { user_id: userId },
    //   });

    //   // Create new UserSite entries
    //   await Promise.all(
    //     updateData.site_ids.map(async (site_id: string) => {
    //       await prisma.userSite.create({
    //         data: {
    //           user_id: userId,
    //           site_id: site_id,
    //         },
    //       });
    //     })
    //   );

    //   // Remove site_ids from updateData as it's handled separately
    //   delete updateData.site_ids;
    // }

    // Update user in repository (now includes permissions in updateData)
    const updatedUser = await updateUserRepo(userId, updateData);

    if (!updatedUser) {
      throw new AppError(404, "ClientError", "User not found");
    }

    // Fetch the user with sites
    // const userWithSites = await prisma.user.findUnique({
    //   where: { id: userId },
    //   include: {
    //     sites: {
    //       include: {
    //         site: true,
    //       },
    //     },
    //   },
    // });

    // Return user DTO (without password)
    return getUserDto(updatedUser);
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(500, "ServerError", "Failed to update user", err);
  }
}

// Helper function to create DTO
function getUserDto(user: any): z.infer<typeof userDtoSchema> {
  const { password, ...userDto } = user;

  // Ensure permissions is always valid
  if (!userDto.permissions || typeof userDto.permissions !== "object") {
    userDto.permissions = { app: [], web: [] }; // Default value
  } else {
    userDto.permissions = permissionsSchema.parse(userDto.permissions);
  }

  return userDto;
}

export async function deleteUserById(userId: string) {
  await deleteUser(userId);
}

export async function updateUserStatusById(
  id: string,
  updateData: Partial<z.infer<typeof userSchema>>
): Promise<z.infer<typeof userDtoSchema>> {
  // Changed return type to userDtoSchema
  const existingUser = await findUserById(id);
  if (!existingUser) {
    const error: any = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const updatedUser = await updateUserRepo(id, updateData);
  if (!updatedUser) {
    throw new AppError(404, "ClientError", "User not found");
  }

  return getUserDto(updatedUser);
}

export async function sendOtpToUser(phone: string) {
  const user = await findUserByPhone(phone);

  if (!user || user.status !== "Active") {
    throw new AppError(
      404,
      "ClientError",
      `Phone number ${phone} not registered`
    );
  }

  // if(user.app_access !== true || user.web_access !== true){
  //   throw new AppError(404, 'ClientError', 'User not allowed');
  // }

  const otp = await generateAndSendOTP(phone);

  return {
    message: "OTP sent successfully",
  };
}

export async function verifyOtpService(phone: string, otp: string) {
  const user = await findUserByPhone(phone);

  if (!user) {
    throw new AppError(404, "ClientError", "Phone number not registered");
  }

  try {
    await verifyOTP(phone, otp);
  } catch (error) {
    // The verifyOTP function throws errors for invalid/expired OTP
    if (error instanceof Error) {
      throw new AppError(400, "ClientError", error.message);
    }
    throw new AppError(400, "ClientError", "Invalid or expired OTP");
  }

  const expiresIn = '24h';
  const token = jwt.sign(
    {
      email: user.email,
      phone: user.phone,
      role: user.role ? user.role.role_name.trim() : null,
      permissions: user.permissions,
      user_id: user.id,
    },
    JWT_SECRET,
    { expiresIn }
  );

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  return {
    message: "OTP verified successfully",
    token: token,
    expiresAt,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role ? user.role.role_name : null,
      status: user.status,
      permissions: user.permissions, // Include user permissions from user table
    },
    role: user.role
  };
}

export async function updateUserAppAccessService(
  userId: string,
  appAccess: boolean
): Promise<z.infer<typeof userDtoSchema>> {
  try {
    // Check if user exists
    const existingUser = await findUserById(userId);
    if (!existingUser) {
      throw new AppError(404, "ClientError", "User not found");
    }

    // Update the app access
    const updatedUser = await updateUserRepo(userId, { app_access: appAccess });

    if (!updatedUser) {
      throw new AppError(404, "ClientError", "User not found");
    }

    // Return user DTO
    return getUserDto(updatedUser);
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      500,
      "ServerError",
      "Failed to update user app access",
      err
    );
  }
}

export async function updateUserWebAccessService(
  userId: string,
  webAccess: boolean
): Promise<z.infer<typeof userDtoSchema>> {
  try {
    // Check if user exists
    const existingUser = await findUserById(userId);
    if (!existingUser) {
      throw new AppError(404, "ClientError", "User not found");
    }

    // Update the web access
    const updatedUser = await updateUserRepo(userId, { web_access: webAccess });

    if (!updatedUser) {
      throw new AppError(404, "ClientError", "User not found");
    }

    // Return user DTO
    return getUserDto(updatedUser);
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      500,
      "ServerError",
      "Failed to update user web access",
      err
    );
  }
}
