// import { Request, Response } from "express";
// import { asyncTryCatch } from "../utils/errorHandler";
// import { 
//   createWeighingInspectionService, 
//   getWeighingInspectionByIdService,
//   getWeighingInspectionsByTruckNumberService,
//   getTruckForWeighing,
//   getTodaysWeighingInspectionsByUserService
// } from "../services/weighingInspectionService";
// import { CreateWeighingInspectionSchema } from "../schemas/weighingInspectionSchema";
// import { AppError } from "../utils/AppError";

// // Create a new weighing inspection
// export const createWeighingInspection = asyncTryCatch(async (req: Request, res: Response) => {
//   // Validate the request data
//   const validatedData = CreateWeighingInspectionSchema.parse(req.body);
  
//   // Create the weighing inspection
//   const inspection = await createWeighingInspectionService(validatedData);
  
//   res.status(201).json({
//     message: "Weighing inspection created successfully",
//     data: inspection
//   });
// });

// // Get all weighing inspections with optional filtering
// export const getTodaysWeighingInspectionsByUser = asyncTryCatch(async (req: Request, res: Response) => {
//   const userId = req.params.userId as string; // Get userId from route params
  
//   if (!userId) {
//     throw new AppError(400, 'ClientError', 'User ID is required');
//   }
  
//   const { data } = await getTodaysWeighingInspectionsByUserService(userId);
  
//   res.status(200).json({
//     message: "Today's weighing inspections retrieved successfully",
//     data
//   });
// });

// // Get a specific weighing inspection by ID
// export const getWeighingInspectionById = asyncTryCatch(async (req: Request, res: Response) => {
//   const id = req.params.id as string;
  
//   const inspection = await getWeighingInspectionByIdService(id);
  
//   res.status(200).json({
//     message: "Weighing inspection retrieved successfully",
//     data: inspection
//   });
// });

// // Get weighing inspections by truck number
// export const getWeighingInspectionsByTruckNumber = asyncTryCatch(async (req: Request, res: Response) => {
//   const { truckNumber } = req.query;
  
//   if (!truckNumber || typeof truckNumber !== 'string') {
//     res.status(400).json({
//       message: "Truck number is required",
//       data: null
//     });
//     return;
//   }
  
//   const { data, pagination } = await getWeighingInspectionsByTruckNumberService(truckNumber);
  
//   res.status(200).json({
//     message: "Weighing inspections retrieved successfully",
//     data,
//     pagination
//   });
// });

// export const getTruckWeighing = asyncTryCatch(async (req: Request, res: Response) => {
//     const {status} = req.body;
//     const trucks = await getTruckForWeighing(status);

//     res.status(200).json({
//       status: 'success',
//       data: {
//         trucks
//       }
//     });
// });