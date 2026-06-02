// // materialUnloadingController.ts
// import { Request, Response } from "express";
// import { AppError } from "../utils/AppError";
// import { asyncTryCatch } from "../utils/errorHandler";
// import {
//   createMaterialUnloadingService,
//   getTodaysMaterialUnloadingsByUserService,
// } from "../services/materialUnloadingService";
// import { CreateMaterialUnloadingSchema } from "../schemas/materialUnloadingSchema";
// import { WhatsAppService } from "../utils/notifications/whatsappService";
// // import { sendDeliveryConfirmationNotification } from "../utils/notifications";
// import { getUserWithAccountRole } from "../repositories/userRepository";

// export const createMaterialUnloading = asyncTryCatch(
//   async (req: Request, res: Response) => {
//     // Validate request body against schema
//     const validationResult = CreateMaterialUnloadingSchema.safeParse(req.body);

//     console.log(validationResult.data);

//     if (!validationResult.success) {
//       throw new AppError(
//         400,
//         "ClientError",
//         "Invalid unloading data",
//         validationResult.error
//       );
//     }

//     const unloadingData = validationResult.data;

//     // Create the material unloading
//     const newUnloading = await createMaterialUnloadingService(unloadingData);

//     // if (newUnloading.purchase_order) {
//     //   try {
//     //     const whatsAppService = new WhatsAppService();

//     //     // await sendDeliveryConfirmationNotification(
//     //     //   whatsAppService,
//     //     //   "+91",
//     //     //   newUnloading.purchase_order.created_by.phone,
//     //     //   newUnloading.truck_registration.truck.truck_number,
//     //     //   newUnloading.net_weight,
//     //     //   newUnloading.gross_weight,
//     //     //   newUnloading.tare_weight,
//     //     //   newUnloading.starch,
//     //     //   newUnloading.tfm,
//     //     //   newUnloading.moisture,
//     //     //   newUnloading.remarks
//     //     // );
//     //   } catch (error) {
//     //     // Log notification error but don't fail the request
//     //     console.error("Failed to send purchase order notification:", error);
//     //   }
//     // }

//     res.status(201).json({
//       message: "Material unloading created successfully",
//       data: newUnloading,
//     });
//   }
// );

// export const getTodaysMaterialUnloadingsByUser = asyncTryCatch(
//   async (req: Request, res: Response) => {
//     const userId = req.params.userId as string; // Get userId from route params

//     if (!userId) {
//       throw new AppError(400, "ClientError", "User ID is required");
//     }

//     const unloadings = await getTodaysMaterialUnloadingsByUserService(userId);

//     res.status(200).json({
//       message: "Today's material unloadings retrieved successfully",
//       data: unloadings,
//     });
//   }
// );
