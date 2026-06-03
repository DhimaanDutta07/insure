"use strict";
// import { getTruckDetailByStatus, updateTruckRegistrationStatusRepo } from "../repositories/truckRegistrationRepository";
// import { 
//     createWeighingInspectionRepo,
//     getWeighingInspectionsRepo,
//     getWeighingInspectionByIdRepo,
//     findTruckRegistrationByTruckNumberRepo,
//     getTodaysWeighingInspectionsByUserRepo,
//     findTruckRegistrationByTruckNumber
//   } from "../repositories/weighingInspectionRepository";
//   import { CreateWeighingInspection } from "../schemas/weighingInspectionSchema";
//   import { AppError } from "../utils/AppError";
//   // Create a new weighing inspection
//   // export async function createWeighingInspectionService(data: CreateWeighingInspection) {
//   //   try {
//   //     // Find the truck registration by truck number
//   //     const truckRegistration = await findTruckRegistrationByTruckNumber(data.truck_number, data.token_number);
//   //     if (!truckRegistration) {
//   //       throw new AppError(404, 'ClientError', 'No registered truck found with this number');
//   //     }
//   //     // Create weighing inspection data
//   //     const inspectionData = {
//   //       truck_registration_id: truckRegistration.id,
//   //       material_id: truckRegistration.material_id ?? null, // Use null instead of an empty string
//   //       gross_weight: data.gross_weight,
//   //       tare_weight: data.tare_weight,
//   //       net_weight: data.net_weight,
//   //       inspected_by: data.inspected_by
//   //     };
//   //     // Save the weighing inspection
//   //     const inspection = await createWeighingInspectionRepo(inspectionData);
//   //     // Update Truck_Registration status to "Weighing"
//   //     await updateTruckRegistrationStatusRepo(truckRegistration.id, "Weighing");
//   //     return inspection;
//   //   } catch (error) {
//   //     if (error instanceof AppError) {
//   //       throw error;
//   //     }
//   //     throw new AppError(500, 'ServerError', 'Failed to create weighing inspection', error);
//   //   }
//   // }
//   // Get weighing inspections with filtering
//   export async function getTodaysWeighingInspectionsByUserService(userId: string) {
//     try {
//       return await getTodaysWeighingInspectionsByUserRepo(userId);
//     } catch (error) {
//       if (error instanceof AppError) {
//         throw error;
//       }
//       throw new AppError(500, 'ServerError', 'Failed to retrieve today\'s weighing inspections', error);
//     }
//   }
//   // Get a specific weighing inspection by ID
//   export async function getWeighingInspectionByIdService(id: string) {
//     try {
//       const inspection = await getWeighingInspectionByIdRepo(id);
//       if (!inspection) {
//         throw new AppError(404, 'ClientError', 'Weighing inspection not found');
//       }
//       return inspection;
//     } catch (error) {
//       if (error instanceof AppError) {
//         throw error;
//       }
//       throw new AppError(500, 'ServerError', 'Failed to retrieve weighing inspection', error);
//     }
//   }
//   // Get weighing inspections by truck number
//   export async function getWeighingInspectionsByTruckNumberService(truckNumber: string) {
//     try {
//       // Find the truck registration first
//       const truckRegistration = await findTruckRegistrationByTruckNumberRepo(truckNumber);
//       if (!truckRegistration) {
//         // Return empty data with pagination if no truck found
//         return { 
//           data: [], 
//           pagination: { 
//             page: 1, 
//             limit: 10, 
//             totalItems: 0, 
//             totalPages: 0 
//           } 
//         };
//       }
//       // Get inspections for this truck registration with default pagination
//       return await getWeighingInspectionsRepo({
//         truckRegistrationId: truckRegistration.id,
//         page: 1,
//         limit: 10
//       });
//     } catch (error) {
//       if (error instanceof AppError) {
//         throw error;
//       }
//       throw new AppError(500, 'ServerError', 'Failed to retrieve weighing inspections', error);
//     }
//   }
//   export async function getTruckForWeighing(status: string) {
//     try {
//       // Call the function to get truck details by status
//       const truck_numbers = await getTruckDetailByStatus(status);
//       // Return the result
//       return truck_numbers;
//     } catch (error) {
//       if (error instanceof AppError) {
//         throw error;
//       }
//       throw new AppError(500, 'ServerError', 'Failed to retrieve trucks', error);
//     }
//   }
