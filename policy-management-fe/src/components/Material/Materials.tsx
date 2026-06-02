/* eslint-disable react-hooks/exhaustive-deps */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// import React, { useState, useEffect, useCallback } from 'react';
// import { Input } from '../../components/ui/input';
// import { Button } from '../../components/ui/button';
// import { Textarea } from '../../components/ui/textarea';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
// import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
// import {Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Edit, AlertCircle } from 'lucide-react';
// import axios from 'axios';
// import { toast } from 'sonner';
// import debounce from 'lodash/debounce';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

// interface Material {
//   id?: string;
//   name: string;
//   description: string;
//   category: string;
//   subCategory: string;
//   created_at: string;
// }

// interface Pagination {
//   currentPage: number;
//   pageSize: number;
//   totalItems: number;
//   totalPages: number;
// }

// const Materials = () => {
//   const [materials, setMaterials] = useState<Material[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [newMaterial, setNewMaterial] = useState({
//     name: '',
//     description: '',
//     category: '',
//     subCategory: '',
//   });
//   const [editMaterial, setEditMaterial] = useState<Material | null>(null);
//   const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
//   // Delete confirmation modal state
//   const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
//   const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
//   const [isAddMaterialDialogOpen, setIsAddMaterialDialogOpen] = useState(false);
  
//   // Pagination state
//   const [pagination, setPagination] = useState<Pagination>({
//     currentPage: 1,
//     pageSize: 10,
//     totalItems: 0,
//     totalPages: 1
//   });

//   // Fetch materials with optional search term
//   const fetchMaterials = useCallback(async (search = '') => {
//     setLoading(true);
//     try {
//       const params: any = {
//         page: pagination.currentPage,
//         limit: pagination.pageSize
//       };
      
//       // If search term is provided, add it as searchTerm parameter
//       if (search.trim()) {
//         params.searchTerm = search.trim();
//       }
      
//       const response = await axios.get(
//         `${import.meta.env.VITE_BASE_URL}/api/v1/materials`, 
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem('authToken')}`
//           },
//           params
//         }
//       );
      
//       setMaterials(response.data.data || []);
      
//       // Update pagination info from response
//       if (response.data.meta) {
//         setPagination(prev => ({
//           ...prev,
//           currentPage: response.data.meta.currentPage,
//           pageSize: response.data.meta.pageSize,
//           totalItems: response.data.meta.totalCount,
//           totalPages: response.data.meta.totalPages
//         }));
//       }
//     } catch (error) {
//       console.error('Error fetching materials:', error);
//       toast.error('Failed to load materials. Please refresh the page.');
//       setMaterials([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [pagination.currentPage, pagination.pageSize]);

//   // Fetch materials when component mounts or pagination changes
//   useEffect(() => {
//     fetchMaterials(searchTerm);
//   }, [pagination.currentPage, pagination.pageSize, fetchMaterials]);

//   // Debounced search function
//   const debouncedSearch = useCallback(
//     debounce((searchValue: string) => {
//       setSearchTerm(searchValue);
//       setPagination(prev => ({
//         ...prev,
//         currentPage: 1 // Reset to first page on new search
//       }));
//       fetchMaterials(searchValue);
//     }, 500),
//     [fetchMaterials]
//   );

//   // Handle search input changes
//   const handleSearch = (value: string) => {
//     setSearchTerm(value);
//     debouncedSearch(value);
//   };

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
    
//     const material: Material = {
//       name: newMaterial.name,
//       description: newMaterial.description,
//       // starch: parseFloat(newMaterial.starch) || 0,     // Parse string to number
//       // moisture: parseFloat(newMaterial.moisture) || 0, // Parse string to number
//       // tfm: parseFloat(newMaterial.tfm) || 0,           // Parse string to number
//       category: newMaterial.category,
//       subCategory: newMaterial.subCategory,
//       created_at: new Date().toISOString(),
//     };
  
//     try {
//        await axios.post(`${import.meta.env.VITE_BASE_URL}/api/v1/material`, material, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem('authToken')}`
//         }
//       });
      
//       // Reset form
//       setNewMaterial({ 
//         name: '', 
//         description: '', 
//         category: '',
//         subCategory: '', 
//       });

//       setIsAddMaterialDialogOpen(false);
      
//       toast.success('Material created successfully!');
      
//       // Refresh the materials list to ensure we have the latest data
//       fetchMaterials(searchTerm);
//     } catch (error) {
//       console.error('Error creating material:', error);
//       toast.error('Failed to create material. Please try again.');
//     }
//   };

//   const handleEdit = (material: Material) => {
//     // Convert numeric values to strings for the edit form
//     setEditMaterial({
//       ...material,
//       category: material.category.toString(),
//       subCategory: material.subCategory.toString(),
//     });
//     setIsEditDialogOpen(true);
//   };

//   const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     if (!editMaterial || !editMaterial.id) return;

//     try {
//       await axios.patch(`${import.meta.env.VITE_BASE_URL}/api/v1/material/${editMaterial.id}`, editMaterial, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem('authToken')}`
//         }
//       });
      
//       setIsEditDialogOpen(false);
//       fetchMaterials(searchTerm);
//       toast.success('Material updated successfully!');
//     } catch (error) {
//       console.error('Error updating material:', error);
//       toast.error('Failed to update material. Please try again.');
//     }
//   };

//   // Show delete confirmation dialog
//   const confirmDelete = (material: Material) => {
//     setMaterialToDelete(material);
//     setIsDeleteDialogOpen(true);
//   };

//   // Handle actual deletion after confirmation
//   const handleDelete = async () => {
//     if (!materialToDelete || !materialToDelete.id) return;
    
//     try {
//       await axios.delete(`${import.meta.env.VITE_BASE_URL}/api/v1/material/${materialToDelete.id}`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem('authToken')}`
//         }
//       });
      
//       setIsDeleteDialogOpen(false);
//       setMaterialToDelete(null);
//       fetchMaterials(searchTerm);
//       toast.success('Material deleted successfully!');
//     } catch (error) {
//       console.error('Error deleting material:', error);
//       toast.error('Failed to delete material. Please try again.');
//     }
//   };

//   const handlePageChange = (newPage: number) => {
//     if (newPage > 0 && newPage <= pagination.totalPages) {
//       setPagination(prev => ({
//         ...prev,
//         currentPage: newPage
//       }));
//     }
//   };

//   // Helper function to validate percentage input
//   const validatePercentage = (value: string) => {
//     // Allow empty string
//     if (value === '') return '';
    
//     const num = parseFloat(value);
//     if (isNaN(num)) return '0';
    
//     // Ensure value is between 0 and 100, and return as string
//     return Math.min(Math.max(0, num), 100).toString();
//   };

//   const requiredField = <span className="text-red-500 ml-1">*</span>;

//   return (
//     <div className="space-y-6 p-4">
//       {/* Search and Create Material Button */}
//       <div className="flex justify-end items-center gap-4">
//         <div className="relative w-64">
//           <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
//           <Input
//             placeholder="Search materials..."
//             value={searchTerm}
//             onChange={(e) => handleSearch(e.target.value)}
//             className="pl-8"
//           />
//         </div>
        
//         <Dialog open={isAddMaterialDialogOpen} onOpenChange={setIsAddMaterialDialogOpen}>
//           <DialogTrigger asChild>
//             <Button size="sm" variant="outline" className="mt-1 border-gray-300 text-white"
//             style={{background: "#0f50ba"}}
//             >
//               Add Material
//             </Button>
//           </DialogTrigger>
//           <DialogContent className="bg-white">
//             <div className="flex justify-start">
//               <DialogHeader>
//                 <DialogTitle>Add Material</DialogTitle>
//               </DialogHeader>
//             </div>
//             <form onSubmit={handleSubmit} className="space-y-4">
//               <div className="space-y-2">
//                 <label htmlFor="name" className="text-sm font-medium">
//                   Material Name{requiredField}
//                 </label>
//                 <Input
//                   id="name"
//                   placeholder="e.g., Rice, Corn"
//                   value={newMaterial.name}
//                   onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
//                   required
//                   maxLength={100}
//                 />
//               </div>

//               <div className="space-y-2">
//                 <label htmlFor="description" className="text-sm font-medium">
//                   Description{requiredField}
//                 </label>
//                 <Textarea
//                   id="description"
//                   placeholder="Enter material description..."
//                   value={newMaterial.description}
//                   onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
//                   required
//                 />
//               </div>

//               <div className="grid grid-cols-3 gap-4">
//                 <div className="space-y-2">
//                   <label htmlFor="starch" className="text-sm font-medium">
//                     Starch (%){requiredField}
//                   </label>
//                   <Input
//                     id="starch"
//                     type="number"
//                     max="100"
//                     step="0.1"
//                     placeholder="0.0"
//                     value={newMaterial.starch}
//                     onChange={(e) => setNewMaterial({
//                       ...newMaterial,
//                       starch: validatePercentage(e.target.value)
//                     })}
//                     required
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <label htmlFor="moisture" className="text-sm font-medium">
//                     Moisture (%){requiredField}
//                   </label>
//                   <Input
//                     id="moisture"
//                     type="number"
//                     max="100"
//                     step="0.1"
//                     placeholder="0.0"
//                     value={newMaterial.moisture}
//                     onChange={(e) => setNewMaterial({
//                       ...newMaterial,
//                       moisture: validatePercentage(e.target.value)
//                     })}
//                     required
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <label htmlFor="tfm" className="text-sm font-medium">
//                     TFM (%){requiredField}
//                   </label>
//                   <Input
//                     id="tfm"
//                     type="number"
//                     max="100"
//                     step="0.1"
//                     placeholder="0.0"
//                     value={newMaterial.tfm}
//                     onChange={(e) => setNewMaterial({
//                       ...newMaterial,
//                       tfm: validatePercentage(e.target.value)
//                     })}
//                     required
//                   />
//                 </div>
//               </div>
//               <DialogFooter className="flex justify-end gap-2">
//               <Button type="submit" className="bg-black text-white hover:bg-gray-800"
//               style={{background: "#0f50ba"}}
//             >
//               Add Material</Button>
//               </DialogFooter>
//             </form>
//           </DialogContent>
//         </Dialog>
//       </div>

//       {/* Edit Material Dialog */}
//       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
//         <DialogContent className="bg-white">
//           <div className="flex justify-start">
//             <DialogHeader>
//               <DialogTitle>Edit Material</DialogTitle>
//             </DialogHeader>
//           </div>
//           <form onSubmit={handleUpdate} className="space-y-4">
//             <div className="space-y-2">
//               <label htmlFor="edit-name" className="text-sm font-medium">
//                 Material Name
//               </label>
//               <Input
//                 id="edit-name"
//                 placeholder="e.g., Rice, Corn"
//                 value={editMaterial?.name || ''}
//                 onChange={(e) => setEditMaterial(prev => prev ? {...prev, name: e.target.value} : null)}
//                 required
//                 maxLength={100}
//               />
//             </div>

//             <div className="space-y-2">
//               <label htmlFor="edit-description" className="text-sm font-medium">
//                 Description
//               </label>
//               <Textarea
//                 id="edit-description"
//                 placeholder="Enter material description..."
//                 value={editMaterial?.description || ''}
//                 onChange={(e) => setEditMaterial(prev => prev ? {...prev, description: e.target.value} : null)}
//                 required
//               />
//             </div>

//             <div className="grid grid-cols-3 gap-4">
//               <div className="space-y-2">
//                 <label htmlFor="edit-starch" className="text-sm font-medium">
//                   Starch (%)
//                 </label>
//                 <Input
//                   id="edit-starch"
//                   type="number"
//                   min="0"
//                   max="100"
//                   step="0.1"
//                   placeholder="0.0"
//                   value={editMaterial?.starch?.toString() || '0'}
//                   onChange={(e) => {
//                     const value = e.target.value;
//                     // Allow clearing the field
//                     if (value === '') {
//                       setEditMaterial(prev => prev ? {
//                         ...prev, 
//                         starch: 0
//                       } : null);
//                     } else {
//                       setEditMaterial(prev => prev ? {
//                         ...prev, 
//                         starch: parseFloat(validatePercentage(value)) || 0
//                       } : null);
//                     }
//                   }}
//                 />
//               </div>

//               <div className="space-y-2">
//                 <label htmlFor="edit-moisture" className="text-sm font-medium">
//                   Moisture (%)
//                 </label>
//                 <Input
//                   id="edit-moisture"
//                   type="number"
//                   min="0"
//                   max="100"
//                   step="0.1"
//                   placeholder="0.0"
//                   value={editMaterial?.moisture?.toString() || '0'}
//                   onChange={(e) => {
//                     const value = e.target.value;
//                     // Allow clearing the field
//                     if (value === '') {
//                       setEditMaterial(prev => prev ? {
//                         ...prev, 
//                         moisture: 0
//                       } : null);
//                     } else {
//                       setEditMaterial(prev => prev ? {
//                         ...prev, 
//                         moisture: parseFloat(validatePercentage(value)) || 0
//                       } : null);
//                     }
//                   }}
//                 />
//               </div>

//               <div className="space-y-2">
//                 <label htmlFor="edit-tfm" className="text-sm font-medium">
//                   TFM (%)
//                 </label>
//                 <Input
//                   id="edit-tfm"
//                   type="number"
//                   min="0"
//                   max="100"
//                   step="0.1"
//                   placeholder="0.0"
//                   value={editMaterial?.tfm?.toString() || '0'}
//                   onChange={(e) => {
//                     const value = e.target.value;
//                     // Allow clearing the field
//                     if (value === '') {
//                       setEditMaterial(prev => prev ? {
//                         ...prev, 
//                         tfm: 0
//                       } : null);
//                     } else {
//                       setEditMaterial(prev => prev ? {
//                         ...prev, 
//                         tfm: parseFloat(validatePercentage(value)) || 0
//                       } : null);
//                     }
//                   }}
//                 />
//               </div>
//             </div>
//             <DialogFooter className="flex justify-end gap-2">
//             <Button type="submit" className=" text-white"
//               style={{background: "#0f50ba"}}
//             >Update Material
//             </Button>
//             </DialogFooter>
//           </form>
//         </DialogContent>
//       </Dialog>

//       {/* Delete Confirmation Dialog */}
//       <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
//         <DialogContent className="bg-white">
//           <DialogHeader>
//             <DialogTitle className="flex items-center gap-2">
//               <AlertCircle className="h-5 w-5" style={{color: "#0f50ba"}} />
//               <span>Confirm Deletion</span>
//             </DialogTitle>
//           </DialogHeader>
//             <DialogDescription className="py-2">
//               Are you sure you want to delete the material "{materialToDelete?.name}"? This action cannot be undone.
//             </DialogDescription>
//           <DialogFooter className="flex justify-end gap-2">
//             <Button 
//               variant="outline" 
//               onClick={() => setIsDeleteDialogOpen(false)}
//             >
//               Cancel
//             </Button>
//             <Button 
//               variant="destructive" 
//               onClick={handleDelete}
//               className="text-white"
//               style={{background: "#0f50ba"}}
//             >
//               Delete
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Materials Table */}
//       <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Name</TableHead>
//                 <TableHead>Description</TableHead>
//                 <TableHead>Starch (%)</TableHead>
//                 <TableHead>Moisture (%)</TableHead>
//                 <TableHead>TFM (%)</TableHead>
//                 <TableHead>Actions</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {loading ? (
//                 <TableRow>
//                   <TableCell colSpan={6} className="text-center py-8">
//                     <div className="flex flex-col items-center justify-center text-gray-500">
//                       <p className="text-lg font-medium">Loading...</p>
//                     </div>
//                   </TableCell>
//                 </TableRow>
//               ) : materials.length > 0 ? (
//                 materials.map((material, index) => (
//                   <TableRow key={material.id || index}>
//                     <TableCell className="py-4">{material.name}</TableCell>
//                     <TableCell className="py-4">{material.description}</TableCell>
//                     <TableCell className="py-4">{material.starch?.toFixed(1) || '0.0'}</TableCell>
//                     <TableCell className="py-4">{material.moisture?.toFixed(1) || '0.0'}</TableCell>
//                     <TableCell className="py-4">{material.tfm?.toFixed(1) || '0.0'}</TableCell>
//                     <TableCell className="py-4 ">
//                       <div className="flex space-x-2">
//                         <Button 
//                           variant="ghost" 
//                           size="icon" 
//                           onClick={() => handleEdit(material)}
//                           className="h-10 w-10 hover:text-blue-800 hover:bg-blue-50"
//                         >
//                           <Edit className="w-4 h-4" />
//                           <span className="sr-only">Edit</span>
//                         </Button>
//                         <Button 
//                           variant="ghost" 
//                           size="icon" 
//                           onClick={() => confirmDelete(material)}
//                           className="h-10 w-10 hover:text-red-800 hover:bg-red-50"
//                         >
//                           <Trash2 className="h-4 w-4" />
//                           <span className="sr-only">Delete</span>
//                         </Button>
//                       </div>
//                     </TableCell>
//                   </TableRow>
//                 ))
//               ) : (
//                 <TableRow>
//                   <TableCell colSpan={6} className="text-center py-8">
//                     <div className="flex flex-col items-center justify-center text-gray-500">
//                       <p className="text-lg font-medium">No materials found</p>
//                       {searchTerm && (
//                         <p className="text-sm mt-1">No results found for "{searchTerm}"</p>
//                       )}
//                     </div>
//                   </TableCell>
//                 </TableRow>
//               )}
//             </TableBody>
//           </Table>
          
//           {/* Pagination Controls */}
//           <div className="flex justify-between items-center mt-4">
//             <div className="flex items-center space-x-2">
//               <span>Rows per page</span>
//               <Select
//                 value={pagination.pageSize.toString()}
//                 onValueChange={(value) => {
//                   setPagination(prev => ({
//                     ...prev,
//                     pageSize: parseInt(value),
//                     currentPage: 1 // Reset to first page when changing page size
//                   }));
//                 }}
//               >
//                 <SelectTrigger className="w-16 cursor-pointer border-gray-300 h-8">
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="10" className="cursor-pointer">10</SelectItem>
//                   <SelectItem value="25" className="cursor-pointer">25</SelectItem>
//                   <SelectItem value="50" className="cursor-pointer">50</SelectItem>
//                   <SelectItem value="100" className="cursor-pointer">100</SelectItem>
//                 </SelectContent>
//               </Select>

//             </div>
//             <div className="text-sm">
//               Page {pagination.currentPage} of {pagination.totalPages}
//             </div>
//             <div className="flex space-x-1">
//               <Button 
//                 variant="outline" 
//                 size="icon"
//                 disabled={pagination.currentPage <= 1}
//                 onClick={() => handlePageChange(1)}
//               >
//                 <ChevronsLeft className="h-4 w-4" />
//               </Button>
//               <Button 
//                 variant="outline" 
//                 size="icon"
//                 disabled={pagination.currentPage <= 1}
//                 onClick={() => handlePageChange(pagination.currentPage - 1)}
//               >
//                 <ChevronLeft className="h-4 w-4" />
//               </Button>
//               <Button 
//                 variant="outline" 
//                 size="icon"
//                 disabled={pagination.currentPage >= pagination.totalPages}
//                 onClick={() => handlePageChange(pagination.currentPage + 1)}
//               >
//                 <ChevronRight className="h-4 w-4" />
//               </Button>
//               <Button 
//                 variant="outline" 
//                 size="icon"
//                 disabled={pagination.currentPage >= pagination.totalPages}
//                 onClick={() => handlePageChange(pagination.totalPages)}
//               >
//                 <ChevronsRight className="h-4 w-4" />
//               </Button>
//             </div>
//           </div>
//     </div>
//   );
// };

// export default Materials;
// import React, { useState, useEffect, useCallback } from 'react';
// import { Input } from '../../components/ui/input';
// import { Button } from '../../components/ui/button';
// import { Textarea } from '../../components/ui/textarea';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
// import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
// import { Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Edit, AlertCircle } from 'lucide-react';
// import axios from 'axios';
// import { toast } from 'sonner';
// import debounce from 'lodash/debounce';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

// interface Material {
//   id?: string;
//   itemGroup: string;
//   itemName: string;
//   description: string;
//   // subCategory: string;
//   created_at: string;
// }

// interface Pagination {
//   currentPage: number;
//   pageSize: number;
//   totalItems: number;
//   totalPages: number;
// }

// // Define categories and subcategories
// const categories = [
//   {
//     name: 'Category 1',
//     subCategories: ['SubCategory 1.1', 'SubCategory 1.2']
//   },
//   {
//     name: 'Category 2',
//     subCategories: ['SubCategory 2.1', 'SubCategory 2.2']
//   },
//   // Add more categories and subcategories as needed
// ];

// const Materials = () => {
//   const [materials, setMaterials] = useState<Material[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [newMaterial, setNewMaterial] = useState({
//     ItemGroup: [],
//     ItemName: '',
//     Description: '',
//     // subCategory: '',
//   });
//   const [editMaterial, setEditMaterial] = useState<Material | null>(null);
//   const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
//   const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
//   const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
//   const [isAddMaterialDialogOpen, setIsAddMaterialDialogOpen] = useState(false);
//   const [pagination, setPagination] = useState<Pagination>({
//     currentPage: 1,
//     pageSize: 10,
//     totalItems: 0,
//     totalPages: 1
//   });

//   const fetchMaterials = useCallback(async (search = '') => {
//     setLoading(true);
//     try {
//       const params: Record<string, string | number> = {
//         page: pagination.currentPage,
//         limit: pagination.pageSize
//       };
      
//       if (search.trim()) {
//         params.searchTerm = search.trim();
//       }
      
//       const response = await axios.get(
//         `${import.meta.env.VITE_BASE_URL}/api/v1/materials`, 
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem('authToken')}`
//           },
//           params
//         }
//       );
      
//       setMaterials(response.data.data || []);
      
//       if (response.data.meta) {
//         setPagination(prev => ({
//           ...prev,
//           currentPage: response.data.meta.currentPage,
//           pageSize: response.data.meta.pageSize,
//           totalItems: response.data.meta.totalCount,
//           totalPages: response.data.meta.totalPages
//         }));
//       }
//     } catch (error) {
//       console.error('Error fetching materials:', error);
//       toast.error('Failed to load materials. Please refresh the page.');
//       setMaterials([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [pagination.currentPage, pagination.pageSize]);

//   useEffect(() => {
//     fetchMaterials(searchTerm);
//   }, [pagination.currentPage, pagination.pageSize, fetchMaterials]);

//   const debouncedSearch = useCallback(
//     debounce((searchValue: string) => {
//       setSearchTerm(searchValue);
//       setPagination(prev => ({
//         ...prev,
//         currentPage: 1
//       }));
//       fetchMaterials(searchValue);
//     }, 500),
//     [fetchMaterials]
//   );

//   const handleSearch = (value: string) => {
//     setSearchTerm(value);
//     debouncedSearch(value);
//   };

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     //if the itemgroup is matching from the array of data then add its id to the newMaterial object
//     const itemGroup = newMaterial.find((category) => category.name === newMaterial.ItemGroup)?.id;
    
//     const material: Material = {
//       itemGroup: itemGroup,
//       itemName: newMaterial.ItemName,
//       description: newMaterial.Description,
//       // subCategory: newMaterial.subCategory,
//       created_at: new Date().toISOString(),
//     };
  
//     try {
//       await axios.post(`${import.meta.env.VITE_BASE_URL}/api/v1/material`, material, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem('authToken')}`
//         }
//       });
      
//       setNewMaterial({ 
//         ItemGroup: '', 
//         ItemName: '', 
//         Description: '',
//         // subCategory: '', 
//       });

//       setIsAddMaterialDialogOpen(false);
      
//       toast.success('Material created successfully!');
      
//       fetchMaterials(searchTerm);
//     } catch (error) {
//       console.error('Error creating material:', error);
//       toast.error('Failed to create material. Please try again.');
//     }
//   };

//   const handleEdit = (material: Material) => {
//     setEditMaterial({
//       ...material,
//     });
//     setIsEditDialogOpen(true);
//   };

//   const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     if (!editMaterial || !editMaterial.id) return;

//     try {
//       await axios.patch(`${import.meta.env.VITE_BASE_URL}/api/v1/material/${editMaterial.id}`, editMaterial, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem('authToken')}`
//         }
//       });
      
//       setIsEditDialogOpen(false);
//       fetchMaterials(searchTerm);
//       toast.success('Material updated successfully!');
//     } catch (error) {
//       console.error('Error updating material:', error);
//       toast.error('Failed to update material. Please try again.');
//     }
//   };

//   const confirmDelete = (material: Material) => {
//     setMaterialToDelete(material);
//     setIsDeleteDialogOpen(true);
//   };

//   const handleDelete = async () => {
//     if (!materialToDelete || !materialToDelete.id) return;
    
//     try {
//       await axios.delete(`${import.meta.env.VITE_BASE_URL}/api/v1/material/${materialToDelete.id}`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem('authToken')}`
//         }
//       });
      
//       setIsDeleteDialogOpen(false);
//       setMaterialToDelete(null);
//       fetchMaterials(searchTerm);
//       toast.success('Material deleted successfully!');
//     } catch (error) {
//       console.error('Error deleting material:', error);
//       toast.error('Failed to delete material. Please try again.');
//     }
//   };

//   const handlePageChange = (newPage: number) => {
//     if (newPage > 0 && newPage <= pagination.totalPages) {
//       setPagination(prev => ({
//         ...prev,
//         currentPage: newPage
//       }));
//     }
//   };

//   const requiredField = <span className="text-red-500 ml-1">*</span>;

//   return (
//     <div className="space-y-6 p-4">
//       <div className="flex justify-end items-center gap-4">
//         <div className="relative w-64">
//           <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
//           <Input
//             placeholder="Search materials..."
//             value={searchTerm}
//             onChange={(e) => handleSearch(e.target.value)}
//             className="pl-8"
//           />
//         </div>
        
//         <Dialog open={isAddMaterialDialogOpen} onOpenChange={setIsAddMaterialDialogOpen}>
//           <DialogTrigger asChild>
//             <Button size="sm" variant="outline" className="mt-1 border-gray-300 text-white"
//             style={{background: "#0f50ba"}}
//             >
//               Add Material
//             </Button>
//           </DialogTrigger>
//           <DialogContent className="bg-white">
//             <div className="flex justify-start">
//               <DialogHeader>
//                 <DialogTitle>Add Material</DialogTitle>
//               </DialogHeader>
//             </div>
//             {/* <form onSubmit={handleSubmit} className="space-y-4">
//               <div className="space-y-2">
//                 <label htmlFor="name" className="text-sm font-medium">
//                   Material Name{requiredField}
//                 </label>
//                 <Input
//                   id="name"
//                   placeholder="e.g., Rice, Corn"
//                   value={newMaterial.name}
//                   onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
//                   required
//                   maxLength={100}
//                 />
//               </div>
// 1. First, define the `itemGroups` array at the component level, before the return statement:

//               <div className="space-y-2">
//                 <label htmlFor="description" className="text-sm font-medium">
//                   Description{requiredField}
//                 </label>
//                 <Textarea
//                   id="description"
//                   placeholder="Enter material description..."
//                   value={newMaterial.description}
//                   onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
//                   required
//                 />
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <label htmlFor="category" className="text-sm font-medium">
//                     Category{requiredField}
//                   </label>
//                   <Select
//                     value={newMaterial.category}
//                     onValueChange={(value) => {
//                       setNewMaterial({
//                         ...newMaterial,
//                         category: value,
//                         subCategory: '' // Reset subCategory when category changes
//                       });
//                     }}
//                   >
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select a category" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {categories.map((category) => (
//                         <SelectItem key={category.name} value={category.name}>
//                           {category.name}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 <div className="space-y-2">
//                   <label htmlFor="subCategory" className="text-sm font-medium">
//                     Sub-Category{requiredField}
//                   </label>
//                   <Select
//                     value={newMaterial.subCategory}
//                     onValueChange={(value) => setNewMaterial({ ...newMaterial, subCategory: value })}
//                     disabled={!newMaterial.category}
//                   >
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select a sub-category" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {categories
//                         .find((category) => category.name === newMaterial.category)
//                         ?.subCategories.map((subCategory) => (
//                           <SelectItem key={subCategory} value={subCategory}>
//                             {subCategory}
//                           </SelectItem>
//                         ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>
//               <DialogFooter className="flex justify-end gap-2">
//               <Button type="submit" className="bg-black text-white hover:bg-gray-800"
//               style={{background: "#0f50ba"}}
//             >
//               Add Material</Button>
//               </DialogFooter>
//             </form> */}
//             <form onSubmit={handleSubmit} className="space-y-4">
//               <div className="space-y-2">
// ```tsx
// // Add this near the top of your component where other state variables are defined
// const [itemGroups] = useState([
//   'Raw Materials',
//   'Finished Goods',
//   'Packaging Materials',
//   'Work in Progress',
//   // Add more item groups as needed
// ]);
//                 <label htmlFor="itemGroup" className="text-sm font-medium">
//                   Item Group{requiredField}
//                 </label>
//                 <Select
//                   // id="itemGroup"
//                   value={newMaterial.ItemGroup}
//                   onValueChange={(value) => setNewMaterial({ ...newMaterial, ItemGroup: value })}
//                   required
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select an item group" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {ItemGroup.map((group) => (
//                       <SelectItem key={group} value={group}>
//                         {group}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div className="space-y-2">
//                 <label htmlFor="itemName" className="text-sm font-medium">
//                   Item Name{requiredField}
//                 </label>
//                 <Input
//                   id="itemName"
//                   placeholder="Enter item name"
//                   value={newMaterial.ItemName}
//                   onChange={(e) => setNewMaterial({ ...newMaterial, ItemName: e.target.value })}
//                   required
//                 />
//               </div>

//               <div className="space-y-2">
//                 <label htmlFor="description" className="text-sm font-medium">
//                   Description
//                 </label>
//                 <Textarea
//                   id="description"
//                   placeholder="Enter description..."
//                   value={newMaterial.Description}
//                   onChange={(e) => setNewMaterial({ ...newMaterial, Description: e.target.value })}
//                 />
//               </div>
              
//               <DialogFooter className="flex justify-end gap-2">
//                 <Button type="submit" className="bg-black text-white hover:bg-gray-800" style={{ background: "#0f50ba" }}>
//                   Add Material
//                 </Button>
//               </DialogFooter>
//             </form>


//           </DialogContent>
//         </Dialog>
//       </div>

//       {/* Edit Material Dialog */}
//       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
//         <DialogContent className="bg-white">
//           <div className="flex justify-start">
//             <DialogHeader>
//               <DialogTitle>Edit Material</DialogTitle>
//             </DialogHeader>
//           </div>
//           <form onSubmit={handleUpdate} className="space-y-4">
//             <div className="space-y-2">
//               <label htmlFor="edit-name" className="text-sm font-medium">
//                 Item Group
//               </label>
//               <Input
//                 id="edit-name"
//                 placeholder="e.g., Rice, Corn"
//                 value={editMaterial?.itemGroup || ''}
//                 onChange={(e) => setEditMaterial(prev => prev ? {...prev, name: e.target.value} : null)}
//                 required
//                 maxLength={100}
//               />
//             </div>

//             <div className="space-y-2">
//               <label htmlFor="edit-description" className="text-sm font-medium">
//                 Description
//               </label>
//               <Textarea
//                 id="edit-description"
//                 placeholder="Enter material description..."
//                 value={editMaterial?.description || ''}
//                 onChange={(e) => setEditMaterial(prev => prev ? {...prev, description: e.target.value} : null)}
//                 required
//               />
//             </div>

//             <div className="grid grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <label htmlFor="edit-category" className="text-sm font-medium">
//                   Category
//                 </label>
//                 <Select
//                   value={editMaterial?.itemGroup || ''}
//                   onValueChange={(value) => {
//                     setEditMaterial(prev => prev ? {
//                       ...prev, 
//                       category: value,
//                       subCategory: '' // Reset subCategory when category changes
//                     } : null);
//                   }}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select a category" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {categories.map((category) => (
//                       <SelectItem key={category.name} value={category.name}>
//                         {category.name}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div className="space-y-2">
//                 <label htmlFor="edit-subCategory" className="text-sm font-medium">
//                   Sub-Category
//                 </label>
//                 <Select
//                   value={editMaterial?.itemName || ''}
//                   onValueChange={(value) => setEditMaterial(prev => prev ? {...prev, subCategory: value} : null)}
//                   disabled={!editMaterial?.itemGroup}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select a sub-category" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {categories
//                       .find((category) => category.name === editMaterial?.itemGroup)
//                       ?.subCategories.map((subCategory) => (
//                         <SelectItem key={subCategory} value={subCategory}>
//                           {subCategory}
//                         </SelectItem>
//                       ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>
//             <DialogFooter className="flex justify-end gap-2">
//             <Button type="submit" className=" text-white"
//               style={{background: "#0f50ba"}}
//             >Update Material
//             </Button>
//             </DialogFooter>
//           </form>
//         </DialogContent>
//       </Dialog>

//       {/* Delete Confirmation Dialog */}
//       <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
//         <DialogContent className="bg-white">
//           <DialogHeader>
//             <DialogTitle className="flex items-center gap-2">
//               <AlertCircle className="h-5 w-5" style={{color: "#0f50ba"}} />
//               <span>Confirm Deletion</span>
//             </DialogTitle>
//           </DialogHeader>
//             <DialogDescription className="py-2">
//               Are you sure you want to delete the material "{materialToDelete?.itemName}"? This action cannot be undone.
//             </DialogDescription>
//           <DialogFooter className="flex justify-end gap-2">
//             <Button 
//               variant="outline" 
//               onClick={() => setIsDeleteDialogOpen(false)}
//             >
//               Cancel
//             </Button>
//             <Button 
//               variant="destructive" 
//               onClick={handleDelete}
//               className="text-white"
//               style={{background: "#0f50ba"}}
//             >
//               Delete
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Materials Table */}
//       <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Item Group</TableHead>
//                 <TableHead>Item Name</TableHead>
//                 <TableHead>Description</TableHead>
//                 {/* <TableHead>Sub-Category</TableHead> */}
//                 <TableHead>Actions</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {loading ? (
//                 <TableRow>
//                   <TableCell colSpan={5} className="text-center py-8">
//                     <div className="flex flex-col items-center justify-center text-gray-500">
//                       <p className="text-lg font-medium">Loading...</p>
//                     </div>
//                   </TableCell>
//                 </TableRow>
//               ) : materials.length > 0 ? (
//                 materials.map((material, index) => (
//                   <TableRow key={material.id || index}>
//                     <TableCell className="py-4">{material.itemGroup}</TableCell>
//                     <TableCell className="py-4">{material.itemName}</TableCell>
//                     <TableCell className="py-4">{material.description}</TableCell>
//                     {/* <TableCell className="py-4">{material.subCategory}</TableCell> */}
//                     <TableCell className="py-4 ">
//                       <div className="flex space-x-2">
//                         <Button 
//                           variant="ghost" 
//                           size="icon" 
//                           onClick={() => handleEdit(material)}
//                           className="h-10 w-10 hover:text-blue-800 hover:bg-blue-50"
//                         >
//                           <Edit className="w-4 h-4" />
//                           <span className="sr-only">Edit</span>
//                         </Button>
//                         <Button 
//                           variant="ghost" 
//                           size="icon" 
//                           onClick={() => confirmDelete(material)}
//                           className="h-10 w-10 hover:text-red-800 hover:bg-red-50"
//                         >
//                           <Trash2 className="h-4 w-4" />
//                           <span className="sr-only">Delete</span>
//                         </Button>
//                       </div>
//                     </TableCell>
//                   </TableRow>
//                 ))
//               ) : (
//                 <TableRow>
//                   <TableCell colSpan={5} className="text-center py-8">
//                     <div className="flex flex-col items-center justify-center text-gray-500">
//                       <p className="text-lg font-medium">No materials found</p>
//                       {searchTerm && (
//                         <p className="text-sm mt-1">No results found for "{searchTerm}"</p>
//                       )}
//                     </div>
//                   </TableCell>
//                 </TableRow>
//               )}
//             </TableBody>
//           </Table>
          
//           {/* Pagination Controls */}
//           <div className="flex justify-between items-center mt-4">
//             <div className="flex items-center space-x-2">
//               <span>Rows per page</span>
//               <Select
//                 value={pagination.pageSize.toString()}
//                 onValueChange={(value) => {
//                   setPagination(prev => ({
//                     ...prev,
//                     pageSize: parseInt(value),
//                     currentPage: 1
//                   }));
//                 }}
//               >
//                 <SelectTrigger className="w-16 cursor-pointer border-gray-300 h-8">
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="10" className="cursor-pointer">10</SelectItem>
//                   <SelectItem value="25" className="cursor-pointer">25</SelectItem>
//                   <SelectItem value="50" className="cursor-pointer">50</SelectItem>
//                   <SelectItem value="100" className="cursor-pointer">100</SelectItem>
//                 </SelectContent>
//               </Select>

//             </div>
//             <div className="text-sm">
//               Page {pagination.currentPage} of {pagination.totalPages}
//             </div>
//             <div className="flex space-x-1">
//               <Button 
//                 variant="outline" 
//                 size="icon"
//                 disabled={pagination.currentPage <= 1}
//                 onClick={() => handlePageChange(1)}
//               >
//                 <ChevronsLeft className="h-4 w-4" />
//               </Button>
//               <Button 
//                 variant="outline" 
//                 size="icon"
//                 disabled={pagination.currentPage <= 1}
//                 onClick={() => handlePageChange(pagination.currentPage - 1)}
//               >
//                 <ChevronLeft className="h-4 w-4" />
//               </Button>
//               <Button 
//                 variant="outline" 
//                 size="icon"
//                 disabled={pagination.currentPage >= pagination.totalPages}
//                 onClick={() => handlePageChange(pagination.currentPage + 1)}
//               >
//                 <ChevronRight className="h-4 w-4" />
//               </Button>
//               <Button 
//                 variant="outline" 
//                 size="icon"
//                 disabled={pagination.currentPage >= pagination.totalPages}
//                 onClick={() => handlePageChange(pagination.totalPages)}
//               >
//                 <ChevronsRight className="h-4 w-4" />
//               </Button>
//             </div>
//           </div>
//     </div>
//   );
// };

// export default Materials;

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Edit, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import debounce from 'lodash/debounce';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface Material {
  id?: string;
  itemGroup: string;
  itemName: string;
  description: string;
  created_at: string;
}

interface Pagination {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

const Materials = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [itemGroups, setItemGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMaterial, setNewMaterial] = useState({
    ItemGroup: '',
    ItemName: '',
    Description: '',
  });
  const [editMaterial, setEditMaterial] = useState<Material | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
  const [isAddMaterialDialogOpen, setIsAddMaterialDialogOpen] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1
  });

  // Fetch Item Groups from Backend
  useEffect(() => {
    const fetchItemGroups = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/v1/item-groups`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        setItemGroups(response.data.data || []);
      } catch (error) {
        console.error('Error fetching item groups:', error);
        toast.error('Failed to load item groups.');
      }
    };
    fetchItemGroups();
  }, []);

  // Fetch Materials
  const fetchMaterials = useCallback(async (search = '') => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: pagination.currentPage,
        limit: pagination.pageSize
      };
      
      if (search.trim()) {
        params.searchTerm = search.trim();
      }
      
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/v1/item-groups`, 
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`
          },
          // params
        }
      );
      
      setMaterials(response.data.data || []);
      
      if (response.data.meta) {
        setPagination(prev => ({
          ...prev,
          currentPage: response.data.meta.currentPage,
          pageSize: response.data.meta.pageSize,
          totalItems: response.data.meta.totalCount,
          totalPages: response.data.meta.totalPages
        }));
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast.error('Failed to load materials. Please refresh the page.');
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.pageSize]);

  useEffect(() => {
    fetchMaterials(searchTerm);
  }, [pagination.currentPage, pagination.pageSize, fetchMaterials]);

  const debouncedSearch = useCallback(
    debounce((searchValue: string) => {
      setSearchTerm(searchValue);
      setPagination(prev => ({
        ...prev,
        currentPage: 1
      }));
      fetchMaterials(searchValue);
    }, 500),
    [fetchMaterials]
  );

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const material: Material = {
      itemGroup: newMaterial.ItemGroup,
      itemName: newMaterial.ItemName,
      description: newMaterial.Description,
      created_at: new Date().toISOString(),
    };
  
    try {
      await axios.post(`${import.meta.env.VITE_BASE_URL}/api/v1/material`, material, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      setNewMaterial({ 
        ItemGroup: '', 
        ItemName: '', 
        Description: '',
      });

      setIsAddMaterialDialogOpen(false);
      
      toast.success('Material created successfully!');
      
      fetchMaterials(searchTerm);
    } catch (error) {
      console.error('Error creating material:', error);
      toast.error('Failed to create material. Please try again.');
    }
  };

  const handleEdit = (material: Material) => {
    setEditMaterial({
      ...material,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editMaterial || !editMaterial.id) return;

    try {
      await axios.patch(`${import.meta.env.VITE_BASE_URL}/api/v1/material/${editMaterial.id}`, editMaterial, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      setIsEditDialogOpen(false);
      fetchMaterials(searchTerm);
      toast.success('Material updated successfully!');
    } catch (error) {
      console.error('Error updating material:', error);
      toast.error('Failed to update material. Please try again.');
    }
  };

  const confirmDelete = (material: Material) => {
    setMaterialToDelete(material);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!materialToDelete || !materialToDelete.id) return;
    
    try {
      await axios.delete(`${import.meta.env.VITE_BASE_URL}/api/v1/material/${materialToDelete.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      setIsDeleteDialogOpen(false);
      setMaterialToDelete(null);
      fetchMaterials(searchTerm);
      toast.success('Material deleted successfully!');
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('Failed to delete material. Please try again.');
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({
        ...prev,
        currentPage: newPage
      }));
    }
  };

  const requiredField = <span className="text-red-500 ml-1">*</span>;

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-end items-center gap-4">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search materials..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <Dialog open={isAddMaterialDialogOpen} onOpenChange={setIsAddMaterialDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="mt-1 border-gray-300 text-white" style={{ background: "#0f50ba" }}>
              Add Material
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <div className="flex justify-start">
              <DialogHeader>
                <DialogTitle>Add Material </DialogTitle>
              </DialogHeader>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="itemGroup" className="text-sm font-medium">
                  Item Group{requiredField}
                </label>
                <Select
                  value={newMaterial.ItemGroup}
                  onValueChange={(value) => setNewMaterial({ ...newMaterial, ItemGroup: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an item group" />
                  </SelectTrigger>
                  <SelectContent>
                    {itemGroups.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="itemName" className="text-sm font-medium">
                  Item Name{requiredField}
                </label>
                <Input
                  id="itemName"
                  placeholder="Enter item name"
                  value={newMaterial.ItemName}
                  onChange={(e) => setNewMaterial({ ...newMaterial, ItemName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  placeholder="Enter description..."
                  value={newMaterial.Description}
                  onChange={(e) => setNewMaterial({ ...newMaterial, Description: e.target.value })}
                />
              </div>

              <DialogFooter className="flex justify-end gap-2">
                <Button type="submit" className="text-white" style={{ background: "#0f50ba" }}>
                  Add Material
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Material Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white">
          <div className="flex justify-start">
            <DialogHeader>
              <DialogTitle>Edit Material</DialogTitle>
            </DialogHeader>
          </div>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="edit-itemGroup" className="text-sm font-medium">
                Item Group{requiredField}
              </label>
              <Select
                value={editMaterial?.itemGroup || ''}
                onValueChange={(value) => setEditMaterial(prev => prev ? { ...prev, itemGroup: value } : null)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an item group" />
                </SelectTrigger>
                <SelectContent>
                  {itemGroups.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-itemName" className="text-sm font-medium">
                Item Name{requiredField}
              </label>
              <Input
                id="edit-itemName"
                placeholder="Enter item name"
                value={editMaterial?.itemName || ''}
                onChange={(e) => setEditMaterial(prev => prev ? { ...prev, itemName: e.target.value } : null)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="edit-description"
                placeholder="Enter description..."
                value={editMaterial?.description || ''}
                onChange={(e) => setEditMaterial(prev => prev ? { ...prev, description: e.target.value } : null)}
              />
            </div>

            <DialogFooter className="flex justify-end gap-2">
              <Button type="submit" className="text-white" style={{ background: "#0f50ba" }}>
                Update Material
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" style={{ color: "#0f50ba" }} />
              <span>Confirm Deletion</span>
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="py-2">
            Are you sure you want to delete the material "{materialToDelete?.itemName}"? This action cannot be undone.
          </DialogDescription>
          <DialogFooter className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              className="text-white"
              style={{ background: "#0f50ba" }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Materials Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item Group</TableHead>
            <TableHead>Item Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8">
                <div className="flex flex-col items-center justify-center text-gray-500">
                  <p className="text-lg font-medium">Loading...</p>
                </div>
              </TableCell>
            </TableRow>
          ) : materials.length > 0 ? (
            materials.map((material, index) => (
              <TableRow key={material.id || index}>
                <TableCell className="py-4">{material.itemGroup}</TableCell>
                <TableCell className="py-4">{material.itemName}</TableCell>
                <TableCell className="py-4">{material.description}</TableCell>
                <TableCell className="py-4">
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEdit(material)}
                      className="h-10 w-10 hover:text-blue-800 hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => confirmDelete(material)}
                      className="h-10 w-10 hover:text-red-800 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8">
                <div className="flex flex-col items-center justify-center text-gray-500">
                  <p className="text-lg font-medium">No materials found</p>
                  {searchTerm && (
                    <p className="text-sm mt-1">No results found for "{searchTerm}"</p>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center space-x-2">
          <span>Rows per page</span>
          <Select
            value={pagination.pageSize.toString()}
            onValueChange={(value) => {
              setPagination(prev => ({
                ...prev,
                pageSize: parseInt(value),
                currentPage: 1
              }));
            }}
          >
            <SelectTrigger className="w-16 cursor-pointer border-gray-300 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10" className="cursor-pointer">10</SelectItem>
              <SelectItem value="25" className="cursor-pointer">25</SelectItem>
              <SelectItem value="50" className="cursor-pointer">50</SelectItem>
              <SelectItem value="100" className="cursor-pointer">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm">
          Page {pagination.currentPage} of {pagination.totalPages}
        </div>
        <div className="flex space-x-1">
          <Button 
            variant="outline" 
            size="icon"
            disabled={pagination.currentPage <= 1}
            onClick={() => handlePageChange(1)}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            disabled={pagination.currentPage <= 1}
            onClick={() => handlePageChange(pagination.currentPage - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            disabled={pagination.currentPage >= pagination.totalPages}
            onClick={() => handlePageChange(pagination.currentPage + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            disabled={pagination.currentPage >= pagination.totalPages}
            onClick={() => handlePageChange(pagination.totalPages)}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Materials;