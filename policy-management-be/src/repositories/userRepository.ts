import { z } from 'zod';
import { userSchema } from '../schemas/userSchema';
import prisma from '../utils/prismaClient';
import { AppError } from '../utils/AppError';
import { User, Role } from '@prisma/client';

export type UserWithRole = User & {
  role: {
    role_name: string;
    permissions: any;
  } | null;
};

export type UserWithSitesAndRole = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  status: User['status'];
  created_at: Date;
  updated_at: Date;
  web_access: boolean;
  app_access: boolean;
  permissions: any;
  role: { role_name: string } | null;
  // sites: {
  //   site: {
  //     id: string;
  //     name: string;
  //     description: string | null;
  //   };
  // }[];
};

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
export async function findUserByPhone(phone: string) {
  try {
    return await prisma.user.findUnique({
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
  } catch (err) {
    throw new AppError(500, 'ServerError', 'Error finding user by phone Number', err);
  }
}

export async function findUserWithRoleByPhone(phone: string): Promise<UserWithRole | null> {
  try {
    return await prisma.user.findUnique({
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
  } catch (err) {
    throw new AppError(500, 'ServerError', 'Error finding user with role by phone', err);
  }
}

export async function findUserWithRoleByEmail(email: string): Promise<UserWithRole | null> {
  try {
    return await prisma.user.findUnique({
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
  } catch (err) {
    throw new AppError(500, 'ServerError', 'Error finding user with role by email', err);
  }
}

export async function createUserWithRole(userData: any) {
  try {
    return await prisma.user.create({
      data: userData
    });
  } catch (err) {
    if ((err as any).code === 'P2002') {
      // Check which unique constraint failed
      const target = (err as any).meta?.target;
      if (target === 'users_email_key') {
        throw new AppError(400, 'ClientError', 'Email already exists', err);
      }
      if (target === 'users_phone_key') {
        throw new AppError(400, 'ClientError', 'Phone number already exists', err);
      }
      throw new AppError(400, 'ClientError', 'A record with this data already exists', err);
    }
    throw new AppError(500, 'ServerError', 'Error creating user with role', err);
  }
}

export async function getUsersWithPagination(limit: number, offset: number, orderBy: any): Promise<UserWithSitesAndRole[]> {
  try {
    return await prisma.user.findMany({
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
  } catch (err) {
    throw new AppError(500, 'ServerError', 'Error getting users with pagination', err);
  }
}

export async function countUsers() {
  try {
    return await prisma.user.count();
  } catch (err) {
    throw new AppError(500, 'ServerError', 'Error counting users', err);
  }
}

export async function findUserById(id: string) {
  try {
    return await prisma.user.findUnique({
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
  } catch (err) {
    throw new AppError(500, 'ServerError', 'Error finding user by ID', err);
  }
}

export async function deleteUser(id: string) {
  try {
    return await prisma.user.update({
      where: { id },
      data: {
        is_deleted: true
      }
    });
  } catch (err) {
    if ((err as any).code === 'P2025') {
      throw new AppError(404, 'ClientError', 'User not found', err);
    }
    throw new AppError(500, 'ServerError', 'Error deleting user', err);
  }
}

export async function updateUserRepo(
  userId: string,
  updateData: Partial<z.infer<typeof userSchema>>
) {
  try {
    return await prisma.user.update({
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
  } catch (err) {
    if ((err as any).code === 'P2025') {
      return null; // User not found
    }
    if ((err as any).code === 'P2002') {
      // Check which unique constraint failed
      const target = (err as any).meta?.target;
      if (target === 'users_email_key') {
        throw new AppError(400, 'ClientError', 'Email already exists', err);
      }
      if (target === 'users_phone_key') {
        throw new AppError(400, 'ClientError', 'Phone number already exists', err);
      }
      throw new AppError(400, 'ClientError', 'A record with this data already exists', err);
    }
    throw new AppError(500, 'ServerError', 'Error updating user', err);
  }
}

export async function getUserWithAccountRole() {
  try {
    return await prisma.user.findFirst({
      where: {
        id: "89c3e26d-1256-46c5-a64b-742a037016fa",
      },
    });
  } catch (err) {
    if ((err as any).code === "P2025") {
      return null; // User not found
    }
    throw new AppError(500, "ServerError", "Error fetching user", err);
  }
}