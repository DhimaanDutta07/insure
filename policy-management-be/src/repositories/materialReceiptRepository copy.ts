// // repositories/materialReceiptRepository.ts
// import { PrismaClient, MaterialReceipt } from '@prisma/client';
// import { AppError } from '../utils/AppError';
// import { getCleanImageUrl } from '../controllers/materialReceiptController';

// const prisma = new PrismaClient();

// export interface MaterialReceiptData {
//   item_group_id?: string;
//   item_name_id?: string;
//   remark?: string;
//   images: string[]; // Array of URLs to be stored in MaterialReceiptImage
//   user_id: string;
//   token_number: string;
//   site_id?: string;
// }

// export interface MaterialReceiptResponse {
//   id: string;
//   inward_number: string;
//   site: { id: string; name: string } | null;
//   itemGroup: { id: string; name: string } | null;
//   itemName: { id: string; name: string } | null;
//   created_at: Date;
//   user: { id: string; name: string };
//   images: { 
//     id: string; 
//     url: string;
//     directUrl: string;
//     isPlaceholder: boolean;
//     material_receipt_id: string;
//   }[];
//   remark: string | null;
//   is_deleted: boolean;
// }

// export const generateTokenNumber = async (): Promise<string> => {
//   try {
//     const latestReceipt = await prisma.materialReceipt.findFirst({
//       orderBy: { token_number: 'desc' },
//       where: { token_number: { not: null } },
//       select: { token_number: true },
//     });

//     let tokenNumber: string;
//     if (latestReceipt && latestReceipt.token_number) {
//       const lastNumber = parseInt(latestReceipt.token_number.replace(/[^0-9]/g, '') || '0');
//       tokenNumber = `${(lastNumber + 1).toString().padStart(4, '0')}`;
//     } else {
//       tokenNumber = '0001';
//     }

//     return tokenNumber;
//   } catch (err) {
//     throw new Error(`Error generating token number: ${(err as Error).message}`);
//   }
// };

// export const createMaterialReceipt = async (data: MaterialReceiptData): Promise<MaterialReceipt> => {
//   const { images, ...receiptData } = data;
//   return prisma.materialReceipt.create({
//     data: {
//       ...receiptData,
//       images: {
//         create: images.map((url) => ({ url })),
//       },
//     },
//     include: {
//       itemGroup: { select: { id: true, name: true } },
//       itemName: { select: { id: true, name: true } },
//       user: { select: { id: true, name: true } },
//       site: { select: { id: true, name: true } },
//       images: true,
//     },
//   });
// };

// export const getAllMaterialReceipts = async (): Promise<MaterialReceipt[]> => {
//   return prisma.materialReceipt.findMany({
//     where: { is_deleted: false },
//     include: {
//       itemGroup: { select: { id: true, name: true } },
//       itemName: { select: { id: true, name: true } },
//       user: { select: { id: true, name: true } },
//       site: { select: { id: true, name: true } },
//       images: true,
//     },
//   });
// };

// export const getMaterialReceiptById = async (id: string): Promise<MaterialReceipt | null> => {
//   return prisma.materialReceipt.findUnique({
//     where: { id, is_deleted: false },
//     include: {
//       itemGroup: { select: { id: true, name: true } },
//       itemName: { select: { id: true, name: true } },
//       user: { select: { id: true, name: true } },
//       site: { select: { id: true, name: true } },
//       images: true,
//     },
//   });
// };

// export const updateMaterialReceipt = async (id: string, data: Partial<MaterialReceiptData>): Promise<MaterialReceipt> => {
//   const { images, ...receiptData } = data;
//   return prisma.materialReceipt.update({
//     where: { id },
//     data: {
//       ...receiptData,
//       ...(images && {
//         images: {
//           deleteMany: {}, // Clear existing images
//           create: images.map((url) => ({ url })),
//         },
//       }),
//     },
//     include: {
//       itemGroup: { select: { id: true, name: true } },
//       itemName: { select: { id: true, name: true } },
//       user: { select: { id: true, name: true } },
//       site: { select: { id: true, name: true } },
//       images: true,
//     },
//   });
// };

// export const deleteMaterialReceipt = async (id: string): Promise<MaterialReceipt> => {
//   return prisma.materialReceipt.update({
//     where: { id },
//     data: { is_deleted: true },
//     include: {
//       images: true,
//     },
//   });
// };

// export const getMaterialReceiptsByTimePeriod = async (
//   timePeriod: string | { start: string; end: string } = 'today',
//   siteId?: string
// ): Promise<MaterialReceiptResponse[]> => {
//   try {
//     const today = new Date();
//     let startDate, endDate;
    
//     // Calculate date ranges based on the time period
//     switch (typeof timePeriod === 'string' ? timePeriod : 'custom') {
//       case 'today':
//         startDate = new Date(today);
//         startDate.setHours(0, 0, 0, 0);
//         endDate = new Date(today);
//         endDate.setHours(23, 59, 59, 999);
//         break;
        
//       case 'yesterday':
//         startDate = new Date(today);
//         startDate.setDate(today.getDate() - 1);
//         startDate.setHours(0, 0, 0, 0);
//         endDate = new Date(today);
//         endDate.setDate(today.getDate() - 1);
//         endDate.setHours(23, 59, 59, 999);
//         break;
//       case 'last3Days':
//         startDate = new Date(today);
//         startDate.setDate(today.getDate() - 3);
//         startDate.setHours(0, 0, 0, 0);
//         endDate = new Date(today);
//         endDate.setHours(23, 59, 59, 999);
//         break;
        
//       case 'thisWeek':
//         startDate = new Date(today);
//         startDate.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
//         startDate.setHours(0, 0, 0, 0);
//         endDate = new Date(today);
//         endDate.setHours(23, 59, 59, 999);
//         break;
        
//       case 'thisMonth':
//         startDate = new Date(today.getFullYear(), today.getMonth(), 1);
//         startDate.setHours(0, 0, 0, 0);
//         endDate = new Date(today);
//         endDate.setHours(23, 59, 59, 999);
//         break;
//       case 'lastMonth':
//         startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1); // First day of last month
//         startDate.setHours(0, 0, 0, 0);
//         endDate = new Date(today.getFullYear(), today.getMonth(), 0); // Last day of last month
//         endDate.setHours(23, 59, 59, 999);
//         break;

//       case 'custom':
//         if (typeof timePeriod !== 'string' && timePeriod.start && timePeriod.end) {
//           startDate = new Date(timePeriod.start);
//           endDate = new Date(timePeriod.end);
//           // Validate dates
//           if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
//             throw new Error('Invalid custom date format');
//           }
//           startDate.setHours(0, 0, 0, 0);
//           endDate.setHours(23, 59, 59, 999);
//           break;
//         }
//         // Fall through to default if custom dates are invalid
//       default:
//         startDate = new Date(today);
//         startDate.setHours(0, 0, 0, 0);
//         endDate = new Date(today);
//         endDate.setHours(23, 59, 59, 999);
//     }

//     const whereClause = {
//       created_at: {
//         gte: startDate,
//         lte: endDate
//       },
//       is_deleted: false,
//       ...(siteId && { site_id: siteId }), // Add site filter if siteId is provided
//     };
//     const receipts = await prisma.materialReceipt.findMany({
//       where: whereClause,
//       include: {
//         images: true,
//         itemGroup: { select: { id: true, name: true } },
//         itemName: { select: { id: true, name: true } },
//         user: { select: { id: true, name: true } },
//         site: { select: { id: true, name: true } },
//       },
//       orderBy: {
//         created_at: 'desc'
//       }
//     });

//     console.log('Found receipts:', receipts.length); // Debug log

//     // Map the receipts to include inward_number and ensure all required fields are present
//     const mappedReceipts = receipts.map(receipt => ({
//       id: receipt.id,
//       inward_number: receipt.token_number || '',
//       site: receipt.site,
//       itemGroup: receipt.itemGroup,
//       itemName: receipt.itemName,
//       created_at: receipt.created_at,
//       user: receipt.user,
//       images: receipt.images.map(image => ({
//         ...image,
//         directUrl: getCleanImageUrl(image.url),
//         isPlaceholder: false
//       })),
//       remark: receipt.remark,
//       is_deleted: receipt.is_deleted
//     }));

//     return mappedReceipts;
//   } catch (err) {
//     console.error('Error in repository getMaterialReceiptsByTimePeriod:', err);
//     throw new AppError(500, 'ServerError', 'Error retrieving material receipts by time period', err);
//   }
// };