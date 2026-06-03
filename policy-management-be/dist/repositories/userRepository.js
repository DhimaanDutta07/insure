"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserByPhone = findUserByPhone;
exports.findUserWithRoleByPhone = findUserWithRoleByPhone;
exports.findUserWithRoleByEmail = findUserWithRoleByEmail;
exports.createUserWithRole = createUserWithRole;
exports.getUsersWithPagination = getUsersWithPagination;
exports.countUsers = countUsers;
exports.findUserById = findUserById;
exports.deleteUser = deleteUser;
exports.updateUserRepo = updateUserRepo;
exports.getUserWithAccountRole = getUserWithAccountRole;
const prismaClient_1 = __importDefault(require("../utils/prismaClient"));
const AppError_1 = require("../utils/AppError");
// export async function findUserByEmail(email: string, select = {}) {
//   try {
//     return await prisma.user.findUnique({
//       where: { email },
//       select: Object.keys(select).length > 0 ? select : undefined
//     });
//   } catch (err) {
//     throw new AppError(500, 'ServerError', 'Error finding user by email', err);
//   }
// }
async function findUserByPhone(phone) {
    try {
        return await prismaClient_1.default.user.findUnique({
            where: { phone },
            include: {
                role: {
                    select: {
                        role_name: true,
                        permissions: true,
                    },
                },
            },
        });
    }
    catch (err) {
        throw new AppError_1.AppError(500, 'ServerError', 'Error finding user by phone Number', err);
    }
}
async function findUserWithRoleByPhone(phone) {
    try {
        return await prismaClient_1.default.user.findUnique({
            where: { phone },
            include: {
                role: {
                    select: {
                        role_name: true,
                        permissions: true,
                    },
                },
            },
        });
    }
    catch (err) {
        throw new AppError_1.AppError(500, 'ServerError', 'Error finding user with role by phone', err);
    }
}
async function findUserWithRoleByEmail(email) {
    try {
        return await prismaClient_1.default.user.findUnique({
            where: { email },
            include: {
                role: {
                    select: {
                        role_name: true,
                        permissions: true,
                    },
                },
            },
        });
    }
    catch (err) {
        throw new AppError_1.AppError(500, 'ServerError', 'Error finding user with role by email', err);
    }
}
async function createUserWithRole(userData) {
    try {
        return await prismaClient_1.default.user.create({
            data: userData
        });
    }
    catch (err) {
        if (err.code === 'P2002') {
            // Check which unique constraint failed
            const target = err.meta?.target;
            if (target === 'users_email_key') {
                throw new AppError_1.AppError(400, 'ClientError', 'Email already exists', err);
            }
            if (target === 'users_phone_key') {
                throw new AppError_1.AppError(400, 'ClientError', 'Phone number already exists', err);
            }
            throw new AppError_1.AppError(400, 'ClientError', 'A record with this data already exists', err);
        }
        throw new AppError_1.AppError(500, 'ServerError', 'Error creating user with role', err);
    }
}
async function getUsersWithPagination(limit, offset, orderBy) {
    try {
        return await prismaClient_1.default.user.findMany({
            where: {
                is_deleted: false
            },
            take: limit,
            skip: offset,
            orderBy,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                status: true,
                created_at: true,
                updated_at: true,
                web_access: true,
                app_access: true,
                permissions: true,
                role: { select: { role_name: true } },
                // sites: {
                //   select: {
                //     site: {
                //       select: {
                //         id: true,
                //         name: true,
                //         description: true,
                //       }
                //     }
                //   }
                // }
            },
        });
    }
    catch (err) {
        throw new AppError_1.AppError(500, 'ServerError', 'Error getting users with pagination', err);
    }
}
async function countUsers() {
    try {
        return await prismaClient_1.default.user.count();
    }
    catch (err) {
        throw new AppError_1.AppError(500, 'ServerError', 'Error counting users', err);
    }
}
async function findUserById(id) {
    try {
        return await prismaClient_1.default.user.findUnique({
            where: { id },
            include: {
                role: {
                    select: {
                        id: true,
                        role_name: true,
                    },
                },
            },
        });
    }
    catch (err) {
        throw new AppError_1.AppError(500, 'ServerError', 'Error finding user by ID', err);
    }
}
async function deleteUser(id) {
    try {
        return await prismaClient_1.default.user.update({
            where: { id },
            data: {
                is_deleted: true
            }
        });
    }
    catch (err) {
        if (err.code === 'P2025') {
            throw new AppError_1.AppError(404, 'ClientError', 'User not found', err);
        }
        throw new AppError_1.AppError(500, 'ServerError', 'Error deleting user', err);
    }
}
async function updateUserRepo(userId, updateData) {
    try {
        return await prismaClient_1.default.user.update({
            where: { id: userId },
            data: {
                ...updateData,
                updated_at: new Date() // Ensure updated_at is set
            },
            include: {
                role: {
                    select: {
                        role_name: true
                    }
                }
            }
        });
    }
    catch (err) {
        if (err.code === 'P2025') {
            return null; // User not found
        }
        if (err.code === 'P2002') {
            // Check which unique constraint failed
            const target = err.meta?.target;
            if (target === 'users_email_key') {
                throw new AppError_1.AppError(400, 'ClientError', 'Email already exists', err);
            }
            if (target === 'users_phone_key') {
                throw new AppError_1.AppError(400, 'ClientError', 'Phone number already exists', err);
            }
            throw new AppError_1.AppError(400, 'ClientError', 'A record with this data already exists', err);
        }
        throw new AppError_1.AppError(500, 'ServerError', 'Error updating user', err);
    }
}
async function getUserWithAccountRole() {
    try {
        return await prismaClient_1.default.user.findFirst({
            where: {
                id: "89c3e26d-1256-46c5-a64b-742a037016fa",
            },
        });
    }
    catch (err) {
        if (err.code === "P2025") {
            return null; // User not found
        }
        throw new AppError_1.AppError(500, "ServerError", "Error fetching user", err);
    }
}
