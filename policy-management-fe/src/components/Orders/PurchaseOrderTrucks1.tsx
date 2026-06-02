/* eslint-disable react-refresh/only-export-components */
import React from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Truck, AlertTriangle, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import TruckDetailsSheet from "./TruckDetailSheet";

// Types for the API response
export interface TruckRegistration {
  id: string;
  truck_id: string;
  // vendor_id: string;
  token_number: string | null;
  photo: string;
  material_id: string | null;
  arrival_time: string | null;
  weight_in: string | null;
  weight_out: string | null;
  status: "Queued" | "Completed" | "Rejected" | "Registered" | "Weighted" | "Inspected" | "Unloaded" | "Quality" | "Weighing" | null;
  inspector?: {
    name: string;
    phone:string;
    email: string;
  };
  truck: {
    id: string;
    truck_number: string;
  };
  // vendor: {
  //   id: string;
  //   name: string;
  // };
  material: {
    id: string;
    name: string;
  } | null;
  quality_inspection: {
    id: string;
    starch: number;
    moisture: number;
    tfm: number;
    result: string;
    timestamp: string;
    remark:string;
    inspector?: {
        name: string;
        phone:string;
        email: string;
      };
  } | null;
  weighing_inspection: {
    id: string;
    gross_weight: number;
    tare_weight: number;
    net_weight: number;
    timestamp: string;
    inspector?: {
        name: string;
        phone:string;
        email: string;
      };
  } | null;
  unloading: {
    id: string;
    gross_weight: number;
    tare_weight: number;
    net_weight: number;
    starch: number;
    moisture: number;
    tfm: number;
    challan_no: string;
    remarks:string;
    timestamp: string;
    inspector?: {
        name: string;
        phone:string;
        email: string;
      };
  } | null;
}

export interface PurchaseOrderTrucks {
  purchaseOrder: {
    id: string;
    // vendor: {
    //   id: string;
    //   name: string;
    // };
    material: {
      id: string;
      name: string;
    };
    quantity: string;
    received_quantity: string;
    unit: string;
    status: string;
    // PO_number: string;
  };
  trucks: TruckRegistration[];
}

// Helper function to format date
export const formatDate = (dateString: string | null) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Helper function to render status badge
export const getStatusBadge = (status: string | null) => {
  if (!status) return <Badge className="bg-gray-100 text-gray-600">Unknown</Badge>;
  
  switch (status.toLowerCase()) {
    case 'registered':
      return <Badge className="bg-violet-50 text-violet-600 border-violet-200">Registered</Badge>;
    case 'weighted':
      return <Badge className="bg-violet-50 text-violet-600 border-violet-200">Weighted</Badge>;
    case 'inspected':
      return <Badge className="bg-gray-100 text-gray-600 border-gray-200">Inspected</Badge>;
    case 'unloaded':
      return <Badge className="bg-amber-50 text-amber-600 border-amber-200">Unloaded</Badge>;
    case 'weighing':
      return <Badge className="bg-violet-50 text-violet-600 border-violet-200">Weighted</Badge>;
    case 'quality':
      return <Badge className="bg-gray-100 text-gray-600 border-gray-200">Inspected</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-600">{status}</Badge>;
  }
};

// Helper function to get display status
export const getDisplayStatus = (truck: TruckRegistration) => {
  if (truck.unloading) return "Unloaded";
  if (truck.quality_inspection) return "Inspected";
  if (truck.weighing_inspection) return "Weighted";
  if (truck.arrival_time) return "Registered";
  return "Pending";
};

// Helper function to get net weight display
const getNetWeight = (truck: TruckRegistration) => {
  if (truck.unloading) {
    return `${truck.unloading.net_weight} kg`;
  } else if (truck.weighing_inspection) {
    return `${truck.weighing_inspection.net_weight} kg`;
  } else {
    return "Pending";
  }
};

// Separate TruckDetailsSheet Component

const PurchaseOrderTrucks1 = () => {
  const { id } = useParams();
  const [data, setData] = useState<PurchaseOrderTrucks | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [trucksPerPage, setTrucksPerPage] = useState(10);

  useEffect(() => {
    if (!id) return;

    const fetchTrucks = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/v1/purchase-orders/trucks/${id}/detials`, 
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          }
        );
        setData(response.data.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch purchase order trucks");
      } finally {
        setLoading(false);
      }
    };

    fetchTrucks();
  }, [id]);

  if (loading) {
    return (
      <Card className="w-full mt-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full mt-6">
        <CardContent className="p-6">
          <div className="text-center text-red-500 py-8">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <p className="text-xl font-semibold">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.trucks.length === 0) {
    return (
      <Card className="w-full mt-6">
        <CardContent className="p-6">
          <div className="text-center text-gray-500 py-8">
            <Info className="h-12 w-12 mx-auto mb-4" />
            <p className="text-xl font-semibold">No trucks registered for this purchase order.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate progress
  const progressPercentage = data.purchaseOrder.received_quantity && data.purchaseOrder.quantity
    ? Math.min(100, (Number(data.purchaseOrder.received_quantity) / Number(data.purchaseOrder.quantity)) * 100)
    : 0;

  return (
    <>
      <Card className="w-full mt-6">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <Truck className="h-6 w-6 text-blue-600" />
            <CardTitle className="text-2xl font-bold text-gray-800">Registered Trucks</CardTitle>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">Delivery Progress</span>
              <span className="text-sm font-medium text-gray-800">
                {Number(data.purchaseOrder.received_quantity || 0).toLocaleString()} / {Number(data.purchaseOrder.quantity).toLocaleString()} {data.purchaseOrder.unit}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          <TruckTableWithPagination 
            trucks={data.trucks} 
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            trucksPerPage={trucksPerPage}
            setTrucksPerPage={setTrucksPerPage}
          />
        </CardContent>
      </Card>
    </>
  );
};

// Table component with pagination
interface TruckTableWithPaginationProps {
  trucks: TruckRegistration[];
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  trucksPerPage: number;
  setTrucksPerPage: React.Dispatch<React.SetStateAction<number>>;
}

const TruckTableWithPagination = ({ 
  trucks,
  currentPage,
  setCurrentPage, 
  trucksPerPage, 
  setTrucksPerPage,
}: TruckTableWithPaginationProps) => {
  // State for the sheet
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState<TruckRegistration | null>(null);

  if (trucks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No trucks found.</p>
      </div>
    );
  }

  // Pagination logic
  const totalPages = Math.ceil(trucks.length / trucksPerPage);
  const paginatedTrucks = trucks.slice(
    (currentPage - 1) * trucksPerPage,
    currentPage * trucksPerPage
  );

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Handle row click to open the sheet
  const handleRowClick = (truck: TruckRegistration) => {
    setSelectedTruck(truck);
    setIsSheetOpen(true);
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Token Number</TableHead>
              <TableHead>Truck Number</TableHead>
              <TableHead>Net Weight</TableHead>
              <TableHead>In Time</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTrucks.map((truck) => (
              <TableRow 
                key={truck.id} 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleRowClick(truck)}
              >
                <TableCell>{truck.token_number || "N/A"}</TableCell>
                <TableCell>{truck.truck.truck_number}</TableCell>
                <TableCell>{getNetWeight(truck)}</TableCell>
                <TableCell>{formatDate(truck.arrival_time)}</TableCell>
                <TableCell>
                  {getStatusBadge(getDisplayStatus(truck))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Rows per page:</span>
          <Select 
            value={trucksPerPage.toString()} 
            onValueChange={(value) => {
              setTrucksPerPage(Number(value));
              setCurrentPage(1); // Reset to first page when changing rows per page
            }}
          >
            <SelectTrigger className="w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-1 mx-2">
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Use the separate TruckDetailsSheet component */}
      <TruckDetailsSheet
        truck={selectedTruck}
        isOpen={isSheetOpen}
        setIsOpen={setIsSheetOpen}
      />
    </div>
  );
};

export default PurchaseOrderTrucks1;