"use strict";
// import { PrismaClient, Truck_Status } from "@prisma/client";
// import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
// import { AppError } from "../utils/AppError";
// const prisma = new PrismaClient();
// // Create a new truck registration
// export async function createTruckRegistrationRepo(data: {
//   truck_id: string;
//   // vendor_id: string;
//   token_number?: string;
//   material_id?: string | null;
//   // po_id?:string |null;
//   arrival_time: Date;
//   photo: string;
//   status?: Truck_Status;
//   inspected_by: string; // Added inspected_by field
// }) {
//   try {
//     console.log('Data before saving to DB:', data); // Debugging: Ensure material_id is present in data
//     return await prisma.truck_Registration.create({
//       data: {
//         truck_id: data.truck_id,
//         // vendor_id: data.vendor_id,
//         token_number: data.token_number,
//         // material_id: data.material_id, // Check if this is getting set correctly
//         // po_id:data.po_id || null,
//         arrival_time: data.arrival_time,
//         photo: data.photo,
//         status: data.status || "Queued",
//         // inspected_by: data.inspected_by // Include inspected_by in data object
//       },
//       include: {
//         truck: {
//           select: {
//             id: true,
//             truck_number: true
//           }
//         },
//         // vendor: {
//         //   select: {
//         //     id: true,
//         //     name: true,
//         //     phone:true,
//         //   }
//         // },
//         // material: {
//         //   select: {
//         //     id: true,
//         //     name: true
//         //   }
//         // },
//         // inspector: { // Include inspector relation in response
//         //   select: {
//         //     id: true,
//         //     name: true
//         //   }
//         // }
//       }
//     });
//   } catch (err) {
//     console.error('Database Error:', err); // Log database error for debugging
//     if ((err as any).code === 'P2002') {
//       throw new AppError(400, 'ClientError', 'Truck registration with this information already exists', err);
//     }
//     if ((err as any).code === 'P2025') {
//       throw new AppError(404, 'ClientError', 'Truck, material or inspector not found', err);
//     }
//     throw new AppError(500, 'ServerError', 'Error creating truck registration', err);
//   }
// }
// // Generate a new token number
// export async function generateTokenRepo() {
//   try {
//     // Get the latest token from truck_registration table
//     const latestRegistration = await prisma.truck_Registration.findFirst({
//       orderBy: {
//         token_number: 'desc'
//       },
//       where: {
//         token_number: {
//           not: null
//         }
//       },
//       select: {
//         token_number: true
//       }
//     });
//     // Generate a new token number (simple sequential numbering)
//     let tokenNumber;
//     if (latestRegistration && latestRegistration.token_number) {
//       const lastNumber = parseInt(latestRegistration.token_number.replace(/[^0-9]/g, '') || '0');
//       tokenNumber = `${(lastNumber + 1).toString().padStart(4, '0')}`;
//     } else {
//       tokenNumber = '0001';
//     }
//     return { tokenNumber };
//   } catch (err) {
//     throw new AppError(500, 'ServerError', 'Error generating token number', err);
//   }
// }
// // Get truck registrations with filtering and pagination
// export async function getTruckRegistrationsRepo(filters: {
//   status?: string;
//   // vendorId?: string;
//   truckNumber?: string;
//   startDate?: Date;
//   endDate?: Date;
//   inspectorId?: string; // Added inspector filter
//   page: number;
//   limit: number;
// }) {
//   const { status, truckNumber, startDate, endDate, inspectorId, page, limit } = filters;
//   // const { status, vendorId, truckNumber, startDate, endDate, inspectorId, page, limit } = filters;
//   // Calculate pagination
//   const skip = (page - 1) * limit;
//   // Build where conditions
//   const where: any = {};
//   if (status) {
//     where.status = status;
//   }
//   // if (vendorId) {
//   //   where.vendor_id = vendorId;
//   // }
//   if (truckNumber) {
//     where.truck = {
//       truck_number: {
//         contains: truckNumber,
//         mode: 'insensitive'
//       }
//     };
//   }
//   if (inspectorId) {
//     where.inspected_by = inspectorId;
//   }
//   // Date range filter
//   if (startDate || endDate) {
//     where.arrival_time = {};
//     if (startDate) {
//       where.arrival_time.gte = startDate;
//     }
//     if (endDate) {
//       where.arrival_time.lte = endDate;
//     }
//   }
//   try {
//     // Get total count for pagination
//     const totalCount = await prisma.truck_Registration.count({ where });
//     // Get paginated results
//     const data = await prisma.truck_Registration.findMany({
//       where,
//       skip,
//       take: limit,
//       orderBy: {
//         arrival_time: 'desc'
//       },
//       include: {
//         truck: {
//           select: {
//             id: true,
//             truck_number: true
//           }
//         },
//         // vendor: {
//         //   select: {
//         //     id: true,
//         //     name: true
//         //   }
//         // },
//         // material: {
//         //   select: {
//         //     id: true,
//         //     name: true
//         //   }
//         // },
//         // inspector: { // Include inspector relation
//         //   select: {
//         //     id: true,
//         //     name: true
//         //   }
//         // }
//       }
//     });
//     // Build pagination info
//     const pagination = {
//       page,
//       limit,
//       totalItems: totalCount,
//       totalPages: Math.ceil(totalCount / limit)
//     };
//     return { data, pagination };
//   } catch (err) {
//     throw new AppError(500, 'ServerError', 'Error retrieving truck registrations', err);
//   }
// }
// // Get a specific truck registration by ID
// export async function getTruckRegistrationByIdRepo(id: string) {
//   try {
//     return await prisma.truck_Registration.findUnique({
//       where: { id },
//       include: {
//         truck: {
//           select: {
//             id: true,
//             truck_number: true
//           }
//         },
//         // vendor: {
//         //   select: {
//         //     id: true,
//         //     name: true
//         //   }
//         // },
//         // material: {
//         //   select: {
//         //     id: true,
//         //     name: true
//         //   }
//         // },
//         // inspector: { // Include inspector relation
//         //   select: {
//         //     id: true,
//         //     name: true
//         //   }
//         // }
//       }
//     });
//   } catch (err) {
//     throw new AppError(500, 'ServerError', 'Error retrieving truck registration', err);
//   }
// }
// export async function updateTruckRegistrationStatusRepo(truckRegId: string, status: Truck_Status, inspectorId?: string) {
//   const updateData: any = { status };
//   // Update inspector if provided
//   if (inspectorId) {
//     updateData.inspected_by = inspectorId;
//   }
//   return prisma.truck_Registration.update({
//     where: { id: truckRegId },
//     data: updateData,
//   });
// }
// export async function getTruckDetailByStatus(status: string) {
//   try {
//     // Query the database for truck registrations with the provided status
//     const truckRegistrations = await prisma.truck_Registration.findMany({
//       where: {
//         status: status as Truck_Status // Cast to TruckStatus enum
//       },
//       include: {
//         truck: true, // Include truck details to get truck_number
//         // inspector: { // Include inspector details
//         //   select: {
//         //     id: true,
//         //     name: true
//         //   }
//         // }
//       }
//     });
//     // Extract truck numbers from the result
//     const truck_numbers = truckRegistrations.map(registration => ({
//       id: registration.id,
//       truck_number: registration.truck.truck_number,
//       token_number: registration.token_number,
//       status: registration.status,
//       // inspector: registration.inspector ? registration.inspector.name : null
//     }));
//     return truck_numbers;
//   } catch (error) {
//     if (error instanceof AppError) {
//       throw error;
//     }
//     throw new AppError(500, 'ServerError', 'Failed to retrieve truck details by status', error);
//   }
// }
// export async function getTodaysTruckRegistrationsByUserRepo(userId: string) {
//   try {
//     // Create date range for today (midnight to midnight)
//     const today = new Date();
//     const startOfDay = new Date(today.setHours(0, 0, 0, 0));
//     const endOfDay = new Date(today.setHours(23, 59, 59, 999));
//     // Get truck registrations for the user on the current day
//     const registrations = await prisma.truck_Registration.findMany({
//       where: {
//         // inspected_by: userId,
//         // arrival_time: {
//         //   gte: startOfDay,
//         //   lte: endOfDay
//         // }
//       },
//       include: {
//         truck: {
//           select: {
//             id: true,
//             truck_number: true
//           }
//         },
//         // vendor: {
//         //   select: {
//         //     id: true,
//         //     name: true
//         //   }
//         // },
//         // material: {
//         //   select: {
//         //     id: true,
//         //     name: true
//         //   }
//         // },
//         // inspector: {
//         //   select: {
//         //     id: true,
//         //     name: true
//         //   }
//         // },
//         // quality_inspection: true,
//         // unloading: true
//       },
//       orderBy: {
//         arrival_time: 'desc'
//       }
//     });
//     return registrations;
//   } catch (err) {
//     throw new AppError(500, 'ServerError', 'Error retrieving today\'s truck registrations', err);
//   }
// }
// export async function getDashBoardDataBYDate(timePeriod = 'today') {
//   try {
//     const today = new Date();
//     let startDate, endDate;
//     // Calculate date ranges based on the time period
//     switch (timePeriod) {
//       case 'today':
//         startDate = new Date(today);
//         startDate.setHours(0, 0, 0, 0);
//         endDate = new Date(today);
//         endDate.setHours(23, 59, 59, 999);
//         break;
//       case 'yesterday':
//         startDate = new Date(today);
//         startDate.setDate(today.getDate() - 1);
//         startDate.setHours(0, 0, 0, 0);
//         endDate = new Date(today);
//         endDate.setDate(today.getDate() - 1);
//         endDate.setHours(23, 59, 59, 999);
//         break;
//       case 'thisWeek':
//         startDate = new Date(today);
//         startDate.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
//         startDate.setHours(0, 0, 0, 0);
//         endDate = new Date(today);
//         endDate.setHours(23, 59, 59, 999);
//         break;
//       case 'thisMonth':
//         startDate = new Date(today.getFullYear(), today.getMonth(), 1);
//         startDate.setHours(0, 0, 0, 0);
//         endDate = new Date(today);
//         endDate.setHours(23, 59, 59, 999);
//         break;
//       default:
//         startDate = new Date(today);
//         startDate.setHours(0, 0, 0, 0);
//         endDate = new Date(today);
//         endDate.setHours(23, 59, 59, 999);
//     }
//     const result = await prisma.truck_Registration.findMany({
//       where: {
//         arrival_time: {
//           gte: startDate,
//           lte: endDate
//         }
//       },
//       include: {
//         // weighing_inspection: {
//         //   include: {
//         //     inspector: {
//         //       select: {
//         //         id: true,
//         //         name: true,
//         //         phone:true,
//         //       }
//         //     }
//         //   }
//         // }, 
//         // quality_inspection: {
//         //   include: {
//         //     inspector: {
//         //       select: {
//         //         id: true,
//         //         name: true,
//         //         phone:true,
//         //       }
//         //     }
//         //   }
//         // }, 
//         // unloading: {
//         //   include: {
//         //     inspector: {
//         //       select: {
//         //         id: true,
//         //         name: true,
//         //         phone:true,
//         //       }
//         //     }
//         //   }
//         // }, 
//         truck: {
//           select: {
//             id: true,
//             truck_number: true
//           }
//         },
//         // vendor: {
//         //   select: {
//         //     id: true,
//         //     name: true,
//         //     purchase_orders: {
//         //       // where: {
//         //       //   NOT: {
//         //       //     status: {
//         //       //       in: [PurchaseOrder_Status.Completed, PurchaseOrder_Status.Expired]
//         //       //     }
//         //       //   }
//         //       // },
//         //       include: {
//         //         material: {
//         //           select: {
//         //             id: true,
//         //             name: true
//         //           }
//         //         },
//         //         created_by: {
//         //           select: {
//         //             id: true,
//         //             name: true
//         //           }
//         //         }
//         //       }
//         //     }
//         //   }
//         // },
//         // purchase_order:{
//         //   select:{
//         //     id:true,
//         //     PO_number:true,
//         //   }
//         // },
//         // material: {
//         //   select: {
//         //     id: true,
//         //     name: true
//         //   }
//         // },
//         // inspector: {
//         //   select: {
//         //     id: true,
//         //     name: true,
//         //     phone:true,
//         //   }
//         // },
//       },
//       orderBy: {
//         arrival_time: 'desc'
//       }
//     });
//     return result;
//   }
//   catch (err) {
//     throw new AppError(500, 'ServerError', `Error retrieving dashboard data for ${timePeriod}`, err);
//   }
// }
// export async function POAssignedToRegisteredTruck(truckRegistrationId: string) {
// // export async function POAssignedToRegisteredTruck(truckRegistrationId: string, poId: string) {
//   try {
//     // First check if the truck registration exists
//     const truckRegistration = await prisma.truck_Registration.findUnique({
//       where: {
//         id: truckRegistrationId
//       }
//     });
//     if (!truckRegistration) {
//       throw new AppError(404, 'ServerError', 'Truck registration not found');
//     }
//     // // Check if the PO exists
//     // const purchaseOrder = await prisma.purchase_Order.findUnique({
//     //   where: {
//     //     id: poId
//     //   }
//     // });
//     // if (!purchaseOrder) {
//     //   throw new AppError(404, 'ServerError', 'Purchase order not found');
//     // }
//     // Update the truck registration with the PO ID
//     const updatedTruckRegistration = await prisma.truck_Registration.update({
//       where: {
//         id: truckRegistrationId
//       },
//       data: {
//         // po_id: poId
//       },
//       include: {
//         truck: true,
//         // vendor: true,
//         // purchase_order: true
//       }
//     });
//     // const updatedMaterialUnloading = await prisma.material_Unloading.update({
//     //   where:{
//     //     truck_registration_id: truckRegistrationId,
//     //   },
//     //   data:{
//     //     // po_id: poId
//     //   }
//     // })
//     return updatedTruckRegistration;
//   } catch (err: unknown) {
//     if (err instanceof PrismaClientKnownRequestError) {
//       if (err.code === 'P2025') {
//         throw new AppError(404, 'ServerError', 'Record to update not found');
//       }
//     }
//     throw new AppError(500, 'ServerError', `Error Assigning PO: ${err instanceof Error ? err.message : 'Unknown error'}`);
//   }
// }
