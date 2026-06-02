// import { 
//   createTruckRegistrationRepo, 
//   getTruckRegistrationsRepo, 
//   getTruckRegistrationByIdRepo,
//   generateTokenRepo,
//   getTodaysTruckRegistrationsByUserRepo,
//   getDashBoardDataBYDate,
//   POAssignedToRegisteredTruck
// } from "../repositories/truckRegistrationRepository";
// import { getTruckByNumberRepo, 
//   // getTruckRegistrationsByPORepo
//  } from "../repositories/truckRepository";
// // import { 
// //   // getActivePosByVendorIdRepo,
// //    getAllTruckWithActivePO, 
// //    updatePurchaseOrderStatusRepo } from "../repositories/PurchaseOrderRepository";
// import { CreateTruckRegistration } from "../schemas/truckRegistrationSchema";
// import { AppError } from "../utils/AppError";
// import { Truck_Status } from "@prisma/client";
// import exp from "constants";

// // Create a new truck registration
// export async function createTruckRegistrationService(data: CreateTruckRegistration & { inspected_by?: string }) {
//   try {
//     // Find the truck by truck number
//     const truck = await getTruckByNumberRepo(data.truck_number);
    
//     if (!truck) {
//       throw new AppError(404, 'ClientError', 'Truck not found with this number');
//     }
    
//     // // Get the vendor ID from the truck
//     // const vendorId = truck.vendor_id;
//     // console.log('Vendor ID:', vendorId);
    
//     // if (!vendorId) {
//     //   throw new AppError(400, 'ClientError', 'Truck does not have an associated vendor');
//     // }
    
//     // // Get active purchase orders for this vendor
//     // const activePOs = await getActivePosByVendorIdRepo(vendorId);
//     // console.log('Active Purchase Orders:', activePOs);
    
//     // If no active PO, we can still create the registration without material
//     let materialId = null;
//     let purchaseOrderId = null;
    
//     // if (activePOs && activePOs.length > 0) {
//     //   // Get the first active PO
//     //   const activePO = activePOs[0];
//     //   console.log('Selected Active PO:', activePO);
//     //   materialId = activePO.material_id;  // Ensure material_id is being extracted correctly
//     //   console.log('Extracted Material ID:', materialId); // Debugging: Check if material_id is actually present
//     //   purchaseOrderId = activePO.id;

//     //   const existingRegistrations = await getTruckRegistrationsByPORepo(purchaseOrderId);
      
//     //   // If no existing registrations for this PO, update PO status to "Active"
//     //   if (!existingRegistrations || existingRegistrations.length === 0) {
//     //     await updatePurchaseOrderStatusRepo(purchaseOrderId, "InProgress");
//     //   }
//     // }
    
//     // Get inspected_by from data or default inspector if not provided
//     const inspectorId = data.inspected_by || 'default_inspector_id';
    
//     // Create registration data
//     const registrationData = {
//       truck_id: truck.id,
//       // vendor_id: vendorId,
//       token_number: data.token, 
//       material_id: materialId, // Ensure this is not null if PO exists
//       // po_id: purchaseOrderId,
//       arrival_time: new Date(), // Current time
//       photo: data.photo,  // Added photo URL
//       status: Truck_Status.Queued,
//       inspected_by: inspectorId, // Add inspector ID
//     };

//     console.log('Final Registration Data:', registrationData); // Debugging: Ensure material_id is not null here
    
//     // Save the truck registration
//     const registration = await createTruckRegistrationRepo(registrationData);
    
//     return registration;
//   } catch (error) {
//     if (error instanceof AppError) {
//       throw error;
//     }
//     throw new AppError(500, 'ServerError', 'Failed to create truck registration', error);
//   }
// }
// // Generate a new token number
// export async function generateTokenService() {
//   try {
//     return await generateTokenRepo();
//   } catch (error) {
//     throw new AppError(500, 'ServerError', 'Failed to generate token number', error);
//   }
// }

// // Get truck registrations with filtering
// export async function getTruckRegistrationsService(filters: {
//   status?: string;
//   // vendorId?: string;
//   truckNumber?: string;
//   startDate?: Date;
//   endDate?: Date;
//   page: number;
//   limit: number;
// }) {
//   try {
//     return await getTruckRegistrationsRepo(filters);
//   } catch (error) {
//     if (error instanceof AppError) {
//       throw error;
//     }
//     throw new AppError(500, 'ServerError', 'Failed to retrieve truck registrations', error);
//   }
// }

// // Get a specific truck registration by ID
// export async function getTruckRegistrationByIdService(id: string) {
//   try {
//     const registration = await getTruckRegistrationByIdRepo(id);
    
//     if (!registration) {
//       throw new AppError(404, 'ClientError', 'Truck registration not found');
//     }
    
//     return registration;
//   } catch (error) {
//     if (error instanceof AppError) {
//       throw error;
//     }
//     throw new AppError(500, 'ServerError', 'Failed to retrieve truck registration', error);
//   }
// }

// // export async function getAllActivePOTruck() {
// //   try {
// //     const trucks = await getAllTruckWithActivePO();

// //     if(!trucks || trucks.length === 0) {
// //       throw new AppError(404, 'ClientError', 'Trucks not found');
// //     }
// //     return trucks;
// //   }
// //   catch(error) {
// //     if (error instanceof AppError) {
// //       throw error;
// //     }
// //     throw new AppError(500, 'ServerError', 'Failed to retrieve trucks', error);
// //   }
// // }

// export async function getTodaysTruckRegistrationsByUserService(userId: string) {
//   try {
//     return await getTodaysTruckRegistrationsByUserRepo(userId);
//   } catch (error) {
//     if (error instanceof AppError) {
//       throw error;
//     }
//     throw new AppError(500, 'ServerError', 'Failed to retrieve today\'s truck registrations', error);
//   }
// }

// export async function getDashboardData(timePeriod: string) {
//   try{
//     return await getDashBoardDataBYDate(timePeriod);
//   }
//   catch (error) {
//     if (error instanceof AppError) {
//       throw error;
//     }
//     throw new AppError(500, 'ServerError', 'Failed to retrieve Dashboard Data', error);
//   }
// }

// // export async function POAssignBYAccountTeam(truckRegistrationId: string, poId: string) {
// //   try {
// //     return await POAssignedToRegisteredTruck(truckRegistrationId);
// //     // return await POAssignedToRegisteredTruck(truckRegistrationId, poId);
// //   } catch (error) {
// //     if (error instanceof AppError) {
// //       throw error;
// //     }
// //     throw new AppError(500, 'ServerError', 'Failed to assign PO to Vendors Truck', error);
// //   }
// // }