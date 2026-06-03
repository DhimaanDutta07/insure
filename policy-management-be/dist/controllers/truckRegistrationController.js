"use strict";
// import { Request, Response } from "express";
// import { asyncTryCatch } from "../utils/errorHandler";
// import { 
//   createTruckRegistrationService, 
//   getTruckRegistrationsService,
//   getTruckRegistrationByIdService,
//   generateTokenService,
//   // getAllActivePOTruck,
//   getTodaysTruckRegistrationsByUserService,
//   getDashboardData,
//   // POAssignBYAccountTeam
// } from "../services/truckRegistrationService";
// import { CreateTruckRegistrationSchema } from "../schemas/truckRegistrationSchema";
// import { uploadFile } from "../utils/s3Storage";
// import { AppError } from "../utils/AppError";
// import { WhatsAppService } from "../utils/notifications/whatsappService";
// // import { sendTruckRegistrationNotification } from "../utils/notifications";
// // Create a new truck registration
// export const createTruckRegistration = asyncTryCatch(async (req: Request, res: Response) => {
//   console.log(req.body);
//   // Handle file upload if there's a document in the request
//   let photoUrl = "";
//   if (req.file) {
//     // Upload the file to S3 and get the URL
//     const uploadResult = await uploadFile(req.file);
//     photoUrl = uploadResult.url;
//   }
//   // Generate a token if not provided
//   let tokenNumber = req.body.token;
//   if (!tokenNumber) {
//     const { tokenNumber: generatedToken } = await generateTokenService();
//     tokenNumber = generatedToken;
//   }
//   // Add the photo URL and token to the request body
//   const truckData = {
//     ...req.body,
//     photo: photoUrl,
//     token: tokenNumber
//   };
//   console.log(truckData);
//   const validatedData = CreateTruckRegistrationSchema.parse(truckData);
//   const truckRegistration = await createTruckRegistrationService(validatedData);
//   // if(!truckRegistration.po_id){
//   //   try {
//   //         const whatsAppService = new WhatsAppService();
//   //         // await sendTruckRegistrationNotification(
//   //         //   whatsAppService, 
//   //         //   "+91", 
//   //         //   truckRegistration.vendor.phone,
//   //         //   truckRegistration.truck.truck_number,
//   //         // );
//   //       } catch (error) {
//   //         // Log notification error but don't fail the request
//   //         console.error('Failed to send purchase order notification:', error);
//   //       }
//   // }
//   res.status(201).json({
//     message: "Truck registration created successfully",
//     data: truckRegistration
//   });
// });
// // Generate a new token number
// export const generateToken = asyncTryCatch(async (req: Request, res: Response) => {
//   const { tokenNumber } = await generateTokenService();
//   res.status(200).json({
//     message: "Token generated successfully",
//     data: { token: tokenNumber }
//   });
// });
// // Get all truck registrations with optional filtering
// export const getTruckRegistrations = asyncTryCatch(async (req: Request, res: Response) => {
//   // Extract query parameters for filtering
//   const { 
//     status, 
//     // vendorId, 
//     truckNumber,
//     startDate,
//     endDate,
//     page = '1',
//     limit = '10'
//   } = req.query;
//   const filters = {
//     status: status as string | undefined,
//     // vendorId: vendorId as string | undefined,
//     truckNumber: truckNumber as string | undefined,
//     startDate: startDate ? new Date(startDate as string) : undefined,
//     endDate: endDate ? new Date(endDate as string) : undefined,
//     page: parseInt(page as string, 10),
//     limit: parseInt(limit as string, 10)
//   };
//   const { data, pagination } = await getTruckRegistrationsService(filters);
//   res.status(200).json({
//     message: "Truck registrations retrieved successfully",
//     data,
//     pagination
//   });
// });
// // Get a specific truck registration by ID
// export const getTruckRegistrationById = asyncTryCatch(async (req: Request, res: Response) => {
//   const id = req.params.id as string;
//   const truckRegistration = await getTruckRegistrationByIdService(id);
//   res.status(200).json({
//     message: "Truck registration retrieved successfully",
//     data: truckRegistration
//   });
// });
// // export const getAllTruckHavingActivePO = asyncTryCatch(async (req: Request, res: Response) => {
// //   // const trucks = await getAllActivePOTruck();
// //   res.status(200).json({
// //     status: 'success',
// //     data: {
// //       trucks
// //     }
// //   });
// // })
// export const getTodaysTruckRegistrationsByUser = asyncTryCatch(async (req: Request, res: Response) => {
//   const userId = req.params.userId as string; // Get userId from route params
//   if (!userId) {
//     throw new AppError(400, 'ClientError', 'User ID is required');
//   }
//   const registrations = await getTodaysTruckRegistrationsByUserService(userId);
//   res.status(200).json({
//     message: "Today's truck registrations retrieved successfully",
//     data: registrations
//   });
// });
// export const DashboardDetails = asyncTryCatch(async(req: Request, res: Response) => {
//   const timePeriod = req.params.timePeriod as string;
//   if (!timePeriod) {
//     throw new AppError(400, 'ClientError', 'Time period is required');
//   }
//   const result = await getDashboardData(timePeriod);
//   res.status(200).json({
//     message: "Dashboard data retrieved successfully",
//     data: result
//   });
// });
// // export const AssignPO = asyncTryCatch(async(req: Request, res: Response) => {
// //   const id = req.params.id as string;
// //   const { po_id } = req.body;
// //   if (!id || !po_id) {
// //     throw new AppError(400, 'ClientError', 'Truck ID and PO ID are required');
// //   }
// //   const result = await POAssignBYAccountTeam(id, po_id);
// //   res.status(200).json({
// //     message: "PO assigned to truck successfully",
// //     data: result
// //   });
// // });
