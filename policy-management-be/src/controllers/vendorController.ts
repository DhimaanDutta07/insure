// // src/controllers/vendor.controller.ts
// import { Request, Response } from 'express';
// import { asyncTryCatch } from '../utils/errorHandler';
// import { vendorService } from '../services/vendorService';
// import { 
//   vendorCreateSchema, 
//   vendorUpdateSchema,
//   vendorQuerySchema, 
//   VendorStatusEnum
// } from '../schemas/vendorSchema';
// import { AppError } from '../utils/AppError';

// export const vendorController = {
//   // Get all vendors with pagination and filtering
//    getVendors: asyncTryCatch(async (req: Request, res: Response) => {
//     const queryParams = vendorQuerySchema.parse(req.query);
    
//     const { vendors, meta } = await vendorService.getVendors(queryParams);
    
//     res.status(200).json({
//       status: 'success',
//       message: 'Vendors retrieved successfully',
//       data: vendors,
//       meta
//     });
//   }),
  
//   // Get vendor by ID
//   getVendorById: asyncTryCatch(async (req: Request, res: Response) => {
//     const id = req.params.id as string;
    
//     const vendor = await vendorService.getVendorDetailById(id);
    
//     res.status(200).json({
//       status: 'success',
//       message: 'Vendor retrieved successfully',
//       data: vendor
//     });
//   }),
  
//   // Create new vendor
//   createVendor: asyncTryCatch(async (req: Request, res: Response) => {
//     // Transform frontend property names to match schema
//     const requestData = {
//       ...req.body,
//       supplier_info: req.body.supplierInfo || req.body.supplier_info
//     };
    
//     const validatedData = vendorCreateSchema.parse(requestData);
    
//     const vendor = await vendorService.createVendor(validatedData);
    
//     res.status(201).json({
//       status: 'success',
//       message: 'Vendor created successfully',
//       data: vendor
//     });
//   }),
  
//   // Update vendor
//   updateVendor: asyncTryCatch(async (req: Request, res: Response) => {
//     const id = req.params.id as string;
//     const { status, ...otherData } = req.body;
    
//     // If only status is being updated
//     if (status && Object.keys(otherData).length === 0) {
//       // Validate status
//       const validStatus = VendorStatusEnum.safeParse(status);
//       if (!validStatus.success) {
//         return res.status(400).json({
//           status: 'error',
//           message: 'Invalid status value',
//           errors: [{ path: 'status', message: 'Status must be one of: Active, Inactive' }]
//         });
//       }
      
//       try {
//         // Update only the status field
//         const updatedVendor = await vendorService.updateVendorStatus(id, { status: validStatus.data });
        
//         return res.status(200).json({
//           status: 'success',
//           message: 'Vendor status updated successfully',
//           data: {
//             id: updatedVendor.id,
//             name: updatedVendor.name,
//             status: updatedVendor.status
//           }
//         });
//       } catch (error) {
//         if ((error as any).statusCode === 404) {
//           return res.status(404).json({
//             status: 'error',
//             message: 'Vendor not found'
//           });
//         }
        
//         throw error; // Let the global error handler catch it
//       }
//     } 
//     // Full vendor update
//     else {
//       try {
//         // Transform frontend property names to match schema
//         const requestData = {
//           ...req.body,
//           supplier_info: req.body.supplierInfo || req.body.supplier_info
//         };
        
//         const validatedData = vendorUpdateSchema.parse(requestData);
        
//         const updatedVendor = await vendorService.updateVendor(id, validatedData);
        
//         return res.status(200).json({
//           status: 'success',
//           message: 'Vendor updated successfully',
//           data: updatedVendor
//         });
//       } catch (error) {
//         if (error instanceof Error) throw error;
//         throw new AppError(500, 'ServerError', 'Failed to update vendor', error);
//       }
//     }
//   }),
  
//   // Delete vendor
//   deleteVendor: asyncTryCatch(async (req: Request, res: Response) => {
//     const id = req.params.id as string;
    
//     await vendorService.deleteVendor(id);
    
//     res.status(200).json({
//       status: 'success',
//       message: 'Vendor deleted successfully'
//     });
//   }),

// };