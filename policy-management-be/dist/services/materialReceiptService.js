"use strict";
// // services/materialReceiptService.ts
// import { MaterialReceipt } from '@prisma/client';
// import {
//   generateTokenNumber,
//   createMaterialReceipt,
//   getAllMaterialReceipts,
//   getMaterialReceiptById,
//   updateMaterialReceipt,
//   deleteMaterialReceipt,
//   MaterialReceiptData,
//   getMaterialReceiptsByTimePeriod,
//   MaterialReceiptResponse,
// } from '../repositories/materialReceiptRepository copy';
// import { uploadFile } from '../utils/fileStorage';
// export const addMaterialReceipt = async (
//   data: Omit<MaterialReceiptData, 'images'> & {
//     images?: Express.Multer.File[];
//   }
// ): Promise<MaterialReceipt> => {
//   const { images, ...rest } = data;
//   if (!images || images.length === 0) {
//     throw new Error('At least one image is required');
//   }
//   // Upload all images and get URLs
//   const imageUrls = await Promise.all(
//     images.map((file) => uploadFile(file))
//   );
//   // Create the receipt with image URLs stored in MaterialReceiptImage
//   return createMaterialReceipt({
//     ...rest,
//     images: imageUrls.map((img) => img.url),
//   });
// };
// export const generateToken = async (): Promise<string> => {
//   return generateTokenNumber();
// };
// // export const addMaterialReceipt = async (receiptData: MaterialReceiptData): Promise<MaterialReceipt> => {
// //   return createMaterialReceipt(receiptData);
// // };
// export const fetchAllMaterialReceipts = async (): Promise<MaterialReceipt[]> => {
//   return getAllMaterialReceipts();
// };
// export const fetchMaterialReceiptById = async (id: string): Promise<MaterialReceipt | null> => {
//   return getMaterialReceiptById(id);
// };
// export const modifyMaterialReceipt = async (
//   id: string,
//   data: Partial<Omit<MaterialReceiptData, 'images'>> & {
//     images?: Express.Multer.File[];
//   }
// ): Promise<MaterialReceipt> => {
//   const { images, ...rest } = data;
//   const existingReceipt = await getMaterialReceiptById(id);
//   if (!existingReceipt) throw new Error('MaterialReceipt not found');
//   const receiptData: Partial<MaterialReceiptData> = { ...rest };
//   if (images && images.length > 0) {
//     // Upload new images
//     const imageUrls = await Promise.all(
//       images.map((file) => uploadFile(file))
//     );
//     receiptData.images = imageUrls.map((img) => img.url); // Replace existing images
//   }
//   return updateMaterialReceipt(id, receiptData);
// };
// export const removeMaterialReceipt = async (id: string): Promise<MaterialReceipt> => {
//   const receipt = await getMaterialReceiptById(id);
//   if (!receipt) throw new Error('MaterialReceipt not found');
//   // Images will be deleted automatically via Prisma's onDelete: Cascade
//   return deleteMaterialReceipt(id);
// };
// export const getMaterialReceiptsByTimePeriodService = async (
//   timePeriod: string | { start: string; end: string },
//   siteId?: string
// ): Promise<MaterialReceiptResponse[]> => {
//   return getMaterialReceiptsByTimePeriod(timePeriod, siteId);
// };
