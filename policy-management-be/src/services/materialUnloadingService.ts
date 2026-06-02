// // materialUnloadingService.ts
// import { createMaterialUnloadingRepo, getTodaysMaterialUnloadingsByUserRepo } from "../repositories/materialUnloadingRepository";
// // import { updatePurchaseOrderReceivedQuantity } from "../repositories/PurchaseOrderRepository";
// import { updateTruckRegistrationStatusRepo } from "../repositories/truckRegistrationRepository";
// import { CreateMaterialUnloading } from "../schemas/materialUnloadingSchema";
// import { AppError } from "../utils/AppError";

// export async function createMaterialUnloadingService(data: CreateMaterialUnloading) {
//   try {
//     // Create the unloading
//     const result = await createMaterialUnloadingRepo(data);

//     // Update truck registration status
//     await updateTruckRegistrationStatusRepo(result.truck_registration_id, "Completed");

//     // Update the purchase order received quantity
//   //   if(result.po_id){
//   //   await updatePurchaseOrderReceivedQuantity(result.po_id, data.net_weight);
//   //  }

//     return result;
//   } catch (error) {
//     if (error instanceof AppError) {
//       throw error;
//     }
//     throw new AppError(500, 'ServerError', 'Failed to create material unloading', error);
//   }
// }

// export async function getTodaysMaterialUnloadingsByUserService(userId: string) {
//   try {
//     return await getTodaysMaterialUnloadingsByUserRepo(userId);
//   } catch (error) {
//     if (error instanceof AppError) {
//       throw error;
//     }
//     throw new AppError(500, 'ServerError', 'Failed to retrieve today\'s material unloadings', error);
//   }
// }