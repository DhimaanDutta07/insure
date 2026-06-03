"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserWebAccess = exports.updateUserAppAccess = exports.verifyUserOTP = exports.sendUserOTP = exports.updateUserStatus = exports.deleteUser = exports.updateUser = exports.getAllUsers = exports.createUserByAdmin = exports.validateUser = exports.login = exports.register = void 0;
const userService_1 = require("../services/userService");
const userSchema_1 = require("../schemas/userSchema");
const userQuerySchema_1 = require("../schemas/userQuerySchema");
const errorHandler_1 = require("../utils/errorHandler");
const zod_1 = require("zod");
// Login credentials validation schema
const loginSchema = zod_1.z.object({
    phone: zod_1.z.string().length(10, "Phone number must be exactly 10 digits"),
    password: zod_1.z.string().min(1, "Password is required"),
});
// App access validation schema
const appAccessSchema = zod_1.z.object({ app_access: zod_1.z.boolean() });
// Web access validation schema
const webAccessSchema = zod_1.z.object({ web_access: zod_1.z.boolean() });
exports.register = (0, errorHandler_1.asyncTryCatch)(async (req, res) => {
    // Accept both phone and phoneNumber for compatibility
    const { name, email, phone, phoneNumber, permissions } = req.body;
    const phoneValue = phone || phoneNumber;
    // Set default permissions if not provided
    const validatedPermissions = permissions
        ? userSchema_1.permissionsSchema.parse(permissions)
        : { app: [], web: [] };
    const userRegisterData = {
        name,
        email: email || null,
        phone: phoneValue,
        permissions: validatedPermissions,
    };
    const userData = userSchema_1.userCreateSchema.parse(userRegisterData);
    const result = await (0, userService_1.registerUser)(userData);
    res.status(201).json({
        message: "User registered successfully",
        user: result,
    });
});
exports.login = (0, errorHandler_1.asyncTryCatch)(async (req, res) => {
    const credentials = loginSchema.parse(req.body);
    const result = await (0, userService_1.loginUser)(credentials.phone, credentials.password);
    if (!result) {
        return res.status(400).json({ message: "Invalid credentials" });
    }
    res.json(result);
});
exports.validateUser = (0, errorHandler_1.asyncTryCatch)(async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    // Validate token format
    if (!token || typeof token !== "string") {
        return res.status(401).json({ message: "Invalid token format" });
    }
    const result = await (0, userService_1.validateUserToken)(token);
    if (!result) {
        return res.status(401).json({ message: "Invalid token" });
    }
    res.status(200).json({
        user: result.user,
        role: result.role,
        permissions: result.user.permissions,
        message: "Token is valid",
    });
});
exports.createUserByAdmin = (0, errorHandler_1.asyncTryCatch)(async (req, res) => {
    // Validate user data (including permissions)
    const validatedData = userSchema_1.userCreateSchema.parse(req.body);
    // Validate role separately
    const validatedRole = userSchema_1.UserRoleEnum.parse(req.body.role);
    // Validate permissions separately if provided
    const permissions = req.body.permissions
        ? userSchema_1.permissionsSchema.parse(req.body.permissions)
        : { app: [], web: [] };
    const result = await (0, userService_1.createUser)({ ...validatedData, permissions }, validatedRole);
    res.status(201).json({
        message: "User created successfully",
        user: result,
    });
});
// Query parameters validation schema
const orderBySchema = zod_1.z.record(zod_1.z.enum(["asc", "desc"]));
exports.getAllUsers = (0, errorHandler_1.asyncTryCatch)(async (req, res) => {
    const queryParams = userQuerySchema_1.userQuerySchema.parse(req.query);
    // Validate orderBy JSON structure
    const orderBy = orderBySchema.parse(typeof queryParams.orderBy === "string"
        ? JSON.parse(queryParams.orderBy)
        : queryParams.orderBy);
    const result = await (0, userService_1.getUsers)(parseInt(queryParams.limit), parseInt(queryParams.offset), queryParams.withCount === "true", orderBy);
    res.status(200).json(result);
});
exports.updateUser = (0, errorHandler_1.asyncTryCatch)(async (req, res) => {
    // Validate UUID format
    const userId = zod_1.z.string().uuid().parse(req.params.id);
    // Validate permissions if provided
    if (req.body.permissions) {
        req.body.permissions = userSchema_1.permissionsSchema.parse(req.body.permissions);
    }
    // Transform the request body to match expected format
    const updateData = {
        ...req.body,
        // Handle site_ids if provided
        // ...(req.body.site_ids && { site_ids: req.body.site_ids }),
        // Remove any old site property if it exists
        site: undefined,
    };
    const validatedData = userSchema_1.userUpdateSchema.partial().parse(updateData);
    // Validate role if provided
    let validatedRole;
    if (req.body.role) {
        validatedRole = userSchema_1.UserRoleEnum.parse(req.body.role);
    }
    const updatedUser = await (0, userService_1.updateUserService)(userId, validatedData, validatedRole || "");
    res.status(200).json({
        message: "User updated successfully",
        user: updatedUser,
    });
});
exports.deleteUser = (0, errorHandler_1.asyncTryCatch)(async (req, res) => {
    // Validate UUID format
    const userId = zod_1.z.string().uuid().parse(req.params.id);
    await (0, userService_1.deleteUserById)(userId);
    res.status(204).end();
});
exports.updateUserStatus = (0, errorHandler_1.asyncTryCatch)(async (req, res) => {
    // Validate UUID format
    const userId = zod_1.z.string().uuid().parse(req.params.id);
    // Validate status
    const status = zod_1.z
        .object({
        status: userSchema_1.UserStatusEnum,
    })
        .parse(req.body);
    const updatedUser = await (0, userService_1.updateUserStatusById)(userId, status);
    res.status(200).json({
        status: "success",
        message: "User status updated successfully",
        data: {
            id: updatedUser.id,
            name: updatedUser.name,
            status: updatedUser.status,
        },
    });
});
exports.sendUserOTP = (0, errorHandler_1.asyncTryCatch)(async (req, res) => {
    const { phone } = req.body;
    const response = await (0, userService_1.sendOtpToUser)(phone);
    res.status(200).json(response);
});
exports.verifyUserOTP = (0, errorHandler_1.asyncTryCatch)(async (req, res) => {
    const { phone, otp } = req.body;
    console.log(phone, otp);
    const response = await (0, userService_1.verifyOtpService)(phone, otp);
    res.status(200).json(response);
});
exports.updateUserAppAccess = (0, errorHandler_1.asyncTryCatch)(async (req, res) => {
    // Validate UUID format
    const userId = zod_1.z.string().uuid().parse(req.params.id);
    // Validate app access data
    const { app_access } = appAccessSchema.parse(req.body);
    const updatedUser = await (0, userService_1.updateUserAppAccessService)(userId, app_access);
    res.status(200).json({
        status: "success",
        message: "User app access updated successfully",
        data: {
            id: updatedUser.id,
            name: updatedUser.name,
            app_access: updatedUser.app_access,
        },
    });
});
exports.updateUserWebAccess = (0, errorHandler_1.asyncTryCatch)(async (req, res) => {
    // Validate UUID format
    const userId = zod_1.z.string().uuid().parse(req.params.id);
    // Validate web access data
    const { web_access } = webAccessSchema.parse(req.body);
    const updatedUser = await (0, userService_1.updateUserWebAccessService)(userId, web_access);
    res.status(200).json({
        status: "success",
        message: "User web access updated successfully",
        data: {
            id: updatedUser.id,
            name: updatedUser.name,
            web_access: updatedUser.web_access,
        },
    });
});
