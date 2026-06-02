// //qualityInspectionService.ts
// import { createQualityInspectionRepo, getTodaysQualityInspectionsByUserRepo } from "../repositories/qualityInspectionRepository";
// import { updateTruckRegistrationStatusRepo } from "../repositories/truckRegistrationRepository";
// import { CreateQualityInspection } from "../schemas/qualityInspectionSchema";
// import { AppError } from "../utils/AppError";


// export async function createQualityInspectionService(data: CreateQualityInspection) {
//   try {
//     // Create the inspection
//     const result = await createQualityInspectionRepo({...data });

//     await updateTruckRegistrationStatusRepo(result.truck_registration_id, "Quality");

//     return result;
//   } catch (error) {
//     if (error instanceof AppError) {
//       throw error;
//     }
//     throw new AppError(500, 'ServerError', 'Failed to create quality inspection', error);
//   }
// }

// export async function getTodaysQualityInspectionsByUserService(userId: string) {
//     try {
//       return await getTodaysQualityInspectionsByUserRepo(userId);
//     } catch (error) {
//       if (error instanceof AppError) {
//         throw error;
//       }
//       throw new AppError(500, 'ServerError', 'Failed to retrieve today\'s quality inspections', error);
//     }
//   }