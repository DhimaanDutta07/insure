"use strict";
// import { PrismaClient } from "@prisma/client";
// import { AppError } from "../utils/AppError";
// const prisma = new PrismaClient();
// // Create a new weighing inspection
// export async function createWeighingInspectionRepo(data: {
//     truck_registration_id: string;
//     material_id: string | null; // Allow null
//     gross_weight: number;
//     tare_weight: number;
//     net_weight: number;
//     inspected_by: string;
// }) {
//   try {
//     return await prisma.weighing_Inspection.create({
//       data: {
//         truck_registration_id: data.truck_registration_id,
//         material_id: data.material_id ?? null, // Ensure it's null if not provided
//         gross_weight: data.gross_weight,
//         tare_weight: data.tare_weight,
//         net_weight: data.net_weight,
//         inspected_by: data.inspected_by
//       },
//       include: {
//         truck_registration: {
//           include: {
//             truck: {
//               select: {
//                 id: true,
//                 truck_number: true
//               }
//             },
//             // vendor: {
//             //   select: {
//             //     id: true,
//             //     name: true
//             //   }
//             // },
//             material: {
//               select: {
//                 id: true,
//                 name: true
//               }
//             }
//           }
//         },
//         material: {
//           select: {
//             id: true,
//             name: true
//           }
//         },
//         inspector: {
//           select: {
//             id: true,
//             name: true
//           }
//         }
//       }
//     });
//   } catch (err) {
//     if ((err as any).code === 'P2002') {
//       throw new AppError(400, 'ClientError', 'Weighing inspection with this information already exists', err);
//     }
//     if ((err as any).code === 'P2025') {
//       throw new AppError(404, 'ClientError', 'Truck registration, material, or inspector not found', err);
//     }
//     throw new AppError(500, 'ServerError', 'Error creating weighing inspection', err);
//   }
// }
// export async function getTodaysWeighingInspectionsByUserRepo(userId: string) {
//   try {
//     // Create date range for today (midnight to midnight)
//     const today = new Date();
//     const startOfDay = new Date(today.setHours(0, 0, 0, 0));
//     const endOfDay = new Date(today.setHours(23, 59, 59, 999));
//     // Define where conditions
//     const where = {
//       inspected_by: userId,
//       timestamp: {
//         gte: startOfDay,
//         lte: endOfDay
//       }
//     };
//     // Get total count
//     const totalCount = await prisma.weighing_Inspection.count({ where });
//     // Get all results for today (no pagination needed since it's just one day)
//     const data = await prisma.weighing_Inspection.findMany({
//       where,
//       orderBy: {
//         timestamp: 'desc'
//       },
//       include: {
//         truck_registration: {
//           include: {
//             truck: {
//               select: {
//                 id: true,
//                 truck_number: true
//               }
//             },
//             // vendor: {
//             //   select: {
//             //     id: true,
//             //     name: true
//             //   }
//             // }
//           }
//         },
//         material: {
//           select: {
//             id: true,
//             name: true
//           }
//         },
//         inspector: {
//           select: {
//             id: true,
//             name: true
//           }
//         }
//       }
//     });
//     // Since it's just for today, we don't really need pagination,
//     // but we'll return a simple count for reference
//     const pagination = {
//       totalItems: totalCount
//     };
//     return { data, pagination };
//   } catch (err) {
//     throw new AppError(500, 'ServerError', 'Error retrieving today\'s weighing inspections', err);
//   }
// }
// // Get all weighing inspections with optional filtering and pagination
// export async function getWeighingInspectionsRepo(filters: {
//   truckRegistrationId?: string;
//   materialId?: string;
//   inspectorId?: string;
//   startDate?: Date;
//   endDate?: Date;
//   page: number;
//   limit: number;
// }) {
//   const { truckRegistrationId, materialId, inspectorId, startDate, endDate, page, limit } = filters;
//   // Calculate pagination
//   const skip = (page - 1) * limit;
//   // Build where conditions
//   const where: any = {};
//   if (truckRegistrationId) {
//     where.truck_registration_id = truckRegistrationId;
//   }
//   if (materialId) {
//     where.material_id = materialId;
//   }
//   if (inspectorId) {
//     where.inspected_by = inspectorId;
//   }
//   // Date range filter
//   if (startDate || endDate) {
//     where.timestamp = {};
//     if (startDate) {
//       where.timestamp.gte = startDate;
//     }
//     if (endDate) {
//       where.timestamp.lte = endDate;
//     }
//   }
//   try {
//     // Get total count for pagination
//     const totalCount = await prisma.weighing_Inspection.count({ where });
//     // Get paginated results
//     const data = await prisma.weighing_Inspection.findMany({
//       where,
//       skip,
//       take: limit,
//       orderBy: {
//         timestamp: 'desc'
//       },
//       include: {
//         truck_registration: {
//           include: {
//             truck: {
//               select: {
//                 id: true,
//                 truck_number: true
//               }
//             },
//             // vendor: {
//             //   select: {
//             //     id: true,
//             //     name: true
//             //   }
//             // }
//           }
//         },
//         material: {
//           select: {
//             id: true,
//             name: true
//           }
//         },
//         inspector: {
//           select: {
//             id: true,
//             name: true
//           }
//         }
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
//     throw new AppError(500, 'ServerError', 'Error retrieving weighing inspections', err);
//   }
// }
// // Get a specific weighing inspection by ID
// export async function getWeighingInspectionByIdRepo(id: string) {
//   try {
//     return await prisma.weighing_Inspection.findUnique({
//       where: { id },
//       include: {
//         truck_registration: {
//           include: {
//             truck: {
//               select: {
//                 id: true,
//                 truck_number: true
//               }
//             },
//             // vendor: {
//             //   select: {
//             //     id: true,
//             //     name: true
//             //   }
//             // }
//           }
//         },
//         material: {
//           select: {
//             id: true,
//             name: true
//           }
//         },
//         inspector: {
//           select: {
//             id: true,
//             name: true
//           }
//         }
//       }
//     });
//   } catch (err) {
//     throw new AppError(500, 'ServerError', 'Error retrieving weighing inspection', err);
//   }
// }
// export async function findTruckRegistrationByTruckNumber(truckNumber: string, tokenNumber: string) {
//   try {
//     return await prisma.truck_Registration.findFirst({
//       where: {
//         truck: {
//           truck_number: truckNumber,
//         },
//         token_number: tokenNumber,
//         status: "Queued"
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
//         material: {
//           select: {
//             id: true,
//             name: true
//           }
//         }
//       },
//       orderBy: {
//         arrival_time: 'desc'
//       }
//     });
//   } catch (err) {
//     throw new AppError(500, 'ServerError', 'Error finding truck registration', err);
//   }
// }
// // Find truck registration by truck number
// export async function findTruckRegistrationByTruckNumberRepo(truckNumber: string) {
//   try {
//     return await prisma.truck_Registration.findFirst({
//       where: {
//         truck: {
//           truck_number: truckNumber,
//         },
//         status: "Queued"
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
//         material: {
//           select: {
//             id: true,
//             name: true
//           }
//         }
//       },
//       orderBy: {
//         arrival_time: 'desc'
//       }
//     });
//   } catch (err) {
//     throw new AppError(500, 'ServerError', 'Error finding truck registration', err);
//   }
// }
