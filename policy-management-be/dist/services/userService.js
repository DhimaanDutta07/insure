"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.validateUserToken = validateUserToken;
exports.createUser = createUser;
exports.getUsers = getUsers;
exports.updateUserService = updateUserService;
exports.deleteUserById = deleteUserById;
exports.updateUserStatusById = updateUserStatusById;
exports.sendOtpToUser = sendOtpToUser;
exports.verifyOtpService = verifyOtpService;
exports.updateUserAppAccessService = updateUserAppAccessService;
exports.updateUserWebAccessService = updateUserWebAccessService;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const AppError_1 = require("../utils/AppError");
const dotenv_1 = require("dotenv");
// Load environment variables
(0, dotenv_1.config)();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
}
const roleRepository_1 = require("../repositories/roleRepository");
const userRepository_1 = require("../repositories/userRepository");
const userSchema_1 = require("../schemas/userSchema");
const otpService_1 = require("./otpService");
async function registerUser(userData) {
    const { name, email, phone, permissions } = userData;
    // Check if user already exists by phone
    const existingUser = await (0, roleRepository_1.findUserByPhone)(phone);
    if (existingUser) {
        throw new AppError_1.AppError(400, "ClientError", "Phone number already exists");
    }
    // Create or find admin role
    let adminRole = await (0, roleRepository_1.findRoleByName)("ADMIN");
    if (!adminRole) {
        adminRole = await (0, roleRepository_1.createRole)("ADMIN", {});
    }
    // Create user with permissions
    const user = await (0, userRepository_1.createUserWithRole)({
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
async function loginUser(phone, password) {
    const user = await (0, userRepository_1.findUserWithRoleByPhone)(phone);
    if (!user ||
        !user.password ||
        !(await bcryptjs_1.default.compare(password, user.password)) ||
        user.status !== "Active") {
        return null;
    }
    if (user.web_access !== true) {
        throw new AppError_1.AppError(404, "ClientError", "User not allowed");
    }
    const { password: _, ...userWithoutPassword } = user;
    const expiresIn = "24h";
    const token = jsonwebtoken_1.default.sign({
        phone: user.phone,
        email: user.email,
        role: user.role ? user.role.role_name.trim() : null,
        permissions: user.permissions,
        user_id: user.id,
    }, JWT_SECRET, { expiresIn });
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    return {
        token,
        user: userWithoutPassword,
        role: user.role ? user.role.role_name : null,
        permissions: user.permissions,
        expiresAt,
    };
}
async function validateUserToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const userPhone = decoded.phone;
        const user = await (0, userRepository_1.findUserWithRoleByPhone)(userPhone);
        if (!user)
            return null;
        const role = user.role_id ? await (0, roleRepository_1.findRoleById)(user.role_id) : null;
        if (!role)
            return null;
        return { user, role };
    }
    catch (error) {
        return null;
    }
}
async function createUser(userData, roleName) {
    const { name, email, phone, permissions } = userData;
    // Check if user already exists by phone
    const existingUser = await (0, roleRepository_1.findUserByPhone)(phone);
    if (existingUser) {
        throw new AppError_1.AppError(400, "ClientError", "Phone number already exists");
    }
    // Create or find role
    let role = await (0, roleRepository_1.findRoleByName)(roleName);
    if (!role) {
        role = await (0, roleRepository_1.createRole)(roleName, {});
    }
    // Create user with permissions
    const user = await (0, userRepository_1.createUserWithRole)({
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
async function getUsers(limit, offset, withCount, orderBy) {
    const users = await (0, userRepository_1.getUsersWithPagination)(limit, offset, orderBy);
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
    const totalCount = withCount ? await (0, userRepository_1.countUsers)() : undefined;
    return {
        data: formattedUsers,
        totalCount,
    };
}
async function updateUserService(userId, updateData, roleName) {
    try {
        // If role name is provided, convert to role_id
        const userRole = await (0, userRepository_1.findUserById)(userId);
        if (!userRole) {
            throw new AppError_1.AppError(404, "ClientError", "User not found");
        }
        // Handle role update if roleName is provided
        if (roleName && roleName.trim() !== "") {
            let newRole = await (0, roleRepository_1.findRoleByName)(roleName);
            if (!newRole) {
                // Create the role if it doesn't exist
                newRole = await (0, roleRepository_1.createRole)(roleName, {});
            }
            updateData.role_id = newRole.id;
        }
        // Hash password if it's being updated
        if (updateData.password) {
            updateData.password = await bcryptjs_1.default.hash(updateData.password, 10);
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
        const updatedUser = await (0, userRepository_1.updateUserRepo)(userId, updateData);
        if (!updatedUser) {
            throw new AppError_1.AppError(404, "ClientError", "User not found");
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
    }
    catch (err) {
        if (err instanceof AppError_1.AppError)
            throw err;
        throw new AppError_1.AppError(500, "ServerError", "Failed to update user", err);
    }
}
// Helper function to create DTO
function getUserDto(user) {
    const { password, ...userDto } = user;
    // Ensure permissions is always valid
    if (!userDto.permissions || typeof userDto.permissions !== "object") {
        userDto.permissions = { app: [], web: [] }; // Default value
    }
    else {
        userDto.permissions = userSchema_1.permissionsSchema.parse(userDto.permissions);
    }
    return userDto;
}
async function deleteUserById(userId) {
    await (0, userRepository_1.deleteUser)(userId);
}
async function updateUserStatusById(id, updateData) {
    // Changed return type to userDtoSchema
    const existingUser = await (0, userRepository_1.findUserById)(id);
    if (!existingUser) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
    }
    const updatedUser = await (0, userRepository_1.updateUserRepo)(id, updateData);
    if (!updatedUser) {
        throw new AppError_1.AppError(404, "ClientError", "User not found");
    }
    return getUserDto(updatedUser);
}
async function sendOtpToUser(phone) {
    const user = await (0, roleRepository_1.findUserByPhone)(phone);
    if (!user || user.status !== "Active") {
        throw new AppError_1.AppError(404, "ClientError", `Phone number ${phone} not registered`);
    }
    // if(user.app_access !== true || user.web_access !== true){
    //   throw new AppError(404, 'ClientError', 'User not allowed');
    // }
    const otp = await (0, otpService_1.generateAndSendOTP)(phone);
    return {
        message: "OTP sent successfully",
    };
}
async function verifyOtpService(phone, otp) {
    const user = await (0, roleRepository_1.findUserByPhone)(phone);
    if (!user) {
        throw new AppError_1.AppError(404, "ClientError", "Phone number not registered");
    }
    try {
        await (0, otpService_1.verifyOTP)(phone, otp);
    }
    catch (error) {
        // The verifyOTP function throws errors for invalid/expired OTP
        if (error instanceof Error) {
            throw new AppError_1.AppError(400, "ClientError", error.message);
        }
        throw new AppError_1.AppError(400, "ClientError", "Invalid or expired OTP");
    }
    const expiresIn = '24h';
    const token = jsonwebtoken_1.default.sign({
        email: user.email,
        phone: user.phone,
        role: user.role ? user.role.role_name.trim() : null,
        permissions: user.permissions,
        user_id: user.id,
    }, JWT_SECRET, { expiresIn });
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
async function updateUserAppAccessService(userId, appAccess) {
    try {
        // Check if user exists
        const existingUser = await (0, userRepository_1.findUserById)(userId);
        if (!existingUser) {
            throw new AppError_1.AppError(404, "ClientError", "User not found");
        }
        // Update the app access
        const updatedUser = await (0, userRepository_1.updateUserRepo)(userId, { app_access: appAccess });
        if (!updatedUser) {
            throw new AppError_1.AppError(404, "ClientError", "User not found");
        }
        // Return user DTO
        return getUserDto(updatedUser);
    }
    catch (err) {
        if (err instanceof AppError_1.AppError)
            throw err;
        throw new AppError_1.AppError(500, "ServerError", "Failed to update user app access", err);
    }
}
async function updateUserWebAccessService(userId, webAccess) {
    try {
        // Check if user exists
        const existingUser = await (0, userRepository_1.findUserById)(userId);
        if (!existingUser) {
            throw new AppError_1.AppError(404, "ClientError", "User not found");
        }
        // Update the web access
        const updatedUser = await (0, userRepository_1.updateUserRepo)(userId, { web_access: webAccess });
        if (!updatedUser) {
            throw new AppError_1.AppError(404, "ClientError", "User not found");
        }
        // Return user DTO
        return getUserDto(updatedUser);
    }
    catch (err) {
        if (err instanceof AppError_1.AppError)
            throw err;
        throw new AppError_1.AppError(500, "ServerError", "Failed to update user web access", err);
    }
}
