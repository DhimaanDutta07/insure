"use strict";
// // materialUnloadingRepository.ts
// import { CreateMaterialUnloading } from "../schemas/materialUnloadingSchema";
// import { AppError } from "../utils/AppError";
// export async function createMaterialUnloadingRepo(data: CreateMaterialUnloading) {
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
//         // vendor: true,
//         material: true
//       }
//     });
//     if (!truckRegistration) {
//       throw new AppError(404, 'ClientError', `No truck registration found for truck number: ${data.truck_number}`);
//     }
//     // if (!truckRegistration.vendor_id) {
//     //   throw new AppError(400, 'ClientError', 'Vendor ID is required');
//     // }
//     // Find relevant purchase order based on vendor_id and material_id from the truck registration
//     // const purchaseOrder = await prisma.purchase_Order.findFirst({
//     //   where: {
//     //     // vendor_id: truckRegistration.vendor_id as string,
//     //   },
//     //   include: {
//     //     created_by: {
//     //       select: {
//     //         id: true,
//     //         name: true,
//     //         phone: true,
//     //         email: true
//     //       }
//     //     }
//     //   }
//     // });
//     // if (!purchaseOrder) {
//     //   throw new AppError(404, 'ClientError', 'No matching purchase order found for this truck registration');
//     // }
//     // Create the material unloading
//     const newUnloading = await prisma.material_Unloading.create({
//       data: {
//         truck_registration_id: truckRegistration.id,
//         // po_id: truckRegistration.po_id || "",
//         gross_weight: data.gross_weight,
//         tare_weight: data.tare_weight,
//         net_weight: data.net_weight,
//         starch: data.starch,
//         moisture: data.moisture,
//         tfm: data.tfm,
//         challan_no: "NA",
//         remarks: data.remarks,
//         inspected_by: data.inspected_by,
//         weight_out: data.net_weight // Assuming weight_out is the same as net_weight
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
//         // purchase_order: {
//         //   include: {
//         //     material: {
//         //       select: {
//         //         id: true,
//         //         name: true
//         //       }
//         //     },
//         //     created_by: {
//         //       select: {
//         //         id: true,
//         //         name: true,
//         //         phone: true,
//         //         email: true
//         //       }
//         //     }
//         //   }
//         // },
//         inspector: {
//           select: {
//             id: true,
//             name: true
//           }
//         }
//       }
//     });
//     return newUnloading;
//   } catch (error) {
//     if (error instanceof AppError) {
//       throw error;
//     }
//     throw new AppError(500, 'ServerError', 'Error creating material unloading', error);
//   }
// }
// export async function getTodaysMaterialUnloadingsByUserRepo(userId: string) {
//   try {
//     // Create date range for today (midnight to midnight)
//     const today = new Date();
//     const startOfDay = new Date(today.setHours(0, 0, 0, 0));
//     const endOfDay = new Date(today.setHours(23, 59, 59, 999));
//     // Get unloadings for the user on the current day
//     const unloadings = await prisma.material_Unloading.findMany({
//       where: {
//         inspected_by: userId,
//         timestamp: {
//           gte: startOfDay,
//           lte: endOfDay
//         }
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
//         // purchase_order: {
//         //   select: {
//         //     id: true,
//         //     material: {
//         //       select: {
//         //         id: true,
//         //         name: true
//         //       }
//         //     }
//         //   }
//         // },
//         inspector: {
//           select: {
//             id: true,
//             name: true
//           }
//         }
//       },
//       orderBy: {
//         timestamp: 'desc'
//       }
//     });
//     return unloadings;
//   } catch (err) {
//     throw new AppError(500, 'ServerError', 'Error retrieving today\'s material unloadings', err);
//   }
// }
