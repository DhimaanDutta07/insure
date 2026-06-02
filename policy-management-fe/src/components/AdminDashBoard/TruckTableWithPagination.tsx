// import { ChevronLeft, ChevronRight, Eye, Plus } from "lucide-react";
// import { Button } from "../ui/button";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
// import { formatDate, getStatusBadge, TruckRegistration } from "./AdminDashBoard1";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
// import { useState, useEffect } from "react";
// import axios from "axios";
// import CreatePurchaseOrder from "../Orders/CreatePurchaseOrder";
// import { toast } from "sonner";

// interface RawMaterial {
//   id: string;
//   name: string;
// }

// interface TruckTableWithPaginationProps {
//   trucks: TruckRegistration[];
//   currentPage: number;
//   setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
//   trucksPerPage: number;
//   setTrucksPerPage: React.Dispatch<React.SetStateAction<number>>;
//   onViewRegistration: (truck: TruckRegistration) => void;
//   onViewWeighing: (truck: TruckRegistration) => void;
//   onViewQuality: (truck: TruckRegistration) => void;
//   onViewUnloading: (truck: TruckRegistration) => void;
// }

// const TruckTableWithPagination = ({ 
//   trucks, 
//   currentPage, 
//   setCurrentPage, 
//   trucksPerPage, 
//   setTrucksPerPage,
//   onViewRegistration,
//   onViewWeighing,
//   onViewQuality,
//   onViewUnloading
// }: TruckTableWithPaginationProps) => {
//   const [selectedTruck, setSelectedTruck] = useState<TruckRegistration | null>(null);
//   const [selectedPO, setSelectedPO] = useState<string>("");
//   const [poDialogOpen, setPoDialogOpen] = useState(false);
//   const [showCreatePO, setShowCreatePO] = useState(false);
//   const [materials, setMaterials] = useState<RawMaterial[]>([]);

//   useEffect(() => {
//     const fetchMaterials = async () => {
//       try {
//         const response = await axios.get(
//           `${import.meta.env.VITE_BASE_URL}/api/v1/get-materials`,
//           {
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem("authToken")}`,
//             },
//           }
//         );
//         setMaterials(response.data.data);
//       } catch (error) {
//         console.error("Error fetching materials:", error);
//         toast.error("Failed to load materials");
//       }
//     };

//     fetchMaterials();
//   }, []);

//   if (trucks.length === 0) {
//     return (
//       <div className="text-center py-8 text-gray-500">
//         <p>No trucks found with the selected filters.</p>
//       </div>
//     );
//   }

//   // Pagination logic
//   const totalPages = Math.ceil(trucks.length / trucksPerPage);
//   const paginatedTrucks = trucks.slice(
//     (currentPage - 1) * trucksPerPage,
//     currentPage * trucksPerPage
//   );

//   const handlePageChange = (newPage: number) => {
//     if (newPage > 0 && newPage <= totalPages) {
//       setCurrentPage(newPage);
//     }
//   };

//   const handlePoAssignment = (truck: TruckRegistration) => {
//     setSelectedTruck(truck);
//     // If truck has a PO assigned, set it as selected
//     const assignedPO = truck.vendor.purchase_orders.find(po => po.assigned_truck_id === truck.id);
//     if (assignedPO) {
//       setSelectedPO(assignedPO.id);
//     } else {
//       setSelectedPO("");
//     }
//     setShowCreatePO(false);
//     setPoDialogOpen(true);
//   };

//   const handlePoConfirmation = async () => {
//     if (!selectedTruck || !selectedPO) return;

//     try {
//       await axios.post(
//         `${import.meta.env.VITE_BASE_URL}/api/v1/truck-registrations/${selectedTruck.id}/assign-po`,
//         { po_id: selectedPO },
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("authToken")}`,
//           },
//         }
//       );
//       setPoDialogOpen(false);
//       // Refresh data after successful assignment
//       window.location.reload();
//     } catch (error) {
//       console.error("Failed to assign PO:", error);
//       toast.error("Failed to assign PO. Please try again.");
//     }
//   };

//   const handleCreatePOSuccess = () => {
//     setShowCreatePO(false);
//     // Refresh the page to get updated PO list
//     window.location.reload();
//   };

//   // Helper function to determine stage status
//   const getStageStatus = (truck: TruckRegistration, stage: 'registration' | 'weighing' | 'quality' | 'unloading') => {
//     switch (stage) {
//       case 'registration':
//         return truck.arrival_time ? 'Completed' : 'Pending';
//       case 'weighing':
//         if (!truck.arrival_time) return 'Pending';
//         return truck.WeighingInspection && truck.WeighingInspection.length > 0 ? 'Completed' : 'InProgress';
//       case 'quality':
//         if (!truck.WeighingInspection || truck.WeighingInspection.length === 0) return 'Pending';
//         if (!truck.quality_inspection) return 'InProgress';
//         return truck.quality_inspection.result;
//       case 'unloading':
//         if (!truck.quality_inspection) return 'Pending';
//         if (truck.quality_inspection.result === 'Rejected') return 'Halted';
//         if (!truck.unloading) return 'InProgress';
//         return 'Completed';
//     }
//   };

//   return (
//     <div>
//       <div className="overflow-x-auto">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>Truck Number</TableHead>
//               <TableHead>Token Number</TableHead>
//               <TableHead>Vendor</TableHead>
//               <TableHead>Purchase Order</TableHead>
//               <TableHead>Net Weight</TableHead>
//               <TableHead>Truck Registration</TableHead>
//               <TableHead>Weighing</TableHead>
//               <TableHead>Quality</TableHead>
//               <TableHead>Unloading</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {paginatedTrucks.map((truck) => (
//               <TableRow key={truck.id}>
//                 <TableCell className="font-medium">
//                   {truck.truck.truck_number}
//                 </TableCell>
//                 <TableCell>
//                   <div className="text-xs">
//                     {truck.token_number || "N/A"}
//                   </div>
//                 </TableCell>
//                 <TableCell>
//                   <div className="text-sm font-medium">
//                     {truck.vendor.name}
//                   </div>
//                 </TableCell>
//                 <TableCell>
//                   <div className="flex flex-col space-y-2">
//                     {truck.vendor.purchase_orders.length > 0 ? (
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         className="flex w-36 border-gray-300 items-center gap-1"
//                         onClick={() => handlePoAssignment(truck)}
//                       >
//                         View/Change PO
//                       </Button>
//                     ) : (
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         className="flex w-36 border-gray-300 items-center gap-1"
//                         onClick={() => handlePoAssignment(truck)}
//                       >
//                         Assign PO
//                       </Button>
//                     )}
//                   </div>
//                 </TableCell>
//                 <TableCell>
//                   {truck.unloading 
//                     ? `${truck.unloading.net_weight.toLocaleString()} kg`
//                     : truck.WeighingInspection && truck.WeighingInspection.length > 0
//                       ? `${truck.WeighingInspection[0].net_weight.toLocaleString()} kg`
//                       : "Pending"}
//                 </TableCell>
                
//                 {/* Truck Registration Column */}
//                 <TableCell>
//                   <div className="flex flex-col space-y-2">
//                     <div className="flex items-center gap-2">
//                       {getStatusBadge(getStageStatus(truck, 'registration'))}
//                       {truck.arrival_time && (
//                         <Button 
//                           variant="outline" 
//                           size="sm" 
//                           className="flex border-gray-300 items-center gap-1 h-6 px-2"
//                           onClick={() => onViewRegistration(truck)}
//                         >
//                           <Eye className="h-3 w-3" />
//                         </Button>
//                       )}
//                     </div>
//                     {truck.arrival_time && (
//                       <div className="text-xs text-gray-500">
//                         {formatDate(truck.arrival_time)}
//                       </div>
//                     )}
//                   </div>
//                 </TableCell>
                
//                 {/* Weighing Column */}
//                 <TableCell>
//                   <div className="flex flex-col space-y-2">
//                     <div className="flex items-center gap-2">
//                       {getStatusBadge(getStageStatus(truck, 'weighing'))}
//                       {truck.WeighingInspection && truck.WeighingInspection.length > 0 && (
//                         <Button 
//                           variant="outline" 
//                           size="sm" 
//                           className="flex border-gray-300 items-center gap-1 h-6 px-2"
//                           onClick={() => onViewWeighing(truck)}
//                         >
//                           <Eye className="h-3 w-3" />
//                         </Button>
//                       )}
//                     </div>
//                     {truck.WeighingInspection && truck.WeighingInspection.length > 0 && (
//                       <div className="text-xs text-gray-500">
//                         {formatDate(truck.WeighingInspection[0].timestamp)}
//                       </div>
//                     )}
//                   </div>
//                 </TableCell>
                
//                 {/* Quality Column */}
//                 <TableCell>
//                   <div className="flex flex-col space-y-2">
//                     <div className="flex items-center gap-2">
//                       {getStatusBadge(getStageStatus(truck, 'quality'))}
//                       {truck.quality_inspection && (
//                         <Button 
//                           variant="outline" 
//                           size="sm" 
//                           className="flex border-gray-300 items-center gap-1 h-6 px-2"
//                           onClick={() => onViewQuality(truck)}
//                         >
//                           <Eye className="h-3 w-3" />
//                         </Button>
//                       )}
//                     </div>
//                     {truck.quality_inspection && (
//                       <div className="text-xs text-gray-500">
//                         {formatDate(truck.quality_inspection.timestamp)}
//                       </div>
//                     )}
//                   </div>
//                 </TableCell>
                
//                 {/* Unloading Column */}
//                 <TableCell>
//                   <div className="flex flex-col space-y-2">
//                     <div className="flex items-center gap-2">
//                       {getStatusBadge(getStageStatus(truck, 'unloading'))}
//                       {truck.unloading && (
//                         <Button 
//                           variant="outline" 
//                           size="sm" 
//                           className="flex border-gray-300 items-center gap-1 h-6 px-2"
//                           onClick={() => onViewUnloading(truck)}
//                         >
//                           <Eye className="h-3 w-3" /> 
//                         </Button>
//                       )}
//                     </div>
//                     {truck.unloading && (
//                       <div className="text-xs text-gray-500">
//                         {formatDate(truck.unloading.timestamp)}
//                       </div>
//                     )}
//                   </div>
//                 </TableCell>
//               </TableRow>
//             ))}
//           </TableBody>
//         </Table>
//       </div>

//       {/* PO Assignment Dialog */}
//       <Dialog open={poDialogOpen} onOpenChange={setPoDialogOpen}>
//         <DialogContent className="sm:max-w-[600px] bg-white">
//           <DialogHeader>
//             <DialogTitle className="text-left">
//               {showCreatePO ? "Create New Purchase Order" : "Assign Purchase Order"}
//             </DialogTitle>
//           </DialogHeader>
//           {showCreatePO ? (
//             <CreatePurchaseOrder 
//             vendors={selectedTruck?.vendor ? [selectedTruck.vendor] : []}
//               materials={materials}
//               onOrderCreated={handleCreatePOSuccess}
//             />
//           ) : (
//             <div className="space-y-4">
//               <div>
//                 <label className="text-sm font-medium text-gray-700">Current Purchase Order</label>
//                 {selectedTruck?.vendor.purchase_orders.length === 0 ? (
//                   <p className="text-sm text-gray-500 mt-1">No purchase orders available for this vendor.</p>
//                 ) : (
//                   <Select value={selectedPO} onValueChange={setSelectedPO}>
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select a purchase order" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {selectedTruck?.vendor.purchase_orders.map((po) => (
//                         <SelectItem key={po.id} value={po.id}>
//                           {po.material.name} - {po.quantity} {po.unit}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 )}
//               </div>
              
//               <Button
//                 variant="outline"
//                 className="w-full border-dashed border-2 border-gray-300"
//                 onClick={() => setShowCreatePO(true)}
//               >
//                 <Plus className="h-4 w-4 mr-2" />
//                 Create New Purchase Order
//               </Button>

//               <div className="flex justify-end gap-3">
//                 <Button 
//                   variant="outline" 
//                   className="border-gray-300" 
//                   onClick={() => {
//                     if (showCreatePO) {
//                       setShowCreatePO(false);
//                     } else {
//                       setPoDialogOpen(false);
//                     }
//                   }}
//                 >
//                   Cancel
//                 </Button>
//                 {!showCreatePO && (
//                   <Button 
//                     onClick={handlePoConfirmation} 
//                     className="text-white"
//                     style={{background: "#0f50ba"}}
//                     disabled={!selectedPO}
//                   >
//                     Confirm
//                   </Button>
//                 )}
//               </div>
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>

//       {/* Pagination controls */}
//       <div className="flex items-center justify-between mt-4">
//         <div className="flex items-center gap-2">
//           <span className="text-sm text-gray-600">Rows per page:</span>
//           <Select 
//             value={trucksPerPage.toString()} 
//             onValueChange={(value) => {
//               setTrucksPerPage(Number(value));
//               setCurrentPage(1); // Reset to first page when changing rows per page
//             }}
//           >
//             <SelectTrigger className="w-16">
//               <SelectValue />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="5">5</SelectItem>
//               <SelectItem value="10">10</SelectItem>
//               <SelectItem value="20">20</SelectItem>
//               <SelectItem value="50">50</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>

//         <div className="flex items-center gap-1">
//           <Button 
//             variant="outline" 
//             size="sm" 
//             onClick={() => handlePageChange(currentPage - 1)}
//             disabled={currentPage === 1}
//           >
//             <ChevronLeft className="h-4 w-4" />
//           </Button>
          
//           <div className="flex items-center gap-1 mx-2">
//             <span className="text-sm">
//               Page {currentPage} of {totalPages}
//             </span>
//           </div>
          
//           <Button 
//             variant="outline" 
//             size="sm" 
//             onClick={() => handlePageChange(currentPage + 1)}
//             disabled={currentPage === totalPages}
//           >
//             <ChevronRight className="h-4 w-4" />
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TruckTableWithPagination; 