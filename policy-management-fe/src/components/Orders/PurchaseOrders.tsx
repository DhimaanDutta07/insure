// /* eslint-disable react-hooks/exhaustive-deps */
// import React, { useState, useEffect } from "react";
// // import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
// import { Input } from "../ui/input";
// import { Button } from "../ui/button";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "../ui/table";
// import {
//   Dialog,
//   DialogTrigger,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "../ui/dialog";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "../ui/select";
// import { Trash2, Eye, Edit, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Search } from "lucide-react";
// import axios from "axios";
// import { toast } from "sonner";
// // import EnhancedPagination from "./EnhancedPagination";
// import { useNavigate, useLocation } from "react-router-dom";
// import CreatePurchaseOrder from "./CreatePurchaseOrder";
// import DeleteConfirmationModal from "./DeleteConfirmationModal";


// interface Vendor {
//   id: string;
//   name: string;
// }

// interface RawMaterial {
//   id: string;
//   name: string;
// }

// interface PurchaseOrder {
//   id?: string;
//   PO_number: string;
//   vendor_id: string;
//   vendor?: Vendor;
//   material_id: string;
//   material?: RawMaterial;
//   quantity: number;
//   amount: number;
//   unit: "kg" | "tons";
//   status: "Pending" | "InProgress" | "Reopened" | "Completed" | "Cancelled"| "";
//   issued_at: string;
//   expiry_date: string;
//   document_path?: string;
//   document_name?: string;
// }

// interface PaginationInfo {
//   total: number;
//   page: number;
//   limit: number;
//   pages: number;
//   currentPage: number;
//   pageSize: number;
//   totalPages: number;
// }

// const ProductOrders = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const queryParams = new URLSearchParams(location.search);

//   const [orders, setOrders] = useState<PurchaseOrder[]>([]);
//   const [vendors, setVendors] = useState<Vendor[]>([]);
//   const [materials, setMaterials] = useState<RawMaterial[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState(queryParams.get("search") || "");
//   const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
//     total: 0,
//     page: parseInt(queryParams.get("page") || "1"),
//     limit: parseInt(queryParams.get("pageSize") || "10"),
//     pages: 0,
//     currentPage: parseInt(queryParams.get("page") || "1"),
//     pageSize: parseInt(queryParams.get("pageSize") || "10"),
//     totalPages: 0,
//   });

//   const [editOrder, setEditOrder] = useState<PurchaseOrder | null>(null);
//   const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
//   const [editDocument, setEditDocument] = useState<File | null>(null);
//   const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
//   // Add state for delete confirmation modal
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//   const [orderToDelete, setOrderToDelete] = useState<string | undefined>(undefined);

//   // Update URL when pagination changes
//   const updateUrlParams = (params: { page?: number; pageSize?: number; search?: string }) => {
//     const newParams = new URLSearchParams(location.search);
    
//     // Always include existing values if not being updated
//     const page = params.page?.toString() || queryParams.get("page") || "1";
//     const pageSize = params.pageSize?.toString() || queryParams.get("pageSize") || "10";
    
//     newParams.set("page", page);
//     newParams.set("pageSize", pageSize);
    
//     if (params.search !== undefined) {
//       if (params.search) {
//         newParams.set("search", params.search);
//       } else {
//         newParams.delete("search");
//       }
//     } else if (queryParams.get("search")) {
//       newParams.set("search", queryParams.get("search")!);
//     }
    
//     navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
//   };

//   // Fetch data when component mounts or URL params change
//   useEffect(() => {
//     const page = parseInt(queryParams.get("page") || "1");
//     const pageSize = parseInt(queryParams.get("pageSize") || "10");
//     const search = queryParams.get("search") || "";

//     setPaginationInfo(prev => ({
//       ...prev,
//       page,
//       currentPage: page,
//       pageSize,
//       limit: pageSize
//     }));
//     setSearchTerm(search);
//   }, [location.search]);

//   useEffect(() => {
//     Promise.all([fetchOrders(), fetchVendors(), fetchMaterials()]);
//   }, [paginationInfo.currentPage, paginationInfo.pageSize, searchTerm]);

//   const fetchOrders = async (search: string = searchTerm) => {
//     setLoading(true);
//     try {
//       let url = `${import.meta.env.VITE_BASE_URL}/api/v1/purchase-orders`;
//       const params: { page: number; limit: number; vendor_name?: string } = {
//         page: paginationInfo.currentPage,
//         limit: paginationInfo.pageSize,
//       };

//       if (search) {
//         url = `${import.meta.env.VITE_BASE_URL}/api/v1/purchase-orders-search`;
//         params.vendor_name = search;
//       }

//       const response = await axios.get(url, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("authToken")}`,
//         },
//         params,
//       });

//       const totalPages = Math.max(
//         1,
//         Math.ceil(response.data.pagination.total / params.limit)
//       );

//       setOrders(response.data.data);
//       setPaginationInfo(prev => ({
//         ...prev,
//         total: response.data.pagination.total,
//         pages: totalPages,
//         totalPages: totalPages,
//         page: params.page,
//         currentPage: params.page
//       }));
//     } catch (error) {
//       console.error("Error fetching purchase orders:", error);
//       toast.error("Failed to load purchase orders. Please refresh the page.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchVendors = async () => {
//     try {
//       const response = await axios.get(
//         `${import.meta.env.VITE_BASE_URL}/api/v1/vendors`,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("authToken")}`,
//           },
//         }
//       );

//       const activeVendors = response.data.data.filter((vendor: { status: string }) => vendor.status === "Active");

//       setVendors(activeVendors);
//     } catch (error) {
//       console.error("Error fetching vendors:", error);
//       toast.error("Failed to load vendors.");
//     }
//   };

//   const fetchMaterials = async () => {
//     try {
//       const response = await axios.get(
//         `${import.meta.env.VITE_BASE_URL}/api/v1/materials`,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("authToken")}`,
//           },
//         }
//       );

//       setMaterials(response.data.data);
//     } catch (error) {
//       console.error("Error fetching materials:", error);
//       toast.error("Failed to load materials.");
//     }
//   };

//   const handleEdit = (order: PurchaseOrder) => {
//     setEditOrder(order);
//     setIsEditDialogOpen(true);
//   };

//   const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     if (!editOrder || !editOrder.id) return;

//     try {
//       const updateData = {
//         PO_number: editOrder.PO_number,
//         vendor_id: editOrder.vendor_id,
//         material_id: editOrder.material_id,
//         quantity: Number(editOrder.quantity),
//         amount: Number(editOrder.amount),
//         unit: editOrder.unit,
//         status: editOrder.status,
//         expiry_date: editOrder.expiry_date
//       };

//       // If there's a document, use FormData
//       if (editDocument) {
//         const formData = new FormData();
//         Object.entries(updateData).forEach(([key, value]) => {
//           formData.append(key, value.toString());
//         });
//         formData.append("document", editDocument);
        
//         await axios.patch(
//           `${import.meta.env.VITE_BASE_URL}/api/v1/purchase-orders/${editOrder.id}`,
//           formData,
//           {
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem("authToken")}`,
//               "Content-Type": "multipart/form-data",
//             },
//           }
//         );
//       } else {
//         // If no document, send JSON directly
//         await axios.patch(
//           `${import.meta.env.VITE_BASE_URL}/api/v1/purchase-orders/${editOrder.id}`,
//           updateData,
//           {
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem("authToken")}`,
//               "Content-Type": "application/json",
//             },
//           }
//         );
//       }

//       await fetchOrders();
//       toast.success("Purchase order updated successfully!");
//       setEditDocument(null);
//       setEditOrder(null);
//       setIsEditDialogOpen(false);
//     } catch (error) {
//       console.error("Error updating purchase order:", error);
//       toast.error("Failed to update purchase order. Please try again.");
//     }
//   };

//   // Updated delete handling
//   const openDeleteModal = (id: string | undefined) => {
//     if (!id) return;
//     setOrderToDelete(id);
//     setIsDeleteModalOpen(true);
//   };

//   const handleDelete = async () => {
//     if (!orderToDelete) return;

//     try {
//       await axios.delete(
//         `${import.meta.env.VITE_BASE_URL}/api/v1/purchase-orders/${orderToDelete}`,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("authToken")}`,
//           },
//         }
//       );

//       fetchOrders();
//       toast.success("Purchase order deleted successfully!");
//       setIsDeleteModalOpen(false);
//       setOrderToDelete(undefined);
//     } catch (error) {
//       console.error("Error deleting purchase order:", error);
//       toast.error("Failed to delete purchase order. Please try again.");
//       setIsDeleteModalOpen(false);
//     }
//   };

//   const handleSearch = (e: React.FormEvent) => {
//     e.preventDefault();
//     updateUrlParams({ page: 1, search: searchTerm });
//   };

//   // const clearSearch = () => {
//   //   updateUrlParams({ page: 1, search: "" });
//   // };

//   const handlePageChange = (newPage: number): void => {
//     if (newPage < 1 || newPage > paginationInfo.totalPages) return;
//     updateUrlParams({ page: newPage });
//   };

//   const handlePageSizeChange = (
//     e: React.ChangeEvent<HTMLSelectElement>
//   ): void => {
//     const newPageSize = parseInt(e.target.value);
//     const newTotalPages = Math.max(1, Math.ceil(paginationInfo.total / newPageSize));
//     const adjustedCurrentPage = Math.min(paginationInfo.currentPage, newTotalPages);
    
//     updateUrlParams({ 
//       page: adjustedCurrentPage,
//       pageSize: newPageSize
//     });
//   };

//   const getStatusClassName = (status: string) => {
//     // Base styles with consistent border radius and fixed width
//     const baseStyle = "rounded-full px-3 py-1 text-xs font-medium inline-block text-center w-22 ";
    
//     switch (status) {
//       case "Pending":
//         return `${baseStyle} bg-yellow-100 text-yellow-800`;
//       case "ReOpened":
//         return `${baseStyle} bg-blue-100 text-blue-800`;
//       case "Delivered":
//         return `${baseStyle} bg-green-100 text-green-800`;
//       case "Completed":
//         return `${baseStyle} bg-green-100 text-green-800`;
//       case "Cancelled":
//         return `${baseStyle} bg-red-100 text-red-800`;
//       case "InProgress":
//         return `${baseStyle} bg-blue-100 text-blue-800`;
//       default:
//         return `${baseStyle} bg-gray-100 text-gray-800`;
//     }
//   };

//   const formatDate = (dateString: string | null) => {
//     if (!dateString) return "N/A";
//     return new Date(dateString).toLocaleDateString('en-US', { 
//       year: 'numeric', 
//       month: 'short', 
//       day: 'numeric',
//     });
//   };

//   return (
//     <div className="space-y-6 p-4 ">
//       {/* Search and Create Button */}
//       <div className="flex justify-end items-center gap-3">
//         <form onSubmit={handleSearch} className="flex gap-2 w-68">
//         <div className="relative w-64">
//           <Search className="absolute left-2 top-3 h-4 w-4 text-gray-500" />
//             <Input
//               placeholder="Search by vendor name"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="pl-8"
//             />
//             {/* {searchTerm && (
//               <Button
//                 type="button"
//                 variant="ghost"
//                 size="icon"
//                 className="absolute right-8 top-0 h-full"
//                 onClick={clearSearch}
//               >
//                 <X className="h-4 w-4" />
//               </Button>
//             )} */}
//           </div>
//         </form>
//         <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
//           <DialogTrigger asChild>
//             <Button
//               size="sm"
//               variant="outline"
//               className="border-gray-300 text-white"
//               style={{ background: "#0f50ba" }}
//               onClick={() => setIsCreateDialogOpen(true)}
//             >
//               Add Purchase Order
//             </Button>
//           </DialogTrigger>
//           <CreatePurchaseOrder
//             vendors={vendors}
//             materials={materials}
//             onOrderCreated={fetchOrders}
//             onClose={() => setIsCreateDialogOpen(false)}
//           />
//         </Dialog>
//       </div>

//       {/* Delete Confirmation Modal */}
//       <DeleteConfirmationModal
//         isOpen={isDeleteModalOpen}
//         onClose={() => setIsDeleteModalOpen(false)}
//         onConfirm={handleDelete}
//       />

//       {/* Edit Order Dialog */}
//       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
//         <DialogContent className="bg-white">
//           <div className="flex justify-start">
//             <DialogHeader>
//               <DialogTitle>Edit PO</DialogTitle>
//             </DialogHeader>
//           </div>
//           <form onSubmit={handleUpdate} className="space-y-4">
//            <div className="space-y-2">
//                     <label htmlFor="po_number" className="text-sm font-medium">
//                       PO Number
//                     </label>
//                     <Input
//                       id="po_number"
//                       type="text"
//                       value={editOrder?.PO_number || ""}
//                       onChange={(e) =>
//                         setEditOrder((prev) =>
//                           prev ? { ...prev, PO_number: e.target.value } : null
//                         )
//                       }
//                       placeholder="Enter purchase order number"
//                       required
//                     />
//                   </div>  
//             <div className="grid grid-cols-2 items-center gap-4">
//               <div className="space-y-2">
//                 <label htmlFor="edit-vendor" className="text-sm font-medium">
//                   Vendor
//                 </label>
//                 <Select
//                   value={editOrder?.vendor_id || ""}
//                   onValueChange={(value) =>
//                     setEditOrder((prev) =>
//                       prev ? { ...prev, vendor_id: value } : null
//                     )
//                   }
//                   required
//                 >
//                   <SelectTrigger className="w-full">
//                     <SelectValue placeholder="Select vendor" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {vendors.map((vendor) => (
//                       <SelectItem key={vendor.id} value={vendor.id}>
//                         {vendor.name}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div className="space-y-2">
//                 <label htmlFor="edit-material" className="text-sm font-medium">
//                   Raw Material
//                 </label>
//                 <Select
//                   value={editOrder?.material_id || ""}
//                   onValueChange={(value) =>
//                     setEditOrder((prev) =>
//                       prev ? { ...prev, material_id: value } : null
//                     )
//                   }
//                   required
//                 >
//                   <SelectTrigger className="w-full">
//                     <SelectValue placeholder="Select material" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {materials.map((material) => (
//                       <SelectItem key={material.id} value={material.id}>
//                         {material.name}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>
//             <div className="grid grid-cols-2 items-center gap-4">
//               <div className="space-y-2">
//                 <label htmlFor="edit-quantity" className="text-sm font-medium">
//                   Quantity
//                 </label>
//                 <Input
//                   id="edit-quantity"
//                   type="number"
//                   step="0.01"
//                   min="0.01"
//                   value={editOrder?.quantity || ""}
//                   onChange={(e) =>
//                     setEditOrder((prev) =>
//                       prev
//                         ? { ...prev, quantity: parseFloat(e.target.value) }
//                         : null
//                     )
//                   }
//                   required
//                 />
//               </div>

//               <div className="space-y-2">
//                 <label htmlFor="edit-amount" className="text-sm font-medium">
//                   Amount
//                 </label>
//                 <Input
//                   id="edit-amount"
//                   type="number"
//                   step="0.01"
//                   min="0.01"
//                   value={editOrder?.amount || ""}
//                   onChange={(e) =>
//                     setEditOrder((prev) =>
//                       prev
//                         ? { ...prev, amount: parseFloat(e.target.value) }
//                         : null
//                     )
//                   }
//                   required
//                 />
//               </div>
//             </div>
//             <div className="grid grid-cols-2 items-center gap-4">
//               <div className="space-y-2">
//                 <label htmlFor="edit-unit" className="text-sm font-medium">
//                   Unit
//                 </label>
//                 <Select
//                   value={editOrder?.unit || "kg"}
//                   onValueChange={(value: "kg" | "tons") =>
//                     setEditOrder((prev) =>
//                       prev ? { ...prev, unit: value } : null
//                     )
//                   }
//                   required
//                 >
//                   <SelectTrigger className="w-full">
//                     <SelectValue placeholder="Select unit" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="kg">KG</SelectItem>
//                     <SelectItem value="tons">TON</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div className="space-y-2">
//                 <label htmlFor="edit-status" className="text-sm font-medium">
//                   Status
//                 </label>
//                 <Select
//                   value={editOrder?.status || "Pending"}
//                   onValueChange={(
//                     value:
//                       | "Pending"
//                       | "InProgress"
//                       | "Reopened"
//                       | "Completed"
//                       | "Cancelled"
//                   ) =>
//                     setEditOrder((prev) =>
//                       prev ? { ...prev, status: value } : null
//                     )
//                   }
//                   required
//                 >
//                   <SelectTrigger className="w-full">
//                     <SelectValue placeholder="Select status" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="Pending">Created</SelectItem>
//                     <SelectItem value="InProgress">In Progress</SelectItem>
//                     <SelectItem value="ReOpened">Re Opened</SelectItem>
//                     <SelectItem value="Completed">Completed</SelectItem>
//                     {/* <SelectItem value="Cancelled">Cancelled</SelectItem> */}
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>
//             <div className="grid grid-cols-2 items-center gap-4">
//               <div className="space-y-2">
//                 <label htmlFor="edit-expiry" className="text-sm font-medium">
//                   Expiry Date
//                 </label>
//                 <Input
//                   id="edit-expiry"
//                   type="date"
//                   value={
//                     editOrder?.expiry_date
//                       ? editOrder.expiry_date.split("T")[0]
//                       : ""
//                   }
//                   onChange={(e) =>
//                     setEditOrder((prev) =>
//                       prev ? { ...prev, expiry_date: e.target.value } : null
//                     )
//                   }
//                   required
//                 />
//               </div>
//             </div>
//             <div className="space-y-2">
//               <label htmlFor="edit-document" className="text-sm font-medium">
//                 Document (Optional)
//               </label>
//               <Input
//                 id="edit-document"
//                 type="file"
//                 onChange={(e) => {
//                   if (e.target.files && e.target.files[0]) {
//                     setEditDocument(e.target.files[0]);
//                   }
//                 }}
//               />
//               {editOrder?.document_name && !editDocument && (
//                 <p className="text-sm text-gray-500">
//                   Current: {editOrder.document_name}
//                 </p>
//               )}
//               {editDocument && (
//                 <p className="text-sm text-gray-500">
//                   New: {editDocument.name}
//                 </p>
//               )}
//             </div>
//             <DialogFooter className="flex justify-end gap-2">
//               <Button
//                 type="submit"
//                 className=" text-white "
//                 style={{ background: "#0f50ba" }}
//               >
//                 Update PO
//               </Button>
//             </DialogFooter>
//           </form>
//         </DialogContent>
//       </Dialog>

//       {/* Orders Table */}
//       {loading ? (
//         <div className="py-4 text-center text-gray-500">
//           Loading purchase orders...
//         </div>
//       ) : (
//         <>
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>PO Number</TableHead>
//                 <TableHead>Vendor</TableHead>
//                 <TableHead>Material</TableHead>
//                 <TableHead>Quantity</TableHead>
//                 <TableHead>Amount ₹</TableHead>
//                 <TableHead>Issued Date</TableHead>
//                 <TableHead>Expiry Date</TableHead>
//                 <TableHead className="text-center">Status</TableHead>
//                 <TableHead>Actions</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {orders.length === 0 ? (
//                 <TableRow>
//                   <TableCell
//                     colSpan={8}
//                     className="text-center py-4 text-gray-500"
//                   >
//                     No purchase orders found. Create your first order.
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 orders.map((order) => (
//                   <TableRow key={order.id}>
//                     <TableCell className="py-3">
//                       {order.PO_number || "N/A"}
//                     </TableCell>
//                     <TableCell className="py-3">
//                       {order.vendor?.name || "Unknown Vendor"}
//                     </TableCell>
//                     <TableCell className="py-3">
//                       {order.material?.name || "Unknown Material"}
//                     </TableCell>
//                     <TableCell className="py-3 text-right">
//                       {order.quantity} {order.unit}
//                     </TableCell>
//                     <TableCell className="py-3 text-right">
//                       {order.amount || "NA"}
//                     </TableCell>
//                     <TableCell className="py-3">
//                       {formatDate(order.issued_at)}
//                     </TableCell>
//                     <TableCell className="py-3">
//                       {formatDate(order.expiry_date)}
//                     </TableCell>
//                     <TableCell className="py-3 text-center">
//                       <span
//                         className={`px-2 py-1 rounded text-xs  ${getStatusClassName(
//                           order.status
//                         )}`}
//                       >
//                         {order.status === "InProgress"
//                           ? "In Progress"
//                           : order.status === "Reopened"
//                           ? "Re Opened"
//                           : order.status === "Pending"
//                           ? "Created"
//                           : order.status}
//                       </span>
//                     </TableCell>
//                     <TableCell className="py-3">
//                       <div className="flex space-x-2">
//                         <Button
//                           variant="ghost"
//                           size="icon"
//                           onClick={() => handleEdit(order)}
//                           className="h-8 w-8 text-black hover:text-blue-800 hover:bg-blue-50"
//                         >
//                           <Edit className="h-6 w-6" />
//                           <span className="sr-only">Edit</span>
//                         </Button>
//                         <Button
//                           variant="ghost"
//                           size="icon"
//                           onClick={() =>
//                             navigate(`/purchase-orders/${order.id}`)
//                           }
//                           className="h-8 w-8 text-black hover:text-green-800 hover:bg-green-50"
//                         >
//                           <Eye className="h-6 w-6" />
//                           <span className="sr-only">Show</span>
//                         </Button>
//                         <Button
//                           variant="ghost"
//                           size="icon"
//                           onClick={() => openDeleteModal(order.id)}
//                           className="h-8 w-8 text-black hover:text-red-800 hover:bg-red-50"
//                         >
//                           <Trash2 className="h-6 w-6" />
//                           <span className="sr-only">Delete</span>
//                         </Button>
//                       </div>
//                     </TableCell>
//                   </TableRow>
//                 ))
//               )}
//             </TableBody>
//           </Table>

//           {/* Pagination - only show if not empty and not loading */}
//           {!loading && orders.length > 0 && (
//             <div className="flex justify-between items-center mt-4">
//               <div className="flex items-center space-x-2">
//                 <span>Rows per page</span>
//                 <Select
//                   value={paginationInfo.pageSize.toString()}
//                   onValueChange={(value) => handlePageSizeChange({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
//                 >
//                   <SelectTrigger className="w-16 cursor-pointer border-gray-300 h-8 rounded">
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="10" className="cursor-pointer">
//                       10
//                     </SelectItem>
//                     <SelectItem value="25" className="cursor-pointer">
//                       25
//                     </SelectItem>
//                     <SelectItem value="50" className="cursor-pointer">
//                       50
//                     </SelectItem>
//                     <SelectItem value="100" className="cursor-pointer">
//                       100
//                     </SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div className="text-sm">
//                 Page {paginationInfo.currentPage} of {paginationInfo.totalPages}
//               </div>

//               <div className="flex space-x-1">
//                 <Button
//                   variant="outline"
//                   size="icon"
//                   disabled={paginationInfo.currentPage <= 1}
//                   onClick={() => handlePageChange(1)}
//                 >
//                   <ChevronsLeft className="h-4 w-4" />
//                 </Button>
//                 <Button
//                   variant="outline"
//                   size="icon"
//                   disabled={paginationInfo.currentPage <= 1}
//                   onClick={() => handlePageChange(paginationInfo.currentPage - 1)}
//                 >
//                   <ChevronLeft className="h-4 w-4" />
//                 </Button>
//                 <Button
//                   variant="outline"
//                   size="icon"
//                   disabled={paginationInfo.currentPage >= paginationInfo.totalPages}
//                   onClick={() => handlePageChange(paginationInfo.currentPage + 1)}
//                 >
//                   <ChevronRight className="h-4 w-4" />
//                 </Button>
//                 <Button
//                   variant="outline"
//                   size="icon"
//                   disabled={paginationInfo.currentPage >= paginationInfo.totalPages}
//                   onClick={() => handlePageChange(paginationInfo.totalPages)}
//                 >
//                   <ChevronsRight className="h-4 w-4" />
//                 </Button>
//               </div>
//             </div>
//           )}
//         </>
//       )}
//       {/* </CardContent>
//       </Card> */}
//     </div>
//   );
// };

// export default ProductOrders;
