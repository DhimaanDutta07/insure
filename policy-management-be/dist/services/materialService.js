"use strict";
// // src/services/rawMaterial.service.ts
//   import { 
//     createRawMaterialRepo,
//     getAllRawMaterialsRepo,
//     getRawMaterialByIdRepo,
//     updateRawMaterialRepo,
//     deleteRawMaterialRepo,
//     countRawMaterialsRepo,
//     searchRawMaterialsRepo,
//     countSearchResultsRepo
//   } from "../repositories/materialRepository";
// import { CombinedRawMaterialQuery, RawMaterialCreate, RawMaterialQuery, RawMaterialResponse, RawMaterialSearch, RawMaterialUpdate } from "../schemas/materialSchema";
// import { AppError } from "../utils/AppError";
//   // Create a new raw material
//   export async function createRawMaterialService(
//     rawMaterialData: RawMaterialCreate
//   ): Promise<RawMaterialResponse> {
//     try {
//       const rawMaterial = await createRawMaterialRepo(rawMaterialData);
//       return {
//         ...rawMaterial,
//         category: rawMaterial.category_id ?? '',
//         subCategory: rawMaterial.sub_category_id ?? '',
//       };
//     } catch (error) {
//       if ((error as any).code === 'P2002') {
//         throw new AppError(409, 'ClientError', 'A raw material with this name already exists');
//       }
//       throw new AppError(500, 'ServerError', 'Failed to create raw material', error);
//     }
//   }
//   // Get all raw materials with pagination and optional filtering
//   export async function getRawMaterialsService(query: CombinedRawMaterialQuery) {
//     const { page, limit, name, searchTerm } = query;
//     const skip = (page - 1) * limit;
//     try {
//       let rawMaterials;
//       let totalCount;
//       // If searchTerm is provided, do a full search across multiple fields
//       if (searchTerm) {
//         rawMaterials = await searchRawMaterialsRepo(searchTerm, skip, limit);
//         totalCount = await countSearchResultsRepo(searchTerm);
//       } 
//       // Otherwise, do a filtered retrieval (potentially by name)
//       else {
//         const filters: { [key: string]: any } = {};
//         if (name) {
//           filters['name'] = {
//             contains: name,
//             mode: 'insensitive'
//           };
//         }
//         rawMaterials = await getAllRawMaterialsRepo(filters, skip, limit);
//         totalCount = await countRawMaterialsRepo(filters);
//       }
//       const totalPages = Math.ceil(totalCount / limit);
//       return {
//         rawMaterials,
//         totalCount,
//         totalPages
//       };
//     } catch (error) {
//       throw new AppError(500, 'ServerError', 'Failed to retrieve raw materials', error);
//     }
//   }
//   // Get a single raw material by ID
//   export async function getRawMaterialByIdService(
//     id: string
//   ): Promise<RawMaterialResponse | null> {
//     try {
//       const rawMaterial = await getRawMaterialByIdRepo(id);
//       if (rawMaterial) {
//         return {
//           ...rawMaterial,
//           category: rawMaterial.category_id ?? '',
//           subCategory: rawMaterial.sub_category_id ?? '',
//         };
//       }
//       return null;
//     } catch (error) {
//       throw new AppError(500, 'ServerError', 'Failed to retrieve raw material', error);
//     }
//   }
//   // Update a raw material
//   export async function updateRawMaterialService(
//     id: string,
//     updateData: RawMaterialUpdate
//   ): Promise<RawMaterialResponse | null> {
//     try {
//       const updatedRawMaterial = await updateRawMaterialRepo(id, updateData);
//       return {
//         ...updatedRawMaterial,
//         category: updatedRawMaterial.category_id ?? '',
//         subCategory: updatedRawMaterial.sub_category_id ?? '',
//       };
//     } catch (error) {
//       if ((error as any).code === 'P2002') {
//         throw new AppError(409, 'ClientError', 'A raw material with this name already exists');
//       }
//       throw new AppError(500, 'ServerError', 'Failed to update raw material', error);
//     }
//   }
//   // Delete a raw material
//   export async function deleteRawMaterialService(
//     id: string
//   ): Promise<boolean> {
//     try {
//       return await deleteRawMaterialRepo(id);
//     } catch (error) {
//       if ((error as any).code === 'P2003') {
//         throw new AppError(409, 'ClientError', 'Cannot delete this raw material as it is referenced by other records');
//       }
//       throw new AppError(500, 'ServerError', 'Failed to delete raw material', error);
//     }
//   }
//   export async function searchRawMaterialsService(
//     query: RawMaterialSearch
//   ) {
//     const { page, limit, name } = query;
//     const skip = (page - 1) * limit;
//     try {
//       const rawMaterials = await searchRawMaterialsRepo(name || "", skip, limit);
//       const totalCount = await countSearchResultsRepo(name || "");
//       const totalPages = Math.ceil(totalCount / limit);
//       return {
//         rawMaterials,
//         totalCount,
//         totalPages
//       };
//     } catch (error) {
//       throw new AppError(500, 'ServerError', 'Failed to search raw materials', error);
//     }
//   }
