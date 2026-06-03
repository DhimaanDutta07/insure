"use strict";
// // src/repositories/rawMaterial.repository.ts
// import { PrismaClient } from "@prisma/client";
// import { RawMaterialCreate, RawMaterialUpdate } from "../schemas/materialSchema";
// import { AppError } from "../utils/AppError";
// const prisma = new PrismaClient();
// // Create a new raw material
// export async function createRawMaterialRepo(data: RawMaterialCreate) {
//   try {
//     return await prisma.raw_Material.create({
//       data: {
//         ...data,
//         description: data.description || "",
//         starch: data.starch,
//         moisture: data.moisture,
//         tfm: data.tfm,
//         subCategory: {
//           connect: {
//             id: data.subCategory
//           }
//         },
//         category: {
//           connect: {
//             id: data.category
//           }
//         }
//       }
//     });
//   } catch (err) {
//     if ((err as any).code === 'P2002') {
//       throw new AppError(400, 'ClientError', 'Raw material with this name already exists', err);
//     }
//     throw new AppError(500, 'ServerError', 'Error creating raw material', err);
//   }
// }
// // Get all raw materials with filters and pagination
// export async function getAllRawMaterialsRepo(filters = {}, skip = 0, take = 10) {
//   try {
//     return await prisma.raw_Material.findMany({
//       where: {
//         ...filters,
//         is_deleted: false
//       },
//       skip,
//       take,
//       orderBy: {
//         created_at: 'desc'
//       }
//     });
//   } catch (err) {
//     throw new AppError(500, 'ServerError', 'Error getting all raw materials', err);
//   }
// }
// // Count raw materials for pagination
// export async function countRawMaterialsRepo(filters = {}) {
//   try {
//     return await prisma.raw_Material.count({
//       where: {
//         ...filters,
//         is_deleted: false
//       }
//     });
//   } catch (err) {
//     throw new AppError(500, 'ServerError', 'Error counting raw materials', err);
//   }
// }
// // Get a single raw material by ID
// export async function getRawMaterialByIdRepo(id: string) {
//   try {
//     return await prisma.raw_Material.findUnique({
//       where: { id }
//     });
//   } catch (err) {
//     throw new AppError(500, 'ServerError', 'Error finding raw material by ID', err);
//   }
// }
// // Update a raw material
// export async function updateRawMaterialRepo(id: string, data: RawMaterialUpdate) {
//   try {
//     return await prisma.raw_Material.update({
//       where: { id },
//       data: {
//         ...data,
//         category: data.category
//           ? {
//               connect: {
//                 id: data.category,
//               },
//             }
//           : undefined,
//         subCategory: data.subCategory
//           ? {
//               connect: {
//                 id: data.subCategory,
//               },
//             }
//           : undefined,
//       }
//     });
//   } catch (err) {
//     if ((err as any).code === 'P2025') {
//       throw new AppError(404, 'ClientError', 'Raw material not found', err);
//     }
//     if ((err as any).code === 'P2002') {
//       throw new AppError(400, 'ClientError', 'Raw material with this name already exists', err);
//     }
//     throw new AppError(500, 'ServerError', 'Error updating raw material', err);
//   }
// }
// // Delete a raw material
// export async function deleteRawMaterialRepo(id: string) {
//   try {
//     await prisma.raw_Material.update({
//       where: { id },
//       data: {
//         is_deleted: true
//       }
//     });
//     return true;
//   } catch (err) {
//     if ((err as any).code === 'P2025') {
//       throw new AppError(404, 'ClientError', 'Raw material not found', err);
//     }
//     throw new AppError(500, 'ServerError', 'Error deleting raw material', err);
//   }
// }
// // Search raw materials by name and description
// export async function searchRawMaterialsRepo(searchTerm: string, skip = 0, take = 10) {
//   try {
//     return await prisma.raw_Material.findMany({
//       where: {
//         OR: [
//           {
//             name: {
//               contains: searchTerm,
//               // mode: 'insensitive'
//             }
//           },
//           {
//             description: {
//               contains: searchTerm,
//               // mode: 'insensitive'
//             }
//           }
//         ],
//         is_deleted: false
//       },
//       skip,
//       take,
//       orderBy: {
//         created_at: 'desc'
//       }
//     });
//   } catch (err) {
//     throw new AppError(500, 'ServerError', 'Error searching raw materials', err);
//   }
// }
// // Count search results for pagination
// export async function countSearchResultsRepo(searchTerm: string) {
//   try {
//     return await prisma.raw_Material.count({
//       where: {
//         OR: [
//           {
//             name: {
//               contains: searchTerm,
//               // mode: 'insensitive'?
//             }
//           },
//           {
//             description: {
//               contains: searchTerm,
//               // mode: 'insensitive'
//             }
//           }
//         ],
//         is_deleted: false
//       }
//     });
//   } catch (err) {
//     throw new AppError(500, 'ServerError', 'Error counting search results', err);
//   }
// }
