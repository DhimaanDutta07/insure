// // src/repositories/vendor.repository.ts
// import { PrismaClient } from '@prisma/client';
// import { Vendor, VendorCreate, VendorStatus, VendorUpdate } from '../schemas/vendorSchema';

// const prisma = new PrismaClient();

// export const vendorRepository = {
//   // Find all vendors with optional filtering and pagination
//   findAll: async (filters: any = {}, skip: number = 0, take: number = 10) => {
//     return prisma.vendor.findMany({
//       where: {
//         ...filters,
//         is_deleted: false
//       },
//       skip,
//       take,
//       orderBy: { created_at: 'desc' }
//     });
//   },
  
//   // Count vendors for pagination
//   count: async (filters: any = {}) => {
//     return prisma.vendor.count({ 
//       where: {
//         ...filters,
//         is_deleted: false
//       } 
//     });
//   },

//   searchByName : async (searchTerm: string, limit: number = 10) => {
//     return prisma.vendor.findMany({
//       where: {
//         name: {
//           contains: searchTerm,
//           // mode: 'insensitive'
//         },
//         is_deleted: false
//       },
//       take: limit,
//       orderBy: { created_at: 'desc' }
//     });
//   },
  
//   countSearchResults : async (searchTerm: string) => {
//     return prisma.vendor.count({
//       where: {
//         name: {
//           contains: searchTerm,
//           // mode: 'insensitive'
//         },
//         is_deleted: false
//       }
//     });
//   },

//   // Find vendor by ID
// //   findById: async (id: string) => {
// //     return prisma.vendor.findUnique({
// //       where: { id },
// //       include: {
// //         trucks: true,
// //         purchase_orders: true,
// //         notifications: true
// //       }
// //     });
// //   },

//   // Create new vendor
//   create: async (data: VendorCreate) => {
//     return prisma.vendor.create({
//       data: {
//         name: data.name,
//         phone: data.phone,
//         email: data.email,
//         pan_no: data.pan_no,
//         gst: data.gst,
//         msme: data.msme,
//         status: data.status as VendorStatus || 'Active'
//       }
//     });
//   },

// //   // Update existing vendor
// //   update: async (id: string, data: VendorUpdate) => {
// //     try {
// //       return await prisma.vendor.update({
// //         where: { id },
// //         data
// //       });
// //     } catch (error) {
// //       if ((error as any).code === 'P2025') {
// //         return null; // Vendor not found
// //       }
// //       throw error;
// //     }
// //   },

//   // Delete vendor
//   delete: async (id: string) => {
//     try {
//       await prisma.vendor.update({
//         where: { id },
//         data:{
//           is_deleted:true,
//         }
//       });
//       return true;
//     } catch (error) {
//       if ((error as any).code === 'P2025') {
//         return false; // Vendor not found
//       }
//       throw error;
//     }
//   },

//   // vendorRepository.ts
//     findById: async (id: string): Promise<any> => {
//     try {
//       const vendor = await prisma.vendor.findUnique({
//         where: { id }
//       });
//       return vendor;
//     } catch (error) {
//       console.error('Error finding vendor by ID:', error);
//       throw error;
//     }
//   },
  
//     update: async (id: string, updateData: Partial<Vendor>): Promise<VendorUpdate> => {
//     try {
//       const updatedVendor = await prisma.vendor.update({
//         where: { id },
//         data: updateData
//       });
//       return updatedVendor;
//     } catch (error) {
//       console.error('Error updating vendor:', error);
//       throw error;
//     }
//   },
// };