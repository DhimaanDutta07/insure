// // src/services/vendor.service.ts
// import { 
//     VendorCreate, 
//     VendorUpdate, 
//     VendorQuery, 
//     Vendor
//   } from '../schemas/vendorSchema';
//   import { vendorRepository } from '../repositories/vendorRepository';
//   import { AppError } from '../utils/AppError';
  
//   export const vendorService = {
//     // Get all vendors with optional filtering and pagination
//     getVendors: async (query: VendorQuery) => {
//       const { page = 1, limit = 10, status, name, searchTerm } = query;
//       const skip = (page - 1) * limit;
      
//       try {
//         let vendors;
//         let totalCount;
        
//         // If searchTerm is provided, do a search by name
//         if (searchTerm) {
//           vendors = await vendorRepository.searchByName(searchTerm, limit);
//           totalCount = await vendorRepository.countSearchResults(searchTerm);
//         } 
//         // Otherwise, do a filtered retrieval
//         else {
//           const filters: { [key: string]: any } = {};
//           if (status) filters.status = status;
//           if (name) filters.name = { contains: name, mode: 'insensitive' };
          
//           vendors = await vendorRepository.findAll(filters, skip, limit);
//           totalCount = await vendorRepository.count(filters);
//         }
        
//         const totalPages = Math.ceil(totalCount / limit);
          
//         return {
//           vendors,
//           meta: {
//             currentPage: page,
//             pageSize: limit,
//             totalCount,
//             totalPages
//           }
//         };
//       } catch (error) {
//         throw new AppError(500, 'ServerError', 'Failed to retrieve vendors', error);
//       }
//     },
    
//     // Get vendor by ID
//     getVendorDetailById: async (id: string) => {
//       try {
//         const vendor = await vendorRepository.findById(id);
//         if (!vendor) {
//           throw new AppError(404, 'ClientError', 'Vendor not found');
//         }
//         return vendor;
//       } catch (error) {
//         if (error instanceof AppError) throw error;
//         throw new AppError(500, 'ServerError', 'Failed to retrieve vendor', error);
//       }
//     },
    
//     // Create new vendor
//     createVendor: async (data: VendorCreate) => {
//       try {
//         return await vendorRepository.create(data);
//       } catch (error) {
//         if ((error as any).code === 'P2002') {
//           throw new AppError(409, 'ClientError', 'A vendor with this information already exists');
//         }
//         throw new AppError(500, 'ServerError', 'Failed to create vendor', error);
//       }
//     },
    
//     // Update vendor
//     updateVendor: async (id: string, data: VendorUpdate) => {
//       try {
//         const updatedVendor = await vendorRepository.update(id, data);
//         if (!updatedVendor) {
//           throw new AppError(404, 'ClientError', 'Vendor not found');
//         }
//         return updatedVendor;
//       } catch (error) {
//         if (error instanceof AppError) throw error;
//         throw new AppError(500, 'ServerError', 'Failed to update vendor', error);
//       }
//     },
    
//     // Delete vendor
//     deleteVendor: async (id: string) => {
//       try {
//         const deleted = await vendorRepository.delete(id);
//         if (!deleted) {
//           throw new AppError(404, 'ClientError', 'Vendor not found');
//         }
//         return true;
//       } catch (error) {
//         if (error instanceof AppError) throw error;
//         if ((error as any).code === 'P2003') {
//           throw new AppError(409, "ClientError", 'Cannot delete vendor as it is referenced by other records');
//         }
//         throw new AppError(500, 'ServerError', 'Failed to delete vendor', error);
//       }
//     },

//     // vendorService.ts
//      updateVendorStatus: async (id: string, updateData: Partial<Vendor>): Promise<VendorUpdate> => {
//     // Validate vendor exists first
//     const existingVendor = await vendorRepository.findById(id);
//     if (!existingVendor) {
//       const error: any = new Error('Vendor not found');
//       error.statusCode = 404;
//       throw error;
//     }
    
//     // Update vendor
//     const updatedVendor = await vendorRepository.update(id, updateData);
//     if (!updatedVendor) {
//       throw new AppError(404, 'ClientError', 'Vendor not found');
//     }
//     return updatedVendor;
//   },

//   };