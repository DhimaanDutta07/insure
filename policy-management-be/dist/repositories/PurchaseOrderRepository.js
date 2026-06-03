"use strict";
// import prisma from '../utils/prismaClient';
// import { z } from 'zod';
// import { purchaseOrderSchema, PurchaseOrderUnit, purchaseOrderUpdateSchema } from '../schemas/purchaseOrderSchema';
// import { PurchaseOrder_Status } from '@prisma/client';
// import { AppError } from '../utils/AppError';
// export async function findAllPurchaseOrders(
//   page: number = 1,
//   limit: number = 10,
//   filters: any = {}
// ) {
//   try {
//     const skip = (page - 1) * limit;
//     // Build where clause based on filters
//     const where: any = {
//       is_deleted: false  // Add soft delete filter
//     };
//     // if (filters.vendor_id) where.vendor_id = filters.vendor_id;
//     if (filters.material_id) where.material_id = filters.material_id;
//     if (filters.status) where.status = filters.status;
//     if (filters.fromDate && filters.toDate) {
//       where.issued_at = {
//         gte: new Date(filters.fromDate),
//         lte: new Date(filters.toDate),
//       };
//     } else if (filters.fromDate) {
//       where.issued_at = { gte: new Date(filters.fromDate) };
//     } else if (filters.toDate) {
//       where.issued_at = { lte: new Date(filters.toDate) };
//     }
//     // Get total count for pagination
//     const total = await prisma.purchase_Order.count({ where });
//     // Get paginated results
//     const purchaseOrders = await prisma.purchase_Order.findMany({
//       where,
//       // include: {
//       //   vendor: {
//       //     select: {
//       //       id: true,
//       //       name: true,
//       //     },
//       //   },
//       //   material: {
//       //     select: {
//       //       id: true,
//       //       name: true,
//       //     },
//       //   },
//       // },
//       orderBy: {
//         issued_at: 'desc',
//       },
//       skip,
//       take: limit,
//     });
//     return [purchaseOrders, total];
//   } catch (err) {
//     throw new AppError(500, 'ServerError', 'Error finding purchase orders with pagination', err);
//   }
// }
// export async function searchPurchaseOrders(
//   page: number = 1,
//   limit: number = 10,
//   filters: any = {}
// ) {
//   try {
//     const skip = (page - 1) * limit;
//     // Build where clause based on filters
//     const where: any = {
//       is_deleted: false  // Add soft delete filter
//     };
//     // Basic filters
//     // if (filters.vendor_id) where.vendor_id = filters.vendor_id;
//     if (filters.material_id) where.material_id = filters.material_id;
//     if (filters.status) where.status = filters.status;
//     // Search for either vendor name or PO_number
//     if (filters.search) {
//       where.OR = [
//         {
//           // vendor: {
//           //   name: {
//           //     contains: filters.search
//           //   }
//           // }
//         },
//         {
//           PO_number: {
//             contains: filters.search
//           }
//         }
//       ];
//     }
//     // // Keep the old vendor_name search for backward compatibility
//     // else if (filters.vendor_name) {
//     //   where.vendor = {
//     //     name: {
//     //       contains: filters.vendor_name
//     //     }
//     //   };
//     // }
//     // Get total count for pagination
//     const total = await prisma.purchase_Order.count({ where });
//     // Get paginated results
//     const purchaseOrders = await prisma.purchase_Order.findMany({
//       where,
//       // include: {
//       //   vendor: {
//       //     select: {
//       //       id: true,
//       //       name: true,
//       //     },
//       //   },
//       //   material: {
//       //     select: {
//       //       id: true,
//       //       name: true,
//       //     },
//       //   },
//       // },
//       orderBy: {
//         issued_at: 'desc',
//       },
//       skip,
//       take: limit,
//     });
//     return [purchaseOrders, total];
//   } catch (err) {
//     throw new Error('Error searching purchase orders');
//   }
// }
// export async function findPurchaseOrders(
//   page: number = 1,
//   limit: number = 10,
//   filters: any = {}
// ) {
//   try {
//     const skip = (page - 1) * limit;
//     // Build where clause based on filters
//     const where: any = {
//       is_deleted: false  // Add soft delete filter
//     };
//     // Basic filters
//     // if (filters.vendor_id) where.vendor_id = filters.vendor_id;
//     if (filters.material_id) where.material_id = filters.material_id;
//     if (filters.status) where.status = filters.status;
//     // Date range filters
//     if (filters.fromDate && filters.toDate) {
//       where.issued_at = {
//         gte: new Date(filters.fromDate),
//         lte: new Date(filters.toDate),
//       };
//     } else if (filters.fromDate) {
//       where.issued_at = { gte: new Date(filters.fromDate) };
//     } else if (filters.toDate) {
//       where.issued_at = { lte: new Date(filters.toDate) };
//     }
//     // // Search filters
//     // if (filters.vendor_name) {
//     //   where.vendor = {
//     //     name: {
//     //       contains: filters.vendor_name,
//     //       mode: 'insensitive' // Case insensitive search
//     //     }
//     //   };
//     // }
//     // Add PO_number search
//     if (filters.po_number) {
//       where.PO_number = {
//         contains: filters.po_number,
//         mode: 'insensitive' // Case insensitive search
//       };
//     }
//     // Get total count for pagination
//     const total = await prisma.purchase_Order.count({ where });
//     // Get paginated results
//     const purchaseOrders = await prisma.purchase_Order.findMany({
//       where,
//       // include: {
//       //   vendor: {
//       //     select: {
//       //       id: true,
//       //       name: true,
//       //     },
//       //   },
//       //   material: {
//       //     select: {
//       //       id: true,
//       //       name: true,
//       //     },
//       //   },
//       // },
//       orderBy: {
//         issued_at: 'desc',
//       },
//       skip,
//       take: limit,
//     });
//     return [purchaseOrders, total];
//   } catch (err) {
//     throw new AppError(500, 'ServerError', 'Error finding purchase orders', err);
//   }
// }
// export async function findPurchaseOrderById(id: string) {
//   try {
//     return await prisma.purchase_Order.findUnique({
//       where: { id,
//         is_deleted: false 
//        },
//       // include: {
//       //   vendor: {
//       //     select: {
//       //       id: true,
//       //       name: true,
//       //     },
//       //   },
//       //   material: {
//       //     select: {
//       //       id: true,
//       //       name: true,
//       //     },
//       //   },
//       //   unloadings: true,
//       // },
//     });
//   } catch (err) {
//     throw new AppError(500, 'ServerError', 'Error finding purchase order by ID', err);
//   }
// }
// export async function createPurchaseOrder(data: any) {
//   try {
//     const now = new Date();
//     return await prisma.purchase_Order.create({
//       data: {
//         // vendor: {
//         //   connect: { id: data.vendor_id },
//         // },
//         material: {
//           connect: { id: data.material_id },
//         },
//         created_by: {
//           connect: { id: data.created_by_id },
//         },
//         quantity: data.quantity,
//         unit: data.unit,
//         amount: data.amount,
//         status: data.status || 'Pending', // Default to Pending if not provided
//         expiry_date: data.expiry_date,
//         issued_at: data.issued_at || now,
//         document_path: data.document_path,
//         document_name: data.document_name,
//         PO_number: data.PO_number, // Add PO_number field
//         // Prisma will automatically handle created_at and updated_at
//       },
//       // include: {
//       //   vendor: {
//       //     select: {
//       //       id: true,
//       //       name: true,
//       //       phone: true,
//       //       email: true,
//       //     },
//       //   },
//       //   material: {
//       //     select: {
//       //       id: true,
//       //       name: true,
//       //     },
//       //   },
//       //   created_by: {
//       //     select: {
//       //       id: true,
//       //       name: true,
//       //     },
//       //   },
//       // },
//     });
//   } catch (err) {
//     if ((err as any).code === 'P2025') {
//       throw new AppError(404, 'ClientError', 'Material, or user not found', err);
//     }
//     if ((err as any).code === 'P2002') {
//       // This could now be triggered by a duplicate PO_number as well
//       throw new AppError(400, 'ClientError', 'Purchase order with this information already exists', err);
//     }
//     throw new AppError(500, 'ServerError', 'Error creating purchase order', err);
//   }
// }
// export async function updatePurchaseOrder(
//   id: string,
//   data: Partial<z.infer<typeof purchaseOrderUpdateSchema>>
// ) {
//   try {
//     return await prisma.purchase_Order.update({
//       where: { id },
//       data: {
//         // Only include fields that are present in the data object
//         // ...(data.vendor_id && { vendor: { connect: { id: data.vendor_id } } }),
//         ...(data.material_id && { material: { connect: { id: data.material_id } } }),
//         ...(data.created_by_id && { created_by: { connect: { id: data.created_by_id } } }),
//         ...(data.quantity !== undefined && { quantity: data.quantity }),
//         ...(data.amount !== undefined && { amount: data.amount }),
//         ...(data.received_quantity !== undefined && { received_quantity: data.received_quantity }),
//         ...(data.unit && { unit: data.unit }),
//         ...(data.status && { status: data.status as PurchaseOrder_Status }),
//         ...(data.expiry_date && { expiry_date: data.expiry_date }),
//         ...(data.issued_at && { issued_at: data.issued_at }),
//         ...(data.document_path !== undefined && { document_path: data.document_path }),
//         ...(data.document_name !== undefined && { document_name: data.document_name }),
//         ...(data.po_number !== undefined && { po_number: data.po_number }),
//         updated_at: new Date(), // Always update the updated_at timestamp
//       },
//       // include: {
//       //   vendor: {
//       //     select: {
//       //       id: true,
//       //       name: true,
//       //     },
//       //   },
//       //   material: {
//       //     select: {
//       //       id: true,
//       //       name: true,
//       //     },
//       //   },
//       //   created_by: {
//       //     select: {
//       //       id: true,
//       //       name: true,
//       //     },
//       //   },
//       // },
//     });
//   } catch (err) {
//     if ((err as any).code === 'P2025') {
//       throw new AppError(404, 'ClientError', 'Purchase order not found', err);
//     }
//     if ((err as any).code === 'P2002') {
//       throw new AppError(400, 'ClientError', 'Duplicate entry violation', err);
//     }
//     throw new AppError(500, 'ServerError', 'Error updating purchase order', err);
//   }
// }
// export async function deletePurchaseOrder(id: string) {
//   try {
//     return await prisma.purchase_Order.update({
//       where: { id },
//       data:{
//         is_deleted:true,
//       }
//     });
//   } catch (err) {
//     if ((err as any).code === 'P2025') {
//       throw new AppError(404, 'ClientError', 'Purchase order not found', err);
//     }
//     if ((err as any).code === 'P2003') {
//       throw new AppError(400, 'ClientError', 'Cannot delete: purchase order is referenced by other records', err);
//     }
//     throw new AppError(500, 'ServerError', 'Error deleting purchase order', err);
//   }
// }
// // export async function getActivePosByVendorIdRepo(vendorId: string) {
// //   try {
// //     return await prisma.purchase_Order.findMany({
// //       where: { 
// //         is_deleted: false,
// //         // vendor_id: vendorId,
// //         status: {in : ["Pending", "InProgress"]},
// //         expiry_date: {
// //           gte: new Date() // Only get POs that haven't expired
// //         }
// //       },
// //       orderBy: {
// //         issued_at: 'desc' // Get newest POs first
// //       },
// //       include: {
// //         material: {
// //           select: {
// //             id: true,
// //             name: true
// //           }
// //         }
// //       }
// //     });
// //   } catch (err) {
// //     throw new AppError(500, 'ServerError', 'Error finding active purchase orders', err);
// //   }
// // }
// export async function getAllTruckWithActivePO() {
//   try {
//     // Get current date at the start of the day
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     // Get all trucks whose vendors have pending purchase orders
//     const trucks = await prisma.truck.findMany({
//       where: {
//         is_deleted:false,
//         // vendor: {
//         //   // purchase_orders: {
//         //   //   some: {
//         //   //     status: { in: ["Pending", "InProgress"] } 
//         //   //   }
//         //   // }
//         // },
//         OR: [
//           // Case 1: No registration today
//           {
//             truck_registrations: {
//               none: {
//                 arrival_time: {
//                   gte: today
//                 }
//               }
//             }
//           },
//           // Case 2: Has registration today but with Completed or Rejected status
//           {
//             truck_registrations: {
//               some: {
//                 status: { in: ["Completed", "Rejected"] },
//                 arrival_time: {
//                   gte: today
//                 }
//               }
//             }
//           }
//         ]
//       },
//       select: {
//         id: true,
//         truck_number: true,
//       },
//     });
//     return trucks;
//   } catch (err) {
//     throw new AppError(500, 'ServerError', 'Error finding trucks with active purchase orders', err);
//   }
// }
// // Function to update purchase order status
// export async function updatePurchaseOrderStatusRepo(poId: string, status: PurchaseOrder_Status) {
//   try {
//     return await prisma.purchase_Order.update({
//       where: {
//         id: poId
//       },
//       data: {
//         status: status
//       }
//     });
//   } catch (err) {
//     if ((err as any).code === 'P2025') {
//       throw new AppError(404, 'ClientError', 'Purchase order not found', err);
//     }
//     throw new AppError(500, 'ServerError', 'Error updating purchase order status', err);
//   }
// }
// // Add this function to src/repositories/PurchaseOrderRepository.ts
// export async function updatePurchaseOrderReceivedQuantity(
//   id: string,
//   additionalQuantity: number
// ) {
//   try {
//     // First, get the current purchase order
//     const purchaseOrder = await prisma.purchase_Order.findUnique({
//       where: { id }
//     });
//     if (!purchaseOrder) {
//       throw new AppError(404, 'ClientError', 'Purchase order not found');
//     }
//     // Calculate the new received quantity
//     let newReceivedQuantity: number;
//     if (purchaseOrder.received_quantity === null) {
//       newReceivedQuantity = additionalQuantity;
//     } else {
//       newReceivedQuantity = Number(purchaseOrder.received_quantity) + additionalQuantity;
//     }
//     // Calculate the difference between ordered and received quantities
//     const quantityDifference = Number(purchaseOrder.quantity) - newReceivedQuantity;
//     // Determine if status should be updated to "completed"
//     const updateData: any = {
//       received_quantity: newReceivedQuantity
//     };
//     // If difference is 0 or negative, set status to "completed"
//     if (quantityDifference <= 0) {
//       updateData.status = PurchaseOrder_Status.Completed;
//     }
//     // Update purchase order with new received quantity and status if needed
//     return await prisma.purchase_Order.update({
//       where: { id },
//       data: updateData
//     });
//   } catch (err) {
//     throw new AppError(500, 'ServerError', 'Error updating purchase order received quantity', err);
//   }
// }
// export async function getOrderAnalyticsRepo(fromDate: Date, toDate: Date) {
//   try {
//     // Get daily order counts for chart
//     const dailyOrders = await getDailyOrderCounts(fromDate, toDate);
//     // Calculate summary statistics
//     const totalOrders = dailyOrders.reduce((sum, day) => sum + day.orders, 0);
//     const averageOrders = Math.round(totalOrders / dailyOrders.length) || 0;
//     const peakOrders = dailyOrders.length > 0 ? Math.max(...dailyOrders.map(day => day.orders)) : 0;
//     return {
//       dailyOrders,
//       summary: {
//         totalOrders,
//         averageOrders,
//         peakOrders
//       }
//     };
//   } catch (err) {
//     throw new AppError(500, 'ServerError', 'Error retrieving order analytics', err);
//   }
// }
// // Helper function to get daily order counts
// async function getDailyOrderCounts(fromDate: Date, toDate: Date) {
//   // This assumes you have an "orders" table with a "created_at" or similar timestamp field
//   // Adjust the query based on your actual database schema
//   // Get all days between fromDate and toDate (inclusive)
//   const days = [];
//   const currentDate = new Date(fromDate);
//   while (currentDate <= toDate) {
//     days.push(new Date(currentDate));
//     currentDate.setDate(currentDate.getDate() + 1);
//   }
//   // Get order counts for each day using Prisma's groupBy if available
//   // This is a generic implementation - adjust based on your database structure
//   const orderCounts = await Promise.all(
//     days.map(async (day) => {
//       const dayStart = new Date(day);
//       dayStart.setHours(0, 0, 0, 0);
//       const dayEnd = new Date(day);
//       dayEnd.setHours(23, 59, 59, 999);
//       const count = await prisma.purchase_Order.count({
//         where: {
//           is_deleted:false,
//           issued_at: {
//             gte: dayStart,
//             lte: dayEnd
//           }
//         }
//       });
//       return {
//         date: day.toISOString().split('T')[0], // Format as YYYY-MM-DD
//         displayDate: format(day, 'MMM dd'), // Format as "Jan 01"
//         orders: count
//       };
//     })
//   );
//   return orderCounts;
// }
// // Function to format date (similar to the date-fns format function)
// function format(date: Date, formatStr: string) {
//   // Simple implementation for "MMM dd" format
//   // In a real implementation, you would use date-fns or another library
//   const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
//   const month = months[date.getMonth()];
//   const day = date.getDate().toString().padStart(2, '0');
//   return formatStr.replace('MMM', month).replace('dd', day);
// }
// export async function getPurchaseOrderTrucksRepo(purchaseOrderId: string) {
//   try {
//     // First check if purchase order exists
//     const purchaseOrder = await prisma.purchase_Order.findUnique({
//       where: { id: purchaseOrderId,
//         is_deleted:false
//        },
//       // include: {
//       //   vendor: {
//       //     select: {
//       //       id: true,
//       //       name: true
//       //     }
//       //   },
//       //   material: {
//       //     select: {
//       //       id: true,
//       //       name: true
//       //     }
//       //   }
//       // }
//     });
//     if (!purchaseOrder) {
//       throw new AppError(404, 'ClientError', `Purchase order with ID ${purchaseOrderId} not found`);
//     }
//     // Find all truck registrations related to this purchase order
//     // We can match truck registrations that have the same vendor_id and material_id as the purchase order
//     const truckRegistrations = await prisma.truck_Registration.findMany({
//       where: {
//        po_id: purchaseOrderId,
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
//         },
//         inspector: {
//           select: {
//             id: true,
//             name: true,
//             phone:true,
//             email: true
//           }
//         },
//         quality_inspection: {
//           select: {
//             id: true,
//             starch: true,
//             moisture: true,
//             tfm: true,
//             result: true,
//             remark:true,
//             timestamp: true,
//             inspector: {
//               select: {
//                 id: true,
//                 name: true,
//                 phone:true,
//                 email: true
//               }
//             }
//           }
//         },
//         weighing_inspection: {
//           select: {
//             id: true,
//             gross_weight: true,
//             tare_weight: true,
//             net_weight: true,
//             timestamp: true,
//             inspector: {
//               select: {
//                 id: true,
//                 name: true,
//                 phone:true,
//                 email: true
//               }
//             }
//           }
//         },
//         unloading: {
//           select: {
//             id: true,
//             gross_weight: true,
//             tare_weight: true,
//             net_weight: true,
//             starch: true,
//             moisture: true,
//             tfm: true,
//             challan_no: true,
//             timestamp: true,
//             remarks:true,
//             inspector: {
//               select: {
//                 id: true,
//                 name: true,
//                 phone:true,
//                 email: true
//               }
//             }
//           }
//         }
//       },
//       orderBy: {
//         arrival_time: 'desc'
//       }
//     });
//     return {
//       purchaseOrder,
//       trucks: truckRegistrations
//     };
//   } catch (error) {
//     if (error instanceof AppError) {
//       throw error;
//     }
//     throw new AppError(500, 'ServerError', 'Error fetching trucks for this purchase order', error);
//   }
// }
