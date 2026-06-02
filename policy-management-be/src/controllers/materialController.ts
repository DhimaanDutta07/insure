// // src/controllers/rawMaterial.controller.ts
// import { Request, Response } from "express";
// import { 
//   createRawMaterialService,
//   getRawMaterialByIdService,
//   updateRawMaterialService,
//   deleteRawMaterialService,
//   searchRawMaterialsService,
//   getRawMaterialsService
// } from "../services/materialService";
// import { combinedRawMaterialQuerySchema, rawMaterialCreateSchema, rawMaterialQuerySchema, rawMaterialSearchSchema, rawMaterialUpdateSchema } from "../schemas/materialSchema";
// import { asyncTryCatch } from "../utils/errorHandler";

// // Create a new raw material
// export const createRawMaterial = asyncTryCatch(async (req: Request, res: Response) => {
//   const validatedData = rawMaterialCreateSchema.parse(req.body);
  
//   const rawMaterial = await createRawMaterialService(validatedData);
  
//   res.status(201).json({
//     message: "Raw material created successfully",
//     data: rawMaterial
//   });
// });

// // Get all raw materials with pagination and optional filtering
// export const getRawMaterials = asyncTryCatch(async (req: Request, res: Response) => {
//   // Parse query parameters - we'll create a schema that handles both cases
//   const queryParams = combinedRawMaterialQuerySchema.parse(req.query);
  
//   const { rawMaterials, totalCount, totalPages } = await getRawMaterialsService(queryParams);
  
//   res.status(200).json({
//     message: "Raw materials retrieved successfully",
//     data: rawMaterials,
//     meta: {
//       totalCount,
//       currentPage: queryParams.page,
//       pageSize: queryParams.limit,
//       totalPages,
//     }
//   });
// });

// // Get a single raw material by ID
// export const getRawMaterialById = asyncTryCatch(async (req: Request, res: Response) => {
//   const rawMaterialId = req.params.id as string;
  
//   const rawMaterial = await getRawMaterialByIdService(rawMaterialId);
  
//   if (!rawMaterial) {
//     return res.status(404).json({
//       message: "Raw material not found"
//     });
//   }
  
//   res.status(200).json({
//     message: "Raw material retrieved successfully",
//     data: rawMaterial
//   });
// });

// // Update a raw material
// export const updateRawMaterial = asyncTryCatch(async (req: Request, res: Response) => {
//   const rawMaterialId = req.params.id as string;
//   const validatedData = rawMaterialUpdateSchema.parse(req.body);
  
//   const updatedRawMaterial = await updateRawMaterialService(rawMaterialId, validatedData);
  
//   if (!updatedRawMaterial) {
//     return res.status(404).json({
//       message: "Raw material not found"
//     });
//   }
  
//   res.status(200).json({
//     message: "Raw material updated successfully",
//     data: updatedRawMaterial
//   });
// });

// // Delete a raw material
// export const deleteRawMaterial = asyncTryCatch(async (req: Request, res: Response) => {
//   const rawMaterialId = req.params.id as string;
  
//   const deleted = await deleteRawMaterialService(rawMaterialId);
  
//   if (!deleted) {
//     return res.status(404).json({
//       message: "Raw material not found"
//     });
//   }
  
//   res.status(200).json({
//     message: "Raw material deleted successfully"
//   });
// });

// export const searchRawMaterials = asyncTryCatch(async (req: Request, res: Response) => {
//   const searchParams = rawMaterialSearchSchema.parse(req.query);
  
//   const { rawMaterials, totalCount, totalPages } = await searchRawMaterialsService(searchParams);
  
//   res.status(200).json({
//     message: "Raw materials search completed",
//     data: rawMaterials,
//     meta: {
//       totalCount,
//       currentPage: searchParams.page,
//       pageSize: searchParams.limit,
//       totalPages,
//     }
//   });
// });