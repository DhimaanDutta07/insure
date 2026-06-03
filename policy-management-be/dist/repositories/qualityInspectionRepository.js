"use strict";
// //qualityInspectionRepository.ts
// import { CreateQualityInspection } from "../schemas/qualityInspectionSchema";
// import { AppError } from "../utils/AppError";
// export async function createQualityInspectionRepo(data: CreateQualityInspection ) {
//   try {
//     // Find the truck registration using the truck number
//     const truckRegistration = await prisma.truck_Registration.findFirst({
//       where: {
//         truck: {
//           truck_number: data.truck_number
//         },
//         token_number: data.token_number
//       },
//       include: {
//         material: true
//       }
//     });
//     if (!truckRegistration) {
//       throw new AppError(404, 'ClientError', `No truck registration found for truck number: ${data.truck_number}`);
//     }
//     console.log(truckRegistration,"Truck Registration Data");
//     console.log(truckRegistration.material?.id , "Material Id")
//     // if (!truckRegistration.material?.id ) {
//     //   throw new AppError(400, 'ClientError', 'Material ID is required');
//     // }
//     // Create the quality inspection using the truck_registration_id and material_id from the truck registration
//     const newInspection = await prisma.quality_Inspection.create({
//       data: {
//         truck_registration_id: truckRegistration.id,
//         material_id: truckRegistration.material?.id || null,
//         starch: data.starch_percentage || 0,
//         moisture: data.moisture_percentage || 0,
//         tfm: data.tfm_percentage || 0,
//         remark: data.remarks,
//         result: data.result,
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
//             //     name: true,
//             //     phone: true,
//             //     email: true,
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
//     return newInspection;
//   } catch (error) {
//     if (error instanceof AppError) {
//       throw error;
//     }
//     throw new AppError(500, 'ServerError', 'Error creating quality inspection', error);
//   }
// }
// export async function getTodaysQualityInspectionsByUserRepo(userId: string) {
//     try {
//       // Create date range for today (midnight to midnight)
//       const today = new Date();
//       const startOfDay = new Date(today.setHours(0, 0, 0, 0));
//       const endOfDay = new Date(today.setHours(23, 59, 59, 999));
//       // Get inspections for the user on the current day
//       const inspections = await prisma.quality_Inspection.findMany({
//         where: {
//           inspected_by: userId,
//           timestamp: {
//             gte: startOfDay,
//             lte: endOfDay
//           }
//         },
//         include: {
//           truck_registration: {
//             include: {
//               truck: {
//                 select: {
//                   id: true,
//                   truck_number: true
//                 }
//               },
//               // vendor: {
//               //   select: {
//               //     id: true,
//               //     name: true
//               //   }
//               // }
//             }
//           },
//           material: {
//             select: {
//               id: true,
//               name: true
//             }
//           },
//           inspector: {
//             select: {
//               id: true,
//               name: true
//             }
//           }
//         },
//         orderBy: {
//           timestamp: 'desc'
//         }
//       });
//       return inspections;
//     } catch (err) {
//       throw new AppError(500, 'ServerError', 'Error retrieving today\'s quality inspections', err);
//     }
//   }
