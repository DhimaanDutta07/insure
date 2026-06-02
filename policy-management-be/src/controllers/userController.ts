import { Request, Response, NextFunction } from "express";
import {
  registerUser,
  loginUser,
  validateUserToken,
  createUser,
  getUsers,
  updateUserService,
  deleteUserById,
  updateUserStatusById,
  sendOtpToUser,
  verifyOtpService,
  updateUserAppAccessService,
  updateUserWebAccessService,
} from "../services/userService";
import {
  userCreateSchema,
  userSchema,
  UserStatusEnum,
  userUpdateSchema,
  UserRoleEnum,
  phoneLogin,
  permissionsSchema,
} from "../schemas/userSchema";
import { userQuerySchema } from "../schemas/userQuerySchema";
import { asyncTryCatch } from "../utils/errorHandler";
import { z } from "zod";

// Login credentials validation schema
const loginSchema = z.object({
  phone: z.string().length(10, "Phone number must be exactly 10 digits"),
  password: z.string().min(1, "Password is required"),
});

// App access validation schema
const appAccessSchema = z.object({ app_access: z.boolean() });

// Web access validation schema
const webAccessSchema = z.object({ web_access: z.boolean() });

export const register = asyncTryCatch(async (req: Request, res: Response) => {
  // Accept both phone and phoneNumber for compatibility
  const { name, email, phone, phoneNumber, permissions } = req.body;
  const phoneValue = phone || phoneNumber;

  // Set default permissions if not provided
  const validatedPermissions = permissions
    ? permissionsSchema.parse(permissions)
    : { app: [], web: [] };

  const userRegisterData = {
    name,
    email: email || null,
    phone: phoneValue,
    permissions: validatedPermissions,
  };
  const userData = userCreateSchema.parse(userRegisterData);

  const result = await registerUser(userData);
  res.status(201).json({
    message: "User registered successfully",
    user: result,
  });
});

export const login = asyncTryCatch(async (req: Request, res: Response) => {
  const credentials = loginSchema.parse(req.body);
  const result = await loginUser(credentials.phone, credentials.password);

  if (!result) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  res.json(result);
});

export const validateUser = asyncTryCatch(
  async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Validate token format
    if (!token || typeof token !== "string") {
      return res.status(401).json({ message: "Invalid token format" });
    }

    const result = await validateUserToken(token);

    if (!result) {
      return res.status(401).json({ message: "Invalid token" });
    }

    res.status(200).json({
      user: result.user,
      role: result.role,
      permissions: result.user.permissions,
      message: "Token is valid",
    });
  }
);

export const createUserByAdmin = asyncTryCatch(
  async (req: Request, res: Response) => {
    // Validate user data (including permissions)
    const validatedData = userCreateSchema.parse(req.body);

    // Validate role separately
    const validatedRole = UserRoleEnum.parse(req.body.role);

    // Validate permissions separately if provided
    const permissions = req.body.permissions
      ? permissionsSchema.parse(req.body.permissions)
      : { app: [], web: [] };

    const result = await createUser(
      { ...validatedData, permissions },
      validatedRole
    );

    res.status(201).json({
      message: "User created successfully",
      user: result,
    });
  }
);

// Query parameters validation schema
const orderBySchema = z.record(z.enum(["asc", "desc"]));

export const getAllUsers = asyncTryCatch(
  async (req: Request, res: Response) => {
    const queryParams = userQuerySchema.parse(req.query);

    // Validate orderBy JSON structure
    const orderBy = orderBySchema.parse(
      typeof queryParams.orderBy === "string"
        ? JSON.parse(queryParams.orderBy)
        : queryParams.orderBy
    );

    const result = await getUsers(
      parseInt(queryParams.limit),
      parseInt(queryParams.offset),
      queryParams.withCount === "true",
      orderBy
    );

    res.status(200).json(result);
  }
);

export const updateUser = asyncTryCatch(async (req: Request, res: Response) => {
  // Validate UUID format
  const userId = z.string().uuid().parse(req.params.id as string);

  // Validate permissions if provided
  if (req.body.permissions) {
    req.body.permissions = permissionsSchema.parse(req.body.permissions);
  }

  // Transform the request body to match expected format
  const updateData = {
    ...req.body,
    // Handle site_ids if provided
    // ...(req.body.site_ids && { site_ids: req.body.site_ids }),
    // Remove any old site property if it exists
    site: undefined,
  };

  const validatedData = userUpdateSchema.partial().parse(updateData);

  // Validate role if provided
  let validatedRole: string | undefined;
  if (req.body.role) {
    validatedRole = UserRoleEnum.parse(req.body.role);
  }

  const updatedUser = await updateUserService(
    userId,
    validatedData,
    validatedRole || ""
  );

  res.status(200).json({
    message: "User updated successfully",
    user: updatedUser,
  });
});

export const deleteUser = asyncTryCatch(async (req: Request, res: Response) => {
  // Validate UUID format
  const userId = z.string().uuid().parse(req.params.id as string);

  await deleteUserById(userId);

  res.status(204).end();
});

export const updateUserStatus = asyncTryCatch(
  async (req: Request, res: Response) => {
    // Validate UUID format
    const userId = z.string().uuid().parse(req.params.id as string);

    // Validate status
    const status = z
      .object({
        status: UserStatusEnum,
      })
      .parse(req.body);

    const updatedUser = await updateUserStatusById(userId, status);

    res.status(200).json({
      status: "success",
      message: "User status updated successfully",
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        status: updatedUser.status,
      },
    });
  }
);

export const sendUserOTP = asyncTryCatch(async (req: Request, res: Response) => {
  const { phone } = req.body;
  const response = await sendOtpToUser(phone);
  res.status(200).json(response);
});

export const verifyUserOTP = asyncTryCatch(async (req: Request, res: Response) => {
  const { phone, otp } = req.body;
  console.log(phone, otp);
  const response = await verifyOtpService(phone, otp);
  res.status(200).json(response);
});

export const updateUserAppAccess = asyncTryCatch(
  async (req: Request, res: Response) => {
    // Validate UUID format
    const userId = z.string().uuid().parse(req.params.id as string);

    // Validate app access data
    const { app_access } = appAccessSchema.parse(req.body);

    const updatedUser = await updateUserAppAccessService(userId, app_access);

    res.status(200).json({
      status: "success",
      message: "User app access updated successfully",
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        app_access: updatedUser.app_access,
      },
    });
  }
);

export const updateUserWebAccess = asyncTryCatch(
  async (req: Request, res: Response) => {
    // Validate UUID format
    const userId = z.string().uuid().parse(req.params.id as string);

    // Validate web access data
    const { web_access } = webAccessSchema.parse(req.body);

    const updatedUser = await updateUserWebAccessService(userId, web_access);

    res.status(200).json({
      status: "success",
      message: "User web access updated successfully",
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        web_access: updatedUser.web_access,
      },
    });
  }
);
