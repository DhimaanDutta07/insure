// import { PrismaClient, Truck_Status } from "@prisma/client";
// import { CreateTruck, UpdateTruck } from "../schemas/truckSchema";
// import { AppError } from "../utils/AppError";
// import { totalmem } from "os";

// const prisma = new PrismaClient();

// // Create a new truck
// export async function createTruckRepo(data: CreateTruck) {
//   try {
//     return await prisma.truck.create({
//       data: {
//         ...data,
//       //   vendor: {
//       //     // connect: {
//       //     //   // id: data.vendor_id // Assuming `vendor_id` is part of the `CreateTruck` schema
//       //     // }
//       //   }
//       // },
//       // include: {
//       //   vendor: {
//       //     select: {
//       //       id: true,
//       //       name: true
//       //     }
//       //   }
//       }
//     });
//   } catch (err) {
//     if ((err as any).code === 'P2002') {
//       throw new AppError(400, 'ClientError', 'Truck with this number already exists', err);
//     }
//     if ((err as any).code === 'P2025') {
//       throw new AppError(404, 'ClientError', 'Material not found', err);
//     }
//     throw new AppError(500, 'ServerError', 'Error creating truck', err);
//   }
// }

// // Get all trucks with filters and pagination
// export async function getAllTrucksRepo(skip = 0, take = 10, filters: any = {}) {
//   try {
//     const where: any = {
//       is_deleted: false
//     };
    
//     if (filters.truck_number) {
//       where.truck_number = {
//         contains: filters.truck_number
//       };
//     }
    
//     // if (filters.vendor_id) {
//     //   where.vendor_id = filters.vendor_id;
//     // }
    
//     return await prisma.truck.findMany({
//       where,
//       skip,
//       take,
//       // include: {
//       //   vendor: {
//       //     select: {
//       //       id: true,
//       //       name: true
//       //     }
//       //   }
//       // },
//       orderBy: {
//         created_at: 'desc' // Best practice: Default ordering by created_at
//       }
//     });
//   } catch (err) {
//     throw new AppError(500, 'ServerError', 'Error getting all trucks', err);
//   }
// }

// // Count trucks for pagination
// export async function countTrucksRepo(filters: any = {}) {
//   try {
//     const where: any = {
//       is_deleted: false 
//     };
    
//     if (filters.truck_number) {
//       where.truck_number = {
//         contains: filters.truck_number
//       };
//     }
    
//     // if (filters.vendor_id) {
//     //   where.vendor_id = filters.vendor_id;
//     // }
    
//     return await prisma.truck.count({
//       where
//     });
//   } catch (err) {
//     throw new AppError(500, 'ServerError', 'Error counting trucks', err);
//   }
// }

// // Get a single truck by ID
// export async function getTruckByIdRepo(id: string) {
//   try {
//     return await prisma.truck.findUnique({
//       where: { id },
//       // include: {
//       //   vendor: {
//       //     select: {
//       //       id: true,
//       //       name: true
//       //     }
//       //   }
//       // }
//     });
//   } catch (err) {
//     throw new AppError(500, 'ServerError', 'Error finding truck by ID', err);
//   }
// }

// // Update a truck
// export async function updateTruckRepo(id: string, data: UpdateTruck) {
//   try {
//     return await prisma.truck.update({
//       where: { id },
//       data, // Prisma will automatically update the updated_at field
//       // include: {
//       //   vendor: {
//       //     select: {
//       //       id: true,
//       //       name: true
//       //     }
//       //   }
//       // }
//     });
//   } catch (err) {
//     if ((err as any).code === 'P2025') {
//       throw new AppError(404, 'ClientError', 'Truck not found', err);
//     }
//     if ((err as any).code === 'P2002') {
//       throw new AppError(400, 'ClientError', 'Truck with this number already exists', err);
//     }
//     throw new AppError(500, 'ServerError', 'Error updating truck', err);
//   }
// }

// // Delete a truck
// export async function deleteTruckRepo(id: string) {
//   try {
//     await prisma.truck.update({
//       where: { id },
//       data:{
//         is_deleted: true
//       }
//     });
//     return true;
//   } catch (err) {
//     if ((err as any).code === 'P2025') {
//       throw new AppError(404, 'ClientError', 'Truck not found', err);
//     }
//     if ((err as any).code === 'P2003') {
//       throw new AppError(400, 'ClientError', 'Cannot delete: truck is referenced by other records', err);
//     }
//     throw new AppError(500, 'ServerError', 'Error deleting truck', err);
//   }
// }

// // Search trucks by truck number or vendor name
// export async function searchTrucksRepo(searchTerm: string, skip = 0, take = 10) {
//   try {
//     const where: any = {
//       is_deleted: false 
//     };
    
//     // Add truck_number filter directly to the truck model
//     if (searchTerm) {
//       where.truck_number = {
//         contains: searchTerm
//       };
//     }
    
//     // Add vendor name filter to the related vendor model
//     // if (searchTerm) {
//     //   where.vendor = {
//     //     name: {
//     //       contains: searchTerm
//     //     }
//     //   };
//     // }
    
//     return await prisma.truck.findMany({
//       where,
//       skip,
//       take,
//       // include: {
//       //   vendor: {
//       //     select: {
//       //       id: true,
//       //       name: true
//       //     }
//       //   },
//       // },
//       orderBy: {
//         created_at: 'desc'
//       }
//     });
//   } catch (err) {
//     throw new AppError(500, 'ServerError', 'Error searching trucks', err);
//   }
// }

// // Count search results for pagination
// export async function countSearchResultsRepo(search: { truck_number?: string }) {
// // export async function countSearchResultsRepo(search: { truck_number?: string, vendor_name?: string }) {
//   try {
//     const where: any = {
//       OR: []
//     };
    
//     if (search.truck_number) {
//       where.OR.push({
//         truck_number: {
//           contains: search.truck_number
//         }
//       });
//     }
    
//     // if (search.vendor_name) {
//     //   where.OR.push({
//     //     vendor: {
//     //       name: {
//     //         contains: search.vendor_name
//     //       }
//     //     }
//     //   });
//     // }
    
//     // If no search criteria, remove the OR condition
//     if (where.OR.length === 0) {
//       delete where.OR;
//     }
    
//     return await prisma.truck.count({
//       where
//     });
//   } catch (err) {
//     throw new AppError(500, 'ServerError', 'Error counting search results', err);
//   }
// }

// export async function getTruckByNumberRepo(truckNumber: string) {
//   try {
//     return await prisma.truck.findFirst({
//       where: { 
//         truck_number: truckNumber 
//       },
//       // include: {
//       //   vendor: {
//       //     select: {
//       //       id: true,
//       //       name: true
//       //     }
//       //   }
//       // }
//     });
//   } catch (err) {
//     throw new AppError(500, 'ServerError', 'Error finding truck by number', err);
//   }
// }

// // export async function getTruckRegistrationsByPORepo(poId: string) {
// //   try {
// //     return await prisma.truck_Registration.findMany({
// //       where: {
// //         id: poId
// //       }
// //     });
// //   } catch (err) {
// //     throw new AppError(500, 'ServerError', 'Error fetching truck registrations by PO', err);
// //   }
// // }



// export async function getAllDetailsForApp():Promise<any>  {
//   console.log("This is working")
//   try { 
//     const today = new Date();
//     today.setHours(0, 0, 0, 0); // Start of today
//     const tomorrow = new Date();
//     tomorrow.setHours(23, 59, 59, 999); // End of today
    
//     const truckRegistrations = await prisma.truck_Registration.findMany({
//       where: {
//         arrival_time: {
//           gte: today, // Greater than or equal to start of today
//           lte: tomorrow, // Less than or equal to end of today
//         },
//       },
//       include: {
//         truck: {
//           select: {
//             id: true,
//             truck_number:true,
//           },
//         },
//         // weighing_inspection: true, 
//         // quality_inspection: true, 
//         // unloading: true, 
//       },
//     });
    

//     // Count of trucks in each stage
//     return {
//       truckRegistrations
//     };
    
//   } catch (err) {
//     throw new AppError(500, 'ServerError', 'Error fetching truck registrations by PO', err);
//   }
// }