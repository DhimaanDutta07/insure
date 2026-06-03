"use strict";
// import { Request, Response } from 'express';
// import {
//   generateToken,
//   addMaterialReceipt,
//   fetchAllMaterialReceipts,
//   fetchMaterialReceiptById,
//   modifyMaterialReceipt,
//   removeMaterialReceipt,
//   getMaterialReceiptsByTimePeriodService,
// } from '../services/materialReceiptService';
// import jwt from 'jsonwebtoken';
// import { getPublicUrl, IMAGES_DIR, uploadFile, getFilePath } from '../utils/fileStorage';
// import fs from 'fs';
// import { promisify } from 'util';
// import { pipeline } from 'stream';
// import { mkdir } from 'fs/promises';
// import { v4 as uuidv4 } from 'uuid';
// // import { Site } from '@prisma/client';
// import { fetchUserSites } from '../services/siteService';
// import prisma from '../utils/prismaClient';
// import { config } from 'dotenv';
// import { MaterialReceiptResponse } from '../repositories/materialReceiptRepository copy';
// import { 
//   createMaterialReceiptSchema,
//   updateMaterialReceiptSchema,
//   getMaterialReceiptSchema,
//   deleteMaterialReceiptSchema,
//   getMaterialReceiptsByTimePeriodSchema
// } from '../schemas/materialReceiptSchema copy';
// import { asyncTryCatch } from '../utils/errorHandler';
// // Load environment variables
// config();
// const JWT_SECRET = process.env.JWT_SECRET;
// if (!JWT_SECRET) {
//   throw new Error('JWT_SECRET is not defined in environment variables');
// }
// const pipelineAsync = promisify(pipeline);
// export const getToken = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
//   const token = await generateToken();
//   res.status(200).json({ inward_number: token });
// });
// // Helper function to standardize image URLs
// function standardizeImageUrl(url: string): string {
//   // If the URL has a timestamp format (from multer), convert it to our standard format
//   if (url.includes('/uploads/') && /\d{13}-[^\/]+$/.test(url)) {
//     const filename = url.split('/').pop();
//     if (!filename) return url;
//     // Extract extension
//     const ext = filename.split('.').pop()?.toLowerCase();
//     // Generate a UUID-based filename like our standard ones
//     const newFilename = `${uuidv4()}.${ext}`;
//     return `/api/files/material-receipts/images/${newFilename}`;
//   }
//   return url;
// }
// // Helper function to clean image URLs (removing duplicated /api and ensuring no .gz extension in browser URL)
// export function getCleanImageUrl(url: string): string {
//   // Standardize URL format if needed
//   const standardUrl = standardizeImageUrl(url);
//   // Get the full URL through the utility function
//   let fullUrl = getPublicUrl(standardUrl);
//   // Fix any double slashes that might occur
//   fullUrl = fullUrl.replace(/([^:])\/+/g, '$1/');
//   return fullUrl;
// }
// export const createMaterialReceipt = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
//   // Validate request data
//   const validatedData = createMaterialReceiptSchema.parse({
//     body: req.body,
//     files: req.files,
//     headers: req.headers
//   });
//   const { item_group_id, item_name_id, remark, inward_number: token_number, site_id } = validatedData.body;
//   const files = validatedData.files as Express.Multer.File[];
//   const authHeader = validatedData.headers.authorization;
//   const token = authHeader.split(' ')[1];
//   let user_Id: string;
//   try {
//     // Decode the token to get the user ID
//     const decoded = jwt.verify(token, JWT_SECRET) as { user_id: string };
//     user_Id = decoded.user_id;
//     if (!user_Id) {
//       res.status(401).json({ error: 'Unauthorized: Invalid token payload' });
//       return;
//     }
//     // Verify that the user has access to the specified site
//     if (site_id) {
//       const userSites = await fetchUserSites(user_Id);
//       const hasAccessToSite = userSites.some((site: Site) => site.id === site_id);
//       if (!hasAccessToSite) {
//         res.status(403).json({ error: 'User does not have access to the specified site' });
//         return;
//       }
//     }
//   } catch (error) {
//     res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
//     return;
//   }
//   // Check for required token_number
//   if (!token_number) {
//     res.status(400).json({ error: 'Token number is required' });
//     return;
//   }
//   try {
//     // Upload files and get URLs
//     const uploadedFiles = files && files.length > 0
//       ? await Promise.all(files.map(file => uploadFile(file)))
//       : [];
//     // Get the public URLs for frontend access
//     const imageDataPromises = uploadedFiles.map(async (file) => {
//       try {
//         const filePath = file.storagePath;
//         if (!fs.existsSync(filePath)) {
//           return {
//             url: file.url,
//             directUrl: getCleanImageUrl(file.url),
//             isPlaceholder: true
//           };
//         }
//         const buffer = fs.readFileSync(filePath);
//         const base64Content = buffer.toString('base64');
//         const mimeType = getMimeType(file.fileName);
//         return {
//           url: file.url,
//           directUrl: getCleanImageUrl(file.url),
//           isPlaceholder: false
//         };
//       } catch (error) {
//         return {
//           url: file.url,
//           directUrl: getCleanImageUrl(file.url),
//           isPlaceholder: true
//         };
//       }
//     });
//     const imagesWithContent = await Promise.all(imageDataPromises);
//     // Create material receipt with nested image records
//     const materialReceipt = await prisma.materialReceipt.create({
//       data: {
//         item_group_id: item_group_id || null,
//         item_name_id: item_name_id || null,
//         remark: remark || null,
//         user_id: user_Id,
//         token_number,
//         site_id: site_id || null,
//         images: {
//           create: uploadedFiles.map(file => ({
//             url: file.url,
//           })),
//         },
//       },
//       include: { images: true },
//     });
//     // Combine DB images with base64 content
//     const responseReceipt = {
//       ...materialReceipt,
//       images: materialReceipt.images.map((img, index) => ({
//         ...img,
//         directUrl: imagesWithContent[index]?.directUrl || getCleanImageUrl(img.url),
//         isPlaceholder: imagesWithContent[index]?.isPlaceholder || true
//       })),
//     };
//     res.status(201).json(responseReceipt);
//   } catch (error) {
//     if (files && files.length > 0) {
//       files.forEach(file => {
//         try {
//           if (fs.existsSync(file.path)) {
//             fs.unlinkSync(file.path);
//           }
//         } catch (cleanupError) {
//           console.error('Error cleaning up temp file:', cleanupError);
//         }
//       });
//     }
//     throw error;
//   }
// });
// // Helper function to determine MIME type
// function getMimeType(filename: string): string {
//   const ext = filename.split('.').pop()?.toLowerCase();
//   switch (ext) {
//     case 'jpg':
//     case 'jpeg':
//       return 'image/jpeg';
//     case 'png':
//       return 'image/png';
//     case 'gif':
//       return 'image/gif';
//     default:
//       return 'application/octet-stream';
//   }
// }
// export const getAllMaterialReceipts = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
//   const receipts = await prisma.materialReceipt.findMany({
//     where: { is_deleted: false },
//     include: { 
//       images: true,
//       itemGroup: { select: { id: true, name: true } },
//       itemName: { select: { id: true, name: true } },
//       user: { select: { id: true, name: true } },
//       site: { select: { id: true, name: true } },
//     },
//   });
//   // Add directUrl to each image
//   const receiptsWithImages = receipts.map(receipt => ({
//     ...receipt,
//     images: receipt.images.map(image => ({
//       ...image,
//       directUrl: getCleanImageUrl(image.url),
//       isPlaceholder: false
//     }))
//   }));
//   res.status(200).json(receiptsWithImages);
// });
// export const getMaterialReceipt = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
//   const { params } = getMaterialReceiptSchema.parse({ params: req.params });
//   const receipt = await fetchMaterialReceiptById(params.id);
//   if (!receipt) {
//     res.status(404).json({ error: 'Material receipt not found' });
//     return;
//   }
//   res.status(200).json(receipt);
// });
// export const updateMaterialReceipt = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
//   const validatedData = updateMaterialReceiptSchema.parse({
//     params: req.params,
//     body: req.body,
//     files: req.files
//   });
//   const { id } = validatedData.params;
//   const { item_group_id, item_name_id, remark, user_id, token_number, site_id } = validatedData.body;
//   const files = validatedData.files as unknown as Express.Multer.File[];
//   const updatedReceipt = await modifyMaterialReceipt(id, {
//     item_group_id: item_group_id ?? undefined,
//     item_name_id: item_name_id ?? undefined, 
//     remark: remark ?? undefined,
//     user_id: user_id ?? undefined,
//     token_number: token_number ?? undefined,
//     site_id: site_id ?? undefined,
//     images: files
//   });
//   res.status(200).json(updatedReceipt);
// });
// export const deleteMaterialReceipt = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
//   const { params } = deleteMaterialReceiptSchema.parse({ params: req.params });
//   await removeMaterialReceipt(params.id);
//   res.status(204).end();
// });
// export const getMaterialReceiptsByTimePeriod = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
//   const validatedData = getMaterialReceiptsByTimePeriodSchema.parse({
//     params: req.params,
//     query: req.query
//   });
//   const { timePeriod } = validatedData.params;
//   const { siteId, start, end } = validatedData.query;
//   // Handle custom date range
//   if (timePeriod === 'custom' && start && end) {
//     const receipts = await getMaterialReceiptsByTimePeriodService(
//       { start: start as string, end: end as string },
//       siteId as string
//     );
//     res.status(200).json(receipts);
//     return;
//   }
//   // Handle predefined time periods
//   const receipts = await getMaterialReceiptsByTimePeriodService(timePeriod, siteId as string);
//   res.status(200).json(receipts);
// });
