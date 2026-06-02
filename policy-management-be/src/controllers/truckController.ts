// import { Request, Response } from "express";
// import { asyncTryCatch } from "../utils/errorHandler";
// import { 
//   createTruckService,
//   getAllTrucksService, 
//   getTruckByIdService,
//   updateTruckService,
//   deleteTruckService,
//   searchTrucksService
// } from "../services/truckService";
// import { CreateTruckSchema, UpdateTruckSchema, TruckFilterSchema, TruckSearchSchema } from "../schemas/truckSchema";
// import { getAllDetailsForApp } from "../repositories/truckRepository";

// // Create a new truck
// export const createTruck = asyncTryCatch(async (req: Request, res: Response) => {
//   const validatedData = CreateTruckSchema.parse(req.body);
  
//   const truck = await createTruckService(validatedData);
  
//   res.status(201).json({
//     message: "Truck created successfully",
//     data: truck
//   });
// });

// // Get all trucks with pagination and optional filtering
// export const getTrucks = asyncTryCatch(async (req: Request, res: Response) => {
//   const { page = 1, limit = 10, ...filters } = TruckFilterSchema.parse({
//     page: parseInt(req.query.page as string) || 1,
//     limit: parseInt(req.query.limit as string) || 10,
//     truck_number: req.query.truck_number as string || undefined,
//     // vendor_id: req.query.vendor_id as string || undefined
//   });
  
//   const { trucks, totalCount, totalPages } = await getAllTrucksService(page, limit, { ...filters, page, limit });
  
//   res.status(200).json({
//     message: "Trucks retrieved successfully",
//     data: trucks,
//     meta: {
//       totalCount,
//       currentPage: page,
//       pageSize: limit,
//       totalPages,
//     }
//   });
// });

// // Get a single truck by ID
// export const getTruckById = asyncTryCatch(async (req: Request, res: Response) => {
//   const truckId = req.params.id as string;
  
//   const truck = await getTruckByIdService(truckId);
  
//   if (!truck) {
//     return res.status(404).json({
//       message: "Truck not found"
//     });
//   }
  
//   res.status(200).json({
//     message: "Truck retrieved successfully",
//     data: truck
//   });
// });

// // Update a truck
// export const updateTruck = asyncTryCatch(async (req: Request, res: Response) => {
//   const truckId = req.params.id as string;
//   const validatedData = UpdateTruckSchema.parse(req.body);
  
//   try {
//     const updatedTruck = await updateTruckService(truckId, validatedData);
    
//     res.status(200).json({
//       message: "Truck updated successfully",
//       data: updatedTruck
//     });
//   } catch (error) {
//     if ((error as any).statusCode === 404) {
//       return res.status(404).json({
//         message: "Truck not found"
//       });
//     }
//     throw error;
//   }
// });

// // Delete a truck
// export const deleteTruck = asyncTryCatch(async (req: Request, res: Response) => {
//   const truckId = req.params.id as string;
  
//   try {
//     await deleteTruckService(truckId);
    
//     res.status(200).json({
//       message: "Truck deleted successfully"
//     });
//   } catch (error) {
//     if ((error as any).statusCode === 404) {
//       return res.status(404).json({
//         message: "Truck not found"
//       });
//     }
//     throw error;
//   }
// });

// // Search trucks by truck number or vendor name
// export const searchTrucks = asyncTryCatch(async (req: Request, res: Response) => {
//   const { page = 1, limit = 10, truck_number: searchTerm } = TruckSearchSchema.parse({
//     page: parseInt(req.query.page as string) || 1,
//     limit: parseInt(req.query.limit as string) || 10,
//     truck_number: req.query.search as string || undefined,
//   });
  
//   const { trucks, totatrulCount: totalCount, totalPages } = await searchTrucksService({ searchTerm }, page, limit);
  
//   res.status(200).json({
//     message: "Trucks search completed",
//     data: trucks,
//     meta: {
//       totalCount,
//       currentPage: page,
//       pageSize: limit,
//       totalPages,
//     }
//   });
// });

// export const getAllTrucksDetails = asyncTryCatch(async (req: Request, res: Response) => {
//   console.log("This Entry is hitted")
//   const data = await getAllDetailsForApp();
//   res.status(200).json(data);
// });