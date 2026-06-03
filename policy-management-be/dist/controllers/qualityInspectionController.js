"use strict";
// //qualityInspectionController.ts
// import { Request, Response } from "express";
// import { AppError } from "../utils/AppError";
// import { asyncTryCatch } from "../utils/errorHandler";
// import {
//   createQualityInspectionService,
//   getTodaysQualityInspectionsByUserService,
// } from "../services/qualityInspectionService";
// import { CreateQualityInspectionSchema } from "../schemas/qualityInspectionSchema";
// import { WhatsAppService } from "../utils/notifications/whatsappService";
// // import {
// //   sendQualityApprovedNotification,
// //   sendQualityRejectedNotification,
// // } from "../utils/notifications";
// export const createQualityInspection = asyncTryCatch(
//   async (req: Request, res: Response) => {
//     // Validate request body against schema
//     const validationResult = CreateQualityInspectionSchema.safeParse(req.body);
//     if (!validationResult.success) {
//       throw new AppError(
//         400,
//         "ClientError",
//         "Invalid inspection data",
//         validationResult.error
//       );
//     }
//     const inspectionData = validationResult.data;
//     // Create the quality inspection
//     const newInspection = await createQualityInspectionService(inspectionData);
//     if (newInspection && newInspection.result === "Accepted") {
//       try {
//         const whatsAppService = new WhatsAppService();
//         // console.log(purchaseOrder.document_name, purchaseOrder.document_path);
//         // Pass the complete purchase order object to the notification service
//         // await sendQualityApprovedNotification(
//         //   whatsAppService,
//         //   "+91",
//         //   // newInspection.truck_registration.vendor.phone,
//         //   // newInspection.truck_registration.truck.truck_number,
//         //   newInspection.starch,
//         //   newInspection.moisture,
//         //   newInspection.tfm,
//         //   newInspection.remark
//         // );
//       } catch (error) {
//         // Log notification error but don't fail the request
//         console.error("Failed to send purchase order notification:", error);
//       }
//     }
//     if (newInspection && newInspection.result === "Rejected") {
//       try {
//         const whatsAppService = new WhatsAppService();
//         // console.log(purchaseOrder.document_name, purchaseOrder.document_path);
//         // Pass the complete purchase order object to the notification service
//         // await sendQualityRejectedNotification(
//         //   whatsAppService,
//         //   "+91",
//         //   newInspection.truck_registration.vendor.phone,
//         //   newInspection.truck_registration.truck.truck_number,
//         //   newInspection.starch,
//         //   newInspection.moisture,
//         //   newInspection.tfm,
//         //   newInspection.remark
//         // );
//       } catch (error) {
//         // Log notification error but don't fail the request
//         console.error("Failed to send purchase order notification:", error);
//       }
//     }
//     res.status(201).json({
//       message: "Quality inspection created successfully",
//       data: newInspection,
//     });
//   }
// );
// export const getTodaysQualityInspectionsByUser = asyncTryCatch(
//   async (req: Request, res: Response) => {
//     const userId = req.params.userId as string; // Get userId from route params
//     if (!userId) {
//       throw new AppError(400, "ClientError", "User ID is required");
//     }
//     const inspections = await getTodaysQualityInspectionsByUserService(userId);
//     res.status(200).json({
//       message: "Today's quality inspections retrieved successfully",
//       data: inspections,
//     });
//   }
// );
