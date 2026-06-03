"use strict";
// // src/controllers/purchaseOrderController.ts
// import { Request, Response } from 'express';
// import { asyncTryCatch } from '../utils/errorHandler';
// import * as purchaseOrderService from '../services/purchaseOrderService';
// import { purchaseOrderCreateSchema, purchaseOrderFilterSchema, purchaseOrderIdParamSchema, purchaseOrderUpdateSchema } from '../schemas/purchaseOrderSchema';
// import { uploadFile, deleteFile, getFileUrl } from '../utils/s3Storage';
// import { AppError } from '../utils/AppError';
// import { WhatsAppService } from '../utils/notifications/whatsappService';
// // import { sendPOCreationNotification } from '../utils/notifications';
// interface RequestWithUser extends Request {
//   created_by_id?: string;
// }
// export const getAllPurchaseOrders = asyncTryCatch(async (req: Request, res: Response) => {
//   const filters = purchaseOrderFilterSchema.parse(req.query);
//   const { purchaseOrders, total, page, limit } = await purchaseOrderService.getAllPurchaseOrders(filters);
//   res.json({
//     success: true,
//     data: purchaseOrders,
//     pagination: {
//       total,
//       page,
//       limit,
//       pages: Math.ceil(Number(total) / Number(limit))
//     }
//   });
// });
// export const searchPurchaseOrders = asyncTryCatch(async (req: Request, res: Response) => {
//   // console.log('This is working', req.query);
//   const filters = purchaseOrderFilterSchema.parse(req.query);
//   const { purchaseOrders, total, page, limit } = await purchaseOrderService.searchPurchaseOrders(filters);
//   res.json({
//     success: true,
//     data: purchaseOrders,
//     pagination: {
//       total,
//       page,
//       limit,
//       pages: Math.ceil(Number(total) / Number(limit))
//     }
//   });
// });
// export const getPurchaseOrders = asyncTryCatch(async (req: Request, res: Response) => {
//   const filters = purchaseOrderFilterSchema.parse(req.query);
//   const { purchaseOrders, total, page, limit } = await purchaseOrderService.getPurchaseOrders(filters);
//   res.json({
//     success: true,
//     data: purchaseOrders,
//     pagination: {
//       total,
//       page,
//       limit,
//       pages: Math.ceil(Number(total) / Number(limit))
//     }
//   });
// });
// export const getPurchaseOrder = asyncTryCatch(async (req: Request, res: Response) => {
//   // console.log("This is working", req.params.id as string)
//   const purchaseOrder = await purchaseOrderService.getPurchaseOrderById(req.params.id as string);
//   res.json({
//     success: true,
//     data: purchaseOrder,
//   });
// });
// export const createPurchaseOrder = asyncTryCatch(async (req: RequestWithUser, res: Response) => {
//   let documentData = {};
//   console.log(req.body);
//   // Handle file upload if present
//   if (req.file) {
//     const fileData = await uploadFile(req.file);
//     documentData = {
//       document_path: fileData.url,
//       document_name: req.file.originalname // Preserve original filename
//     };
//   }
//   const data = purchaseOrderCreateSchema.parse({
//     ...req.body,
//     quantity: Number(req.body.quantity),
//     amount: Number(req.body.amount),
//     expiry_date: new Date(req.body.expiry_date),
//     ...documentData
//   });
//     const userId = req.body.created_by_id;
//   if (!userId) {
//     throw new AppError(401, 'ClientError', 'User ID is required');
//   }
//   const purchaseOrder = await purchaseOrderService.createPurchaseOrder(data, userId);
//   if (purchaseOrder) {
//     try {
//       const whatsAppService = new WhatsAppService();
//       // await sendPOCreationNotification(
//       //   whatsAppService, 
//       //   "+91", 
//       //   // purchaseOrder.vendor.phone,
//       //   purchaseOrder.document_path,
//       //   purchaseOrder.document_name 
//       // );
//     } catch (error) {
//       // Log notification error but don't fail the request
//       console.error('Failed to send purchase order notification:', error);
//     }
//   }
//   res.status(201).json({
//     success: true,
//     data: purchaseOrder,
//     message: 'Purchase order created successfully',
//   });
// });
// export const updatePurchaseOrder = asyncTryCatch(async (req: Request, res: Response) => {
//   // Get the purchase order ID from params
//   const { id } = purchaseOrderIdParamSchema.parse(req.params);
//   // Initialize documentData as an empty object
//   let documentData = {};
//   // Handle file upload if present
//   if (req.file) {
//     const fileData = await uploadFile(req.file);
//     documentData = {
//       document_path: fileData.url,
//       document_name: req.file.originalname // Preserve original filename
//     };
//   }
//   // Parse and transform the request data
//   // Convert string dates to Date objects where applicable
//   const data = purchaseOrderUpdateSchema.parse({
//     ...req.body,
//     quantity: Number(req.body.quantity),
//     amount: Number(req.body.amount),
//     ...(req.body.expiry_date && { expiry_date: new Date(req.body.expiry_date) }),
//     ...(req.body.issued_at && { issued_at: new Date(req.body.issued_at) }),
//     // Include document data if file was uploaded
//     ...documentData
//   });
//   // Update the purchase order
//   const updatedOrder = await purchaseOrderService.updatePurchaseOrder(id, data);
//   // Send response
//   res.json({
//     success: true,
//     data: updatedOrder,
//     message: 'Purchase order updated successfully',
//   });
// });
// export const deletePurchaseOrder = asyncTryCatch(async (req: Request, res: Response) => {
//   await purchaseOrderService.deletePurchaseOrder(req.params.id as string);
//   res.json({
//     success: true,
//     message: 'Purchase order deleted successfully',
//   });
// });
// export const downloadPurchaseOrder = asyncTryCatch(async (req: Request, res: Response) => {
//   const purchaseOrder = await purchaseOrderService.getPurchaseOrderById(req.params.id as string);
//   if (!purchaseOrder.document_path) {
//     return res.status(404).json({
//       success: false,
//       message: 'No document available for this purchase order',
//     });
//   }
//   // Redirect to the S3 URL
//   res.json(purchaseOrder.document_path);
// });
// export const getOrderAnalytics = asyncTryCatch(async (req: Request, res: Response) => {
//   const { from, to } = req.query;
//   // Validate date parameters
//   if (!from || !to) {
//     throw new AppError(400, 'ClientError', 'Date range parameters (from, to) are required');
//   }
//   // Parse dates and validate
//   const fromDate = new Date(from as string);
//   const toDate = new Date(to as string);
//   if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
//     throw new AppError(400, 'ClientError', 'Invalid date format. Use YYYY-MM-DD format');
//   }
//   // Set time to start of day for fromDate and end of day for toDate
//   fromDate.setHours(0, 0, 0, 0);
//   toDate.setHours(23, 59, 59, 999);
//   const analytics = await purchaseOrderService.getOrderAnalyticsService(fromDate, toDate);
//   res.status(200).json({
//     message: "Order analytics retrieved successfully",
//     data: analytics
//   });
// });
// export const getPurchaseOrderTrucks = asyncTryCatch(async (req: Request, res: Response) => {
//   const id = req.params.id as string;
//   // Validate the purchase order ID
//   const validation = purchaseOrderIdParamSchema.safeParse({ id });
//   if (!validation.success) {
//     throw new AppError(400, 'ClientError', 'Invalid purchase order ID', validation.error);
//   }
//   const result = await purchaseOrderService.getPurchaseOrderTrucksService(id);
//   res.status(200).json({
//     message: "Purchase order trucks retrieved successfully",
//     data: result
//   });
// });
