"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findRoleByName = findRoleByName;
exports.findRoleById = findRoleById;
exports.createRole = createRole;
exports.updateUserRole = updateUserRole;
exports.findRoleByNameRepo = findRoleByNameRepo;
exports.findUserByPhone = findUserByPhone;
// src/repositories/roleRepository.ts
const prismaClient_1 = __importDefault(require("../utils/prismaClient"));
const AppError_1 = require("../utils/AppError");
async function findRoleByName(roleName) {
    try {
        return await prismaClient_1.default.role.findFirst({
            where: { role_name: roleName.trim() }
        });
    }
    catch (err) {
        throw new AppError_1.AppError(500, 'ServerError', 'Error finding role by name', err);
    }
}
async function findRoleById(id) {
    try {
        return await prismaClient_1.default.role.findUnique({
            where: { id }
        });
    }
    catch (err) {
        throw new AppError_1.AppError(500, 'ServerError', 'Error finding role by ID', err);
    }
}
async function createRole(roleName, permissions) {
    try {
        return await prismaClient_1.default.role.create({
            data: {
                role_name: roleName.trim(),
                permissions
            },
        });
    }
    catch (err) {
        throw new AppError_1.AppError(500, 'ServerError', 'Error creating role', err);
    }
}
async function updateUserRole(role_id, roleName) {
    try {
        return await prismaClient_1.default.role.findFirst({
            where: { role_name: roleName },
        });
    }
    catch (err) {
        throw new AppError_1.AppError(500, 'ServerError', 'Error updating user role', err);
    }
}
async function findRoleByNameRepo(roleName) {
    try {
        return await prismaClient_1.default.role.findFirst({
            where: { role_name: roleName }
        });
    }
    catch (err) {
        throw new AppError_1.AppError(500, 'ServerError', 'Error finding role by name', err);
    }
}
async function findUserByPhone(phone) {
    try {
        return await prismaClient_1.default.user.findUnique({
            where: { phone },
            include: { role: true }, // Include role details
        });
    }
    catch (err) {
        throw new AppError_1.AppError(500, 'ServerError', 'Error finding user by phone', err);
    }
}
