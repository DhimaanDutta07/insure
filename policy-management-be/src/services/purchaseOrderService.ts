// import { AppError } from '../utils/AppError';
// import * as purchaseOrderRepo from '../repositories/PurchaseOrderRepository';
// // import { vendorRepository } from '../repositories/vendorRepository';
// import { getRawMaterialByIdRepo } from '../repositories/materialRepository';
// import { purchaseOrderCreateSchema, purchaseOrderFilterSchema, purchaseOrderSchema, purchaseOrderUpdateSchema } from '../schemas/purchaseOrderSchema';
// import { z } from 'zod';
// import { deleteFile } from '../utils/s3Storage';

// export async function getAllPurchaseOrders(filters: z.infer<typeof purchaseOrderFilterSchema>) {
//   const { page = 1, limit = 10, ...otherFilters } = filters;
  
//   const [purchaseOrders, total] = await purchaseOrderRepo.findAllPurchaseOrders(
//     page, 
//     limit, 
//     otherFilters
//   );
  
//   return {
//     purchaseOrders,
//     total,
//     page,
//     limit
//   };
// }

// export async function searchPurchaseOrders(filters: z.infer<typeof purchaseOrderFilterSchema>) {
//   const { page = 1, limit = 10, ...otherFilters } = filters;
  
//   const [purchaseOrders, total] = await purchaseOrderRepo.searchPurchaseOrders(
//     page, 
//     limit, 
//     otherFilters
//   );
  
//   return {
//     purchaseOrders,
//     total,
//     page,
//     limit
//   };
// }

// export async function getPurchaseOrders(filters: z.infer<typeof purchaseOrderFilterSchema>) {
//   const { page = 1, limit = 10, ...otherFilters } = filters;
  
//   const [purchaseOrders, total] = await purchaseOrderRepo.findPurchaseOrders(
//     page, 
//     limit, 
//     otherFilters
//   );
  
//   return {
//     purchaseOrders,
//     total,
//     page,
//     limit
//   };
// }

// export async function getPurchaseOrderById(id: string) {
//   const order = await purchaseOrderRepo.findPurchaseOrderById(id);
//   if (!order) {
//     throw new AppError(404, 'ClientError', 'Purchase order not found');
//   }
//   return order;
// }

// export async function createPurchaseOrder(data: z.infer<typeof purchaseOrderCreateSchema>, 
//   userId: string) {
//     // const vendor = await vendorRepository.findById(data.vendor_id);
//     // if (!vendor) {
//     //   throw new AppError(400, 'ClientError', 'Vendor not found');
//     // }
  
//     // Validate material exists
//     const material = await getRawMaterialByIdRepo(data.material_id);
//     if (!material) {
//       throw new AppError(400, 'ClientError', 'Material not found');
//     }
  
//     // Create with proper defaults for the missing fields
//     const now = new Date();
//     const purchaseOrderData = {
//       ...data,
//       // vendor_id: data.vendor_id,
//       material_id: data.material_id,
//       created_by_id: userId,
//       received_quantity: null, // Optional field
//       status: data.status || 'Pending', // Default status
//       issued_at: data.issued_at || now,
//       created_at: now,
//       updated_at: now,
//       PO_number: data.po_number, // Include PO_number from input data
//     };
  
//     // Create purchase order using repository method
//     return await purchaseOrderRepo.createPurchaseOrder(purchaseOrderData);
//   }

//   export async function updatePurchaseOrder(id: string, data: Partial<z.infer<typeof purchaseOrderUpdateSchema>>) {
//     // Check if purchase order exists
//     const existingOrder = await purchaseOrderRepo.findPurchaseOrderById(id);
//     if (!existingOrder) {
//       throw new AppError(404, 'ClientError', 'Purchase order not found');
//     }
  
//     // // Validate vendor if changing
//     // if (data.vendor_id) {
//     //   const vendor = await vendorRepository.findById(data.vendor_id);
//     //   if (!vendor) {
//     //     throw new AppError(400, 'ClientError', 'Vendor not found');
//     //   }
//     // }
  
//     // Validate material if changing
//     if (data.material_id) {
//       const material = await getRawMaterialByIdRepo(data.material_id);
//       if (!material) {
//         throw new AppError(400, 'ClientError', 'Material not found');
//       }
//     }
  
//     // Validate received_quantity against quantity if both are present
//     if (data.received_quantity && (data.quantity || existingOrder.quantity)) {
//       const maxQuantity = Number(data.quantity || existingOrder.quantity);
//       if (Number(data.received_quantity) > maxQuantity) {
//         throw new AppError(400, 'ClientError', 'Received quantity cannot exceed total quantity');
//       }
//     }
  
//     // Handle document management
//     // If we're updating the document, delete the old one first
//     if (data.document_path && existingOrder.document_path && data.document_path !== existingOrder.document_path) {
//       try {
//         await deleteFile(existingOrder.document_path);
//       } catch (error) {
//         console.error("Error deleting old document:", error);
//         // Continue with update even if delete fails
//       }
//     }
  
//     // Call repository to update the purchase order
//     return purchaseOrderRepo.updatePurchaseOrder(id, data);
//   }

// export async function deletePurchaseOrder(id: string) {
//   const existingOrder = await purchaseOrderRepo.findPurchaseOrderById(id);
//   if (!existingOrder) {
//     throw new AppError(404, 'ClientError', 'Purchase order not found');
//   }

//   // Delete associated document if exists
//   if (existingOrder.document_path) {
//     try {
//       await deleteFile(existingOrder.document_path);
//     } catch (error) {
//       console.error("Error deleting document:", error);
//       // Continue with deletion even if document delete fails
//     }
//   }

//   return purchaseOrderRepo.deletePurchaseOrder(id);
// }

// export async function getOrderAnalyticsService(fromDate: Date, toDate: Date) {
//   try {
//     return await purchaseOrderRepo.getOrderAnalyticsRepo(fromDate, toDate);
//   } catch (error) {
//     if (error instanceof AppError) {
//       throw error;
//     }
//     throw new AppError(500, 'ServerError', 'Failed to retrieve order analytics', error);
//   }
// }

// export async function getPurchaseOrderTrucksService(purchaseOrderId: string) {
//   try {
//     return await purchaseOrderRepo.getPurchaseOrderTrucksRepo(purchaseOrderId);
//   } catch (error) {
//     if (error instanceof AppError) {
//       throw error;
//     }
//     throw new AppError(500, 'ServerError', 'Failed to fetch purchase order trucks', error);
//   }
// }