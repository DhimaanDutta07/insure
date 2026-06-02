// /* eslint-disable react-hooks/exhaustive-deps */
// //Vendor.tsx
// import React, { useState, useEffect, useCallback } from 'react';
// import { Input } from '../../components/ui/input';
// import { Button } from '../../components/ui/button';
// import { Switch } from '../../components/ui/switch';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
// import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
// import { Edit, Trash2, Search, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, AlertCircle } from 'lucide-react';
// import axios from 'axios';
// import { toast } from 'sonner';
// import debounce from 'lodash/debounce';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

// type VendorStatus = 'Active' | 'Inactive';

// interface Vendor {
//   id: string;
//   name: string;
//   phone: string;
//   email: string;
//   pan_no?: string;
//   gst?: string;
//   msme?: string;
//   status: VendorStatus;
//   created_at: string;
//   updated_at: string;
// }

// interface PaginationMeta {
//   currentPage: number;
//   pageSize: number;
//   totalCount: number;
//   totalPages: number;
// }

// interface VendorResponse {
//   status: string;
//   message: string;
//   data: Vendor[];
//   meta: PaginationMeta;
// }

// const initialFormData = {
//   name: '',
//   phone: '',
//   email: '',
//   pan_no: '',
//   gst: '',
//   msme: '',
//   status: 'Active' as VendorStatus,
// };

// const Vendors = () => {
//   const [vendors, setVendors] = useState<Vendor[]>([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [isEditMode, setIsEditMode] = useState(false);
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
//   const [pagination, setPagination] = useState<PaginationMeta>({
//     currentPage: 1,
//     pageSize: 10, // This is your default value
//     totalCount: 0,
//     totalPages: 1
//   });
//   const [formData, setFormData] = useState({ ...initialFormData });

//   // Delete confirmation modal state
//   const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
//   const [vendorToDelete, setVendorToDelete] = useState<string | null>(null);

//   const fetchVendors = async () => {
//     if (isLoading) return;
    
//     setIsLoading(true);
//     try {
//       const response = await axios.get<VendorResponse>(
//         `${import.meta.env.VITE_BASE_URL}/api/v1/vendors`, 
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem('authToken')}`
//           },
//           params: {
//             page: pagination.currentPage,
//             limit: pagination.pageSize // Changed from pageSize to match backend
//           }
//         }
//       );
      
//       setVendors(response.data.data);
      
//       // Update pagination while preserving the user-selected pageSize
//       setPagination(prev => ({
//         currentPage: response.data.meta.currentPage,
//         totalCount: response.data.meta.totalCount,
//         totalPages: response.data.meta.totalPages,
//         pageSize: prev.pageSize // Keep the user-selected pageSize
//       }));
//     } catch (error) {
//       console.error('Error fetching vendors:', error);
//       toast.error('Failed to fetch vendors');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchVendors();
//   }, [pagination.currentPage, pagination.pageSize]);

//   // Reset form when dialog closes
//   useEffect(() => {
//     if (!isDialogOpen) {
//       setFormData({ ...initialFormData });
//       setIsEditMode(false);
//       setSelectedVendor(null);
//     }
//   }, [isDialogOpen]);

//   const debouncedSearch = useCallback(
//     debounce(async (searchValue: string) => {
//       if (!searchValue.trim()) {
//         fetchVendors();
//         return;
//       }
  
//       setIsLoading(true);
//       try {
//         const response = await axios.get<VendorResponse>(
//           `${import.meta.env.VITE_BASE_URL}/api/v1/vendors`, // Now using the combined endpoint
//           {
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem('authToken')}`
//             },
//             params: {
//               searchTerm: searchValue, // Using searchTerm instead of name
//               limit: pagination.pageSize
//             }
//           }
//         );
//         setVendors(response.data.data || []);
//         setPagination(prev => ({
//           ...prev,
//           currentPage: response.data.meta?.currentPage || 1,
//           totalCount: response.data.meta?.totalCount || 0,
//           totalPages: response.data.meta?.totalPages || 1
//         }));
//       } catch (error) {
//         console.error('Error searching vendors:', error);
//         toast.error('Failed to search vendors');
//         setVendors([]);
//       } finally {
//         setIsLoading(false);
//       }
//     }, 500),
//     [pagination.pageSize]
//   );

//   const handleSearch = (value: string) => {
//     setSearchTerm(value);
//     if (value.trim()) {
//       debouncedSearch(value);
//     } else {
//       fetchVendors();
//     }
//   };

//   const handlePageChange = (page: number) => {
//     if (page < 1 || page > pagination.totalPages) return;
    
//     // Set loading state to give user feedback
//     setIsLoading(true);
    
//     // Update pagination state
//     setPagination(prev => ({
//       ...prev,
//       currentPage: page
//     }));
    
//   };

//   // const handlePageSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
//   //   const newPageSize = parseInt(event.target.value);
    
//   //   // Update local state immediately before the API call
//   //   setPagination(prev => ({
//   //     ...prev,
//   //     pageSize: newPageSize,
//   //     currentPage: 1 // Reset to first page when changing page size
//   //   }));
//   // };

//   const validateForm = () => {
//     // Phone validation (10 digits)
//     if (!/^\d{10}$/.test(formData.phone)) {
//       toast.error('Phone number must be 10 digits');
//       return false;
//     }

//     // Email validation
//     if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
//       toast.error('Please enter a valid email address');
//       return false;
//     }

//     // PAN validation (if provided)
//     if (formData.pan_no && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan_no)) {
//       toast.error('Invalid PAN number format');
//       return false;
//     }

//     // GST validation (if provided)
//     if (formData.gst && !/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}\d[Z]{1}[A-Z\d]{1}$/.test(formData.gst)) {
//       toast.error('Invalid GST number format');
//       return false;
//     }

//     // MSME validation (if provided)
//     if (formData.msme && formData.msme.length > 19) {
//       toast.error('MSME number cannot exceed 19 characters');
//       return false;
//     }

//     return true;
//   };

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
    
//     if (!validateForm()) return;

//     try {
//       if (isEditMode && selectedVendor) {
//         const response = await axios.patch(
//           `${import.meta.env.VITE_BASE_URL}/api/v1/vendor/${selectedVendor.id}`,
//           formData,
//           {
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem('authToken')}`
//             }
//           }
//         );
        
//         setVendors(vendors.map(vendor => 
//           vendor.id === selectedVendor.id ? response.data.data : vendor
//         ));
//         toast.success('Vendor updated successfully!');
//       } else {
//         await axios.post( `${import.meta.env.VITE_BASE_URL}/api/v1/vendor`,
//           formData,
//           {
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem('authToken')}`
//             }
//           }
//         );
//         // Refresh the vendor list after adding new vendor
//         fetchVendors();
//         toast.success('Vendor created successfully!');
//       }
      
//       setIsDialogOpen(false);
//     } catch (error: unknown) {
//       console.error('Error saving vendor:', error);
//       if (axios.isAxiosError(error) && error.response?.data) {
//         // Check for 'error' or 'message' in the response data
//         const errorMessage = error.response.data.error || error.response.data.message || 'An unknown error occurred';
//         toast.error(errorMessage);
//       } else {
//         toast.error(isEditMode ? 'Failed to update vendor' : 'Failed to create vendor');
//       }
//     }
//   };

//   const handleStatusChange = async (vendorId: string, newStatus: VendorStatus) => {
//     try {
//       await axios.patch(
//         `${import.meta.env.VITE_BASE_URL}/api/v1/vendor/${vendorId}`,
//         { status: newStatus },
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem('authToken')}`
//           }
//         }
//       );
  
//       setVendors(vendors.map(vendor =>
//         vendor.id === vendorId ? { ...vendor, status: newStatus } : vendor
//       ));
//       toast.success('Status updated successfully!');
//     } catch (error) {
//       console.error('Error updating status:', error);
//       toast.error('Failed to update status');
//     }
//   };

//   const handleEdit = (vendor: Vendor) => {
//     setIsEditMode(true);
//     setSelectedVendor(vendor);
//     setFormData({
//       name: vendor.name,
//       phone: vendor.phone,
//       email: vendor.email,
//       pan_no: vendor.pan_no || '',
//       gst: vendor.gst || '',
//       msme: vendor.msme || '',
//       status: vendor.status,
//     });
//     setIsDialogOpen(true);
//   };

//   const handleOpenCreateDialog = () => {
//     setIsEditMode(false);
//     setSelectedVendor(null);
//     setFormData({ ...initialFormData });
//     setIsDialogOpen(true);
//   };

//   // Open the delete confirmation dialog
//   const confirmDelete = (vendorId: string) => {
//     setVendorToDelete(vendorId);
//     setIsDeleteDialogOpen(true);
//   };

//   // Execute the actual delete operation
//   const handleDelete = async () => {
//     if (!vendorToDelete) return;
    
//     try {
//       await axios.delete(`${import.meta.env.VITE_BASE_URL}/api/v1/vendor/${vendorToDelete}`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem('authToken')}`
//         }
//       });
      
//       // Refresh the vendor list after deletion
//       fetchVendors();
//       toast.success('Vendor deleted successfully!');
//     } catch (error) {
//       console.error('Error deleting vendor:', error);
//       toast.error('Failed to delete vendor');
//     } finally {
//       // Close the delete dialog
//       setIsDeleteDialogOpen(false);
//       setVendorToDelete(null);
//     }
//   };

//   // Cancel delete operation
//   const cancelDelete = () => {
//     setIsDeleteDialogOpen(false);
//     setVendorToDelete(null);
//   };

//   const requiredField = <span className="text-red-500 ml-1">*</span>;

//   return (
//     <div className="space-y-6 p-4">
//       <div className="flex justify-end items-center gap-4">
//         <div className="relative w-64">
//           <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
//           <Input
//             placeholder="Search vendors..."
//             value={searchTerm}
//             onChange={(e) => handleSearch(e.target.value)}
//             className="pl-8"
//           />
//         </div>
        
//         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//           <DialogTrigger asChild>
//             <Button 
//               size="sm" 
//               variant="outline" 
//               className="border-gray-300 text-white"
//               style={{background: "#0f50ba"}}
//               onClick={handleOpenCreateDialog}
//             >
//               Add Vendor
//             </Button>
//           </DialogTrigger>
//           <DialogContent className="bg-white">
//             <DialogHeader >
//               <DialogTitle className="text-left">{isEditMode ? 'Edit Vendor' : 'Add Vendor'}</DialogTitle>
//             </DialogHeader>
//             <form onSubmit={handleSubmit} className="space-y-4">
//               <div className="space-y-2">
//                 <label htmlFor="name" className="text-sm font-medium">Vendor Name{!isEditMode &&requiredField}</label>
//                 <Input
//                   id="name"
//                   placeholder="Enter vendor name"
//                   value={formData.name}
//                   onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                   required
//                   maxLength={255}
//                 />
//               </div>

//               <div className="space-y-2">
//                 <label htmlFor="phone" className="text-sm font-medium">Phone Number{!isEditMode &&requiredField}</label>
//                 <Input
//                   id="phone"
//                   placeholder="Enter 10-digit phone number"
//                   value={formData.phone}
//                   onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
//                   required
//                   maxLength={10}
//                 />
//               </div>

//               <div className="space-y-2">
//                 <label htmlFor="email" className="text-sm font-medium">Email{!isEditMode &&requiredField}</label>
//                 <Input
//                   id="email"
//                   type="email"
//                   placeholder="Enter email address"
//                   value={formData.email}
//                   onChange={(e) => setFormData({ ...formData, email: e.target.value })}
//                   required
//                   maxLength={255}
//                 />
//               </div>

//               <div className="space-y-2">
//                 <label htmlFor="pan_no" className="text-sm font-medium">PAN Number{!isEditMode &&requiredField}</label>
//                 <Input
//                   id="pan_no"
//                   placeholder="Enter PAN number"
//                   value={formData.pan_no}
//                   onChange={(e) => setFormData({ ...formData, pan_no: e.target.value.toUpperCase() })}
//                   maxLength={10}
//                   disabled={isEditMode}
//                 />
//               </div>

//               <div className="space-y-2">
//                 <label htmlFor="gst" className="text-sm font-medium">GST Number{!isEditMode &&requiredField}</label>
//                 <Input
//                   id="gst"
//                   placeholder="Enter GST number"
//                   value={formData.gst}
//                   onChange={(e) => setFormData({ ...formData, gst: e.target.value.toUpperCase() })}
//                   maxLength={15}
//                   disabled={isEditMode}
//                 />
//               </div>

//               <div className="space-y-2">
//                 <label htmlFor="msme" className="text-sm font-medium">MSME Number{!isEditMode &&requiredField}</label>
//                 <Input
//                   id="msme"
//                   placeholder="Enter MSME number"
//                   value={formData.msme}
//                   onChange={(e) => setFormData({ ...formData, msme: e.target.value })}
//                   maxLength={19}
//                   disabled={isEditMode}
//                 />
//               </div>
//               <DialogFooter className="flex justify-end gap-2">
//               <Button type="submit" className="text-white"
//               style={{background: "#0f50ba"}}
//               >
//                 {isEditMode ? 'Update Vendor' : 'Add Vendor'}
//               </Button>
//               </DialogFooter>
//             </form>
//           </DialogContent>
//         </Dialog>
//       </div>

//       <Table>
//         <TableHeader>
//           <TableRow>
//             <TableHead>Name</TableHead>
//             <TableHead>Phone</TableHead>
//             <TableHead>Email</TableHead>
//             {/* <TableHead>PAN</TableHead> */}
//             <TableHead>GST</TableHead>
//             {/* <TableHead>MSME</TableHead> */}
//             <TableHead>Status</TableHead>
//             <TableHead>Actions</TableHead>
//           </TableRow>
//         </TableHeader>
//         <TableBody>
//           {isLoading ? (
//             <TableRow>
//               <TableCell colSpan={8} className="text-center py-8">
//                 <div className="flex flex-col items-center justify-center text-gray-500">
//                   <p className="text-lg font-medium">Loading...</p>
//                 </div>
//               </TableCell>
//             </TableRow>
//           ) : vendors.length > 0 ? (
//             vendors.map((vendor) => (
//               <TableRow key={vendor.id}>
//                 <TableCell className="py-4">{vendor.name}</TableCell>
//                 <TableCell className="py-4">{vendor.phone}</TableCell>
//                 <TableCell className="py-4">{vendor.email}</TableCell>
//                 {/* <TableCell className="py-4">{vendor.pan_no || '-'}</TableCell> */}
//                 <TableCell className="py-4">{vendor.gst || '-'}</TableCell>
//                 {/* <TableCell className="py-4">{vendor.msme || '-'}</TableCell> */}
//                 <TableCell className="py-4">
//                   <Switch
//                     checked={vendor.status === 'Active'}
//                     onCheckedChange={() => handleStatusChange(
//                       vendor.id,
//                       vendor.status === 'Active' ? 'Inactive' : 'Active'
//                     )}
//                   />
//                 </TableCell>
//                 <TableCell className="flex space-x-2 py-4">
//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     onClick={() => handleEdit(vendor)}
//                     className='hover:text-blue-800 hover:bg-blue-50'
//                   >
//                     <Edit className="w-4 h-4" />
//                   </Button>
//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     onClick={() => confirmDelete(vendor.id)}
//                     className='hover:text-red-800 hover:bg-red-50'
//                   >
//                     <Trash2 className="w-4 h-4" />
//                   </Button>
//                 </TableCell>
//               </TableRow>
//             ))
//           ) : (
//             <TableRow>
//               <TableCell colSpan={8} className="text-center py-8">
//                 <div className="flex flex-col items-center justify-center text-gray-500">
//                   <p className="text-lg font-medium">No vendors found</p>
//                   {searchTerm && (
//                     <p className="text-sm mt-1">No results found for "{searchTerm}"</p>
//                   )}
//                 </div>
//               </TableCell>
//             </TableRow>
//           )}
//         </TableBody>
//       </Table>

//       <div className="flex justify-between items-center mt-4">
//         <div className="flex items-center space-x-2">
//           <span>Rows per page</span>
//           <Select
//             value={pagination.pageSize.toString()}
//             onValueChange={(value) => {
//               setPagination(prev => ({
//                 ...prev,
//                 pageSize: parseInt(value),
//                 currentPage: 1 // Reset to first page when changing page size
//               }));
//             }}
//           >
//             <SelectTrigger className="w-16 cursor-pointer border-gray-300 h-8">
//               <SelectValue />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="10" className="cursor-pointer">10</SelectItem>
//               <SelectItem value="25" className="cursor-pointer">25</SelectItem>
//               <SelectItem value="50" className="cursor-pointer">50</SelectItem>
//               <SelectItem value="100" className="cursor-pointer">100</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>
        
//         <div className="text-sm">
//           Page {pagination.currentPage} of {pagination.totalPages}
//         </div>
        
//         <div className="flex space-x-1">
//           <Button 
//             variant="outline" 
//             size="icon"
//             disabled={pagination.currentPage <= 1}
//             onClick={() => handlePageChange(1)}
//           >
//             <ChevronsLeft className="h-4 w-4" />
//           </Button>
//           <Button 
//             variant="outline" 
//             size="icon"
//             disabled={pagination.currentPage <= 1}
//             onClick={() => handlePageChange(pagination.currentPage - 1)}
//           >
//             <ChevronLeft className="h-4 w-4" />
//           </Button>
//           <Button 
//             variant="outline" 
//             size="icon"
//             disabled={pagination.currentPage >= pagination.totalPages}
//             onClick={() => handlePageChange(pagination.currentPage + 1)}
//           >
//             <ChevronRight className="h-4 w-4" />
//           </Button>
//           <Button 
//             variant="outline" 
//             size="icon"
//             disabled={pagination.currentPage >= pagination.totalPages}
//             onClick={() => handlePageChange(pagination.totalPages)}
//           >
//             <ChevronsRight className="h-4 w-4" />
//           </Button>
//         </div>
//       </div>

//       {/* Delete Confirmation Dialog */}
//       <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
//         <DialogContent className="bg-white">
//           <DialogHeader>
//             <DialogTitle className="flex items-center gap-2">
//               <AlertCircle className="h-5 w-5" style={{color: "#0f50ba"}} />
//               <span>Confirm Deletion</span>
//             </DialogTitle>
//           </DialogHeader>
          
//           <DialogDescription className="py-2">
//             Are you sure you want to delete this vendor? This action cannot be undone.
//           </DialogDescription>
          
//           <DialogFooter className="flex justify-end gap-2">
//             <Button 
//               variant="outline" 
//               onClick={cancelDelete}
//               className="border-gray-300"
//             >
//               Cancel
//             </Button>
//             <Button 
//               onClick={handleDelete}
//               className="text-white"
//               style={{background: "#0f50ba"}}
//             >
//               Delete
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>

//   );
// };

// export default Vendors;