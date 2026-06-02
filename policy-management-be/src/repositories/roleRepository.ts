// src/repositories/roleRepository.ts
import prisma from '../utils/prismaClient';
import { AppError } from '../utils/AppError';

export async function findRoleByName(roleName: string) {
  try {
    return await prisma.role.findFirst({
      where: { role_name: roleName.trim() }
    });
  } catch (err) {
    throw new AppError(500, 'ServerError', 'Error finding role by name', err);
  }
}

export async function findRoleById(id: string) {
  try {
    return await prisma.role.findUnique({
      where: { id }
    });
  } catch (err) {
    throw new AppError(500, 'ServerError', 'Error finding role by ID', err);
  }
}

export async function createRole(roleName: string, permissions: any) {
  try {
    return await prisma.role.create({
      data: { 
        role_name: roleName.trim(), 
        permissions 
      },
    });
  } catch (err) {
    throw new AppError(500, 'ServerError', 'Error creating role', err);
  }
}

export async function updateUserRole(role_id: string, roleName: string) {
  try {
    return await prisma.role.findFirst({
      where: { role_name: roleName },
    });
  } catch (err) {
    throw new AppError(500, 'ServerError', 'Error updating user role', err);
  }
}

export async function findRoleByNameRepo(roleName: string) {
  try {
    return await prisma.role.findFirst({
      where: { role_name: roleName }
    });
  } catch (err) {
    throw new AppError(500, 'ServerError', 'Error finding role by name', err);
  }
}

export async function findUserByPhone(phone: string) {
  try {
    return await prisma.user.findUnique({
      where: { phone },
      include: { role: true }, // Include role details
    });
  } catch (err) {
    throw new AppError(500, 'ServerError', 'Error finding user by phone', err);
  }
}