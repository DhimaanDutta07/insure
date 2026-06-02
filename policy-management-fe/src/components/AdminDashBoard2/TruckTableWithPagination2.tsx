import { 
  // BadgePlus, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { formatDate, TruckRegistration } from "./AdminDashBoard2";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
// import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
// import { Label } from "../ui/label";
// import PurchaseOrderDialog from "./PurchaseOrderDialog";
import TruckDetailSheet from "./TruckDetailSheet";
// import { set } from "lodash";

interface RawMaterial {
  id: string;
  name: string;
}

export type PurchaseOrder = {
  id: string;
  material_id: string;
  quantity: string;
  amount: string;
  document_path: string;
  document_name: string;
  // PO_number: string;
  received_quantity: string;
  unit: string;
  status: string;
  created_at: string;
  updated_at: string;
  description: string;
  // Add these missing properties
  issued_at: string;
  expiry_date: string;
  created_by_id: string;
  assigned_truck_id: string | null;
  material: {
    id: string;
    name: string;
    // Add other properties that might be needed
  };
  created_by: {
    id: string;
    name: string;
  };
};

interface TruckTableWithPaginationProps {
  trucks: TruckRegistration[];
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  trucksPerPage: number;
  setTrucksPerPage: React.Dispatch<React.SetStateAction<number>>;
  onRefreshData: () => Promise<void>;
}

const TruckTableWithPagination2 = ({
  trucks,
  currentPage,
  setCurrentPage,
  trucksPerPage,
  setTrucksPerPage,
  // onRefreshData,
}: TruckTableWithPaginationProps) => {
  const [selectedTruck, setSelectedTruck] = useState<TruckRegistration | null>(
    null
  );
  // const [selectedPO, setSelectedPO] = useState<string>("");
  // const [poDialogOpen, setPoDialogOpen] = useState(false);
  // const [showCreatePO, setShowCreatePO] = useState(false);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  console.log(materials.map((material) => material.name));
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/v1/materials`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          }
        );
        setMaterials(response.data.data);
      } catch (error) {
        console.error("Error fetching materials:", error);
        toast.error("Failed to load materials");
      }
    };

    fetchMaterials();
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(trucks.length / trucksPerPage) || 1; // Ensure at least 1 page even with no data
  const paginatedTrucks = trucks.slice(
    (currentPage - 1) * trucksPerPage,
    currentPage * trucksPerPage
  );

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // const handlePoAssignment = (truck: TruckRegistration) => {
  //   setSelectedTruck(truck);
  //   // If truck has a PO assigned, set it as selected
  //   const assignedPO = truck.vendor.purchase_orders.find(
  //     (po) => po.assigned_truck_id === truck.id
  //   );
  //   if (assignedPO) {
  //     setSelectedPO(assignedPO.id);
  //   } else {
  //     setSelectedPO("");
  //   }
  //   setShowCreatePO(false);
  //   setPoDialogOpen(true);
  // };

  // const handlePoConfirmation = async () => {
  //   if (!selectedTruck || !selectedPO) return;

  //   try {
  //     await axios.post(
  //       `${import.meta.env.VITE_BASE_URL}/api/v1/truck-registrations/${
  //         selectedTruck.id
  //       }/assign-po`,
  //       { po_id: selectedPO },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${localStorage.getItem("authToken")}`,
  //         },
  //       }
  //     );

  //     // Refresh data to get latest changes
  //     await onRefreshData();
      
  //     // Close the dialog
  //     setPoDialogOpen(false);
  //     toast.success("Purchase order assigned successfully!");
  //   } catch (error) {
  //     console.error("Failed to assign PO:", error);
  //     toast.error("Failed to assign PO. Please try again.");
  //   }
  // };

  // const handleCreatePOSuccess = async (newPOdata: PurchaseOrder) => {
  //   try {
  //     console.log("New po dtaa 1", newPOdata)
  //     // First refresh the data
  //     // await onRefreshData();
      
  //     // After data is refreshed, get the updated truck data
  //     const updatedTruck = trucks.find(t => t.id === selectedTruck?.id);
  //     if (updatedTruck) {
  //       // Update the selected truck with new data
  //       setSelectedTruck(updatedTruck);
  //     }

  //     // Show success message
  //     toast.success("Purchase order created successfully!");
      
  //     // Finally, close the create PO view
  //     setShowCreatePO(false);
  //     setSelectedTruck((curr) => {
  //       if (!curr) return curr;
        
  //       const currentPurchaseOrders = curr.vendor.purchase_orders || [];
  //       console.log(currentPurchaseOrders);
  //       return {
  //         ...curr,
  //         vendor: {
  //           ...curr.vendor,
  //           purchase_orders: [...currentPurchaseOrders, newPOdata as PurchaseOrder] // Force the type
  //         }
  //       };
  //     });

  //   } catch (error) {
  //     console.error("Error refreshing data:", error);
  //     toast.error("Created PO but failed to refresh data. Please try again.");
  //   }
  // };

  // const handleCreatePOCancel = () => {
  //   setShowCreatePO(false);
  // };

  // const navigateToPODetail = (poId: string) => {
  //   window.open(`/purchase-orders/${poId}`, '_blank');
  // };

  const handleRowClick = (truck: TruckRegistration) => {
    setSelectedTruck(truck);
    setSheetOpen(true);
  };

  // Helper function to determine the latest stage
  // const getLatestStage = (truck: TruckRegistration) => {
  //   if (truck.status === "Completed") {
  //     return {
  //       status: "Unloaded",
  //       stage: "Unloaded",
  //     };
  //   }

  //   if (truck.status === "Quality") {
  //     if (truck.quality_inspection?.result === "Rejected") {
  //       return {
  //         status: "Rejected",
  //         stage: "Inspected",
  //       };
  //     }
  //     return {
  //       status: "Completed",
  //       stage: "Inspected",
  //     };
  //   }

  //   if (truck.status === "Weighing") {
  //     return {
  //       status: "Completed",
  //       stage: "Weighted",
  //     };
  //   }

  //   if (truck.status === "Queued") {
  //     return {
  //       status: "Completed",
  //       stage: "Registered",
  //     };
  //   }

  //   return { status: "Pending", stage: "Not Started", timestamp: null };
  // };

  // Helper function to get status badge with appropriate color
  // const getStatusBadge = (stage: string) => {
  //   let bgColor = "bg-gray-100 text-gray-800"; // Default
  
  //   switch (stage) {
  //     case "Completed":
  //       bgColor = "bg-green-100 text-green-800";
  //       break;
  //     case "Rejected":
  //       bgColor = "bg-red-100 text-red-800";
  //       break;
  //     case "Pending":
  //       bgColor = "bg-yellow-100 text-yellow-800";
  //       break;
  //     case "Weighted":
  //       bgColor = "bg-purple-100 text-purple-800";
  //       break;
  //     case "Registered":
  //       bgColor = "bg-indigo-100 text-indigo-800";
  //       break;
  //     case "Unloaded":
  //       bgColor = "bg-orange-100 text-orange-800";
  //       break;
  //     case "Not Started":
  //       bgColor = "bg-gray-100 text-gray-800";
  //       break;
  //   }
  
  //   return (
  //     <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor}`}>
  //       {stage}
  //     </span>
  //   );
  // };

  return (
    <div>
      <div className="overflow-x-auto">
        <Table className="border-collapse">
          <TableHeader className="bg-gray-50">
            <TableRow className="border-b border-gray-200">
              <TableHead className="py-3 text-gray-700 font-medium">Inward Number</TableHead>
              <TableHead className="py-3 text-gray-700 font-medium">Site Name</TableHead>
              <TableHead className="py-3 text-gray-700 font-medium">Item Group</TableHead>
              <TableHead className="py-3 text-gray-700 font-medium">Item Name</TableHead>
              <TableHead className="py-3 text-gray-700 font-medium">In Time</TableHead>
              <TableHead className="py-3 text-gray-700 font-medium">Operator Name</TableHead>
              {/* <TableHead className="py-3 text-gray-700 font-medium">Site Name</TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {trucks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center">
                  <div className="text-gray-500 font-medium">
                    No details found with the selected filters.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedTrucks.map((truck, index) => {
                // const latestStage = getLatestStage(truck);
                const isEven = index % 2 === 0;
                
                // Get assigned PO or first PO if available
                // const assignedPO = truck.purchase_order?.PO_number;
                // const displayPO = assignedPO || (truck.vendor.purchase_orders.length > 0 ? truck.vendor.purchase_orders[0] : null);
                // const displayPO = assignedPO || (truck.vendor.purchase_orders.length > 0 ? truck.vendor.purchase_orders[0] : null);


                return (
                  <TableRow 
                    key={truck.id} 
                    className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${isEven ? 'bg-white' : 'bg-gray-50/30'}`}
                  >
                    <TableCell 
                      className="py-4 cursor-pointer"
                      onClick={() => handleRowClick(truck)}
                    >
                      <div className="font-medium text-gray-600">{truck.token_number || "N/A"}</div>
                    </TableCell>
                    <TableCell 
                      className="py-4 text-gray-800 cursor-pointer"
                      onClick={() => handleRowClick(truck)}
                    >
                      {truck.truck.truck_number}
                    </TableCell>
                    <TableCell 
                      className="py-4 cursor-pointer"
                      onClick={() => handleRowClick(truck)}
                    >
                      {/* <div className="text-sm font-medium text-gray-800">
                        {truck.vendor.name}
                      </div> */}
                    </TableCell>
                    <TableCell 
                      className="py-4 text-gray-700 cursor-pointer"
                      onClick={() => handleRowClick(truck)}
                    >
                      {truck.unloading
                        ? `${truck.unloading.net_weight.toLocaleString()} kg`
                        : truck.weighing_inspection
                        ? `${truck.weighing_inspection.net_weight.toLocaleString()} kg`
                        : "Pending"}
                    </TableCell>
                    <TableCell 
                      className="py-4 text-gray-700 cursor-pointer"
                      onClick={() => handleRowClick(truck)}
                    >
                      {truck.arrival_time
                        ? formatDate(truck.arrival_time)
                        : "Pending"}
                    </TableCell>
                    <TableCell 
                      className="py-4 cursor-pointer"
                      onClick={() => handleRowClick(truck)}
                    >
                      <div className="flex items-center gap-2">

                        {/* <span className="text-sm">{getStatusBadge(latestStage.stage)}</span> */}
                      </div>
                    </TableCell>
                    {/* <TableCell className="py-4">
                    {displayPO ? (
                      <div className="group relative inline-flex items-center">
                        <div 
                          className="font-medium hover:text-blue-800 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (truck.purchase_order?.id) {
                              navigateToPODetail(truck.purchase_order.id);
                            }
                          }}
                        >
                          {typeof displayPO === 'string' ? displayPO : displayPO?.PO_number}
                        </div>
                        <div className="hidden group-hover:flex items-center ml-1">
                          <span className="text-gray-500">|</span>
                          <span
                            className="ml-1 text-gray-500 hover:text-blue-600 text-sm cursor-pointer hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePoAssignment(truck);
                            }}
                          >
                            Change
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p
                        className="text-blue-600 underline cursor-pointer hover:text-blue-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePoAssignment(truck);
                        }}
                      >
                        Attach PO
                      </p>
                    )}
                    </TableCell> */}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Use the new TruckDetailSheet component */}
      <TruckDetailSheet 
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        selectedTruck={selectedTruck}
        // onAssignPO={handlePoAssignment}
      />

      {/* PO Assignment Dialog */}
      {/* <Dialog open={poDialogOpen} onOpenChange={(open) => {
        // Only allow closing if we're in the assign view
        if (!showCreatePO) {
          setPoDialogOpen(open);
        }
      }}>
          {!showCreatePO ? (
            <>
            <DialogContent className="sm:max-w-[450px] bg-white rounded-lg border border-gray-200 shadow-lg">
              <DialogHeader className="text-left border-b border-gray-200 pb-4">
                <DialogTitle className="text-left text-xl font-semibold text-gray-800">
                  Assign PO
                </DialogTitle>
                <div className="flex justify-between items-center mt-2">
                  {selectedTruck && (
                    <div className="text-left text-sm text-gray-600">
                      <div className="p-1">
                        <span className="font-medium text-gray-800">Vendor:{" "}</span>
                        <span className="">
                          {selectedTruck.vendor.name}
                        </span>
                      </div>
                      <div className="p-1">
                        <span className="font-medium text-gray-800">Truck:{" "} </span>
                        <span >
                          {selectedTruck.truck.truck_number}
                        </span>
                      </div>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-300 cursor-pointer bg-white hover:bg-gray-50 transition-colors"
                    onClick={() => setShowCreatePO(true)}
                  >
                    <BadgePlus className="h-4 w-4 mr-1 " />
                    New PO
                  </Button>
                </div>
              </DialogHeader>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                  Selected PO
                  </label>
                </div>

                {selectedTruck?.vendor.purchase_orders.length === 0 ? (
                  <p className="text-sm text-gray-500 mt-1">
                    No purchase orders available for this vendor.
                  </p>
                ) : (
                  <RadioGroup
                    value={selectedPO}
                    onValueChange={setSelectedPO}
                    className="space-y-2 border-none"
                  >
                    {selectedTruck?.vendor.purchase_orders.map((po) => (
                      <div
                        key={po.id}
                        className="flex items-center space-x-2 border border-gray-300 p-3 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <RadioGroupItem value={po.id} id={po.id} />
                        <Label htmlFor={po.id} className="flex-1 cursor-pointer">
                          <div className="flex justify-between">
                            <span className="text-gray-800">
                              {po.PO_number}
                            </span>
                          </div>
                          {po.assigned_truck_id === selectedTruck?.id && (
                            <span className="text-xs text-green-600 mt-1">
                              Currently assigned
                            </span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
                <div className="p-1 w-full"></div>

                <div className="flex justify-end gap-3 pt-1 mt-1">
                  <Button
                    variant="outline"
                    className="border-gray-300 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      setPoDialogOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePoConfirmation}
                    className="text-white cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ background: "#0f50ba" }}
                    disabled={!selectedPO}
                  >
                    Confirm
                  </Button>
                </div>
              </div>
            </DialogContent>
            </>
          ) : (
            <DialogContent className="sm:max-w-[450px] bg-white rounded-lg border border-gray-200 shadow-lg" hideCloseButton={true}>
            <PurchaseOrderDialog
              vendors={selectedTruck?.vendor ? [selectedTruck.vendor] : []}
              materials={materials}
              onOrderCreated={(newPOData: PurchaseOrder) => handleCreatePOSuccess(newPOData as PurchaseOrder)}
              onCancel={handleCreatePOCancel}
            />
            </DialogContent>

          )}
      </Dialog> */}

      {/* Pagination controls - Only show if we have data */}
      {trucks.length > 0 && (
        <div className="flex items-center justify-between mt-6 px-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <Select
              value={trucksPerPage.toString()}
              onValueChange={(value) => {
                setTrucksPerPage(Number(value));
                setCurrentPage(1); // Reset to first page when changing rows per page
              }}
            >
              <SelectTrigger className="w-16 cursor-pointer border-gray-300 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10" className="cursor-pointer">
                  10
                </SelectItem>
                <SelectItem value="25" className="cursor-pointer">
                  25
                </SelectItem>
                <SelectItem value="50" className="cursor-pointer">
                  50
                </SelectItem>
                <SelectItem value="100" className="cursor-pointer">
                  100
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1 mx-2">
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
          </div>
          <div className="flex space-x-1">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(1)}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage >= totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage >= totalPages}
                  onClick={() => handlePageChange(totalPages)}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
        </div>
      )}
    </div>
  );
};

export default TruckTableWithPagination2;