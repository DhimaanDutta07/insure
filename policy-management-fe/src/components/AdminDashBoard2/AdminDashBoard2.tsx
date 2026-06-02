/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-refresh/only-export-components */
// import React from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import TruckTableWithPagination2 from "./TruckTableWithPagination2";

// Types for the API response
export interface TruckRegistration {
  id: string;
  truck_id: string;
  // vendor_id: string;
  token_number: string | null;
  photo: string;
  material_id: string | null;
  po_id:string |null;
  arrival_time: string | null;
  weight_in: string | null;
  weight_out: string | null;
  status: "Queued" | "Weighing" | "Quality" | "Completed"| "ReOpened" | "Unloaded" | "Rejected" | null;
  inspector?: {
    name: string;
    email: string;
    phone:string;
  };
  truck: {
    id: string;
    truck_number: string;
  };
  // vendor: {
  //   id: string;
  //   name: string;
  //   purchase_orders: {
  //     id: string;
  //     material_id: string;
  //     quantity: string;
  //     amount: string;
  //     document_path: string;
  //     document_name: string;
  //     PO_number:string;
  //     received_quantity: string;
  //     unit: string;
  //     status: string;
  //     created_at: string;
  //     updated_at: string;
  //     issued_at: string;
  //     expiry_date: string;
  //     created_by_id: string;
  //     assigned_truck_id: string | null;
  //     material: {
  //       id: string;
  //       name: string;
  //     };
  //     created_by: {
  //       id: string;
  //       name: string;
  //     };
  //   }[];
  // };
  material: {
    id: string;
    name: string;
  } | null;
  // purchase_order:{
  //   id:string;
  //   PO_number:string;
  // }| null;
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
  }| null;
  unloading: {
    id: string;
    gross_weight: number;
    tare_weight: number;
    net_weight: number;
    starch: number;
    moisture: number;
    tfm: number;
    challan_no: string;
    timestamp: string;
    remarks:string;
    inspector?: {
      name: string;
      phone:string;
      email: string;
    };
  } | null;
}

// Helper functions moved outside of components for reuse
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
    case 'pending':
      return <Badge className="bg-amber-50 text-amber-600 w-22 border-amber-200">Pending</Badge>;
    case 'inprogress':
      return <Badge className="bg-blue-50 text-blue-600 w-22 border-blue-200">In Progress</Badge>;
    case 'completed':
      return <Badge className="bg-green-50 text-green-600 w-22 border-green-200">Completed</Badge>;
    case 'accepted':
      return <Badge className="bg-green-50 text-green-600 w-22 border-green-200">Accepted</Badge>;
    case 'rejected':
      return <Badge className="bg-red-50 text-red-600 w-22 border-red-200">Rejected</Badge>;
    case 'aborted':
      return <Badge className="bg-red-50 text-red-600 w-22 border-red-200">Aborted</Badge>;
    case 'halted':
      return <Badge className="bg-gray-100 w-22 text-gray-600">Halted</Badge>;
    default:
      return <Badge className="bg-gray-100 w-22 text-gray-600">{status}</Badge>;
  }
};

const AdminDashBoard2 = () => {
  const [data, setData] = useState<TruckRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timePeriod, setTimePeriod] = useState("today");
  const [refreshing, setRefreshing] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [trucksPerPage, setTrucksPerPage] = useState(10);
  
  // Dialog state
  // const [dialogOpen, setDialogOpen] = useState(false);
  // const [dialogContent, setDialogContent] = useState<{
  //   title: string;
  //   content: React.ReactElement | null;
  // }>({ title: "", content: null });

  // Helper function to get display text for time period
  const getTimePeriodDisplay = (period: string) => {
    switch (period) {
      case 'today':
        return 'today';
      case 'yesterday':
        return 'yesterday';
      case 'thisWeek':
        return 'this week';
      case 'thisMonth':
        return 'this month';
      default:
        return period;
    }
  };

  const fetchTrucks = async () => {
    setLoading(true);
    setError("");
    try {
      if (!timePeriod) {
        throw new Error('Time period is required');
      }

      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/v1/DashboardDetails/${timePeriod}`, 
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      setData(response.data.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || `Failed to fetch truck data for ${getTimePeriodDisplay(timePeriod)}`);
      } else {
        setError(`Failed to fetch truck data for ${getTimePeriodDisplay(timePeriod)}`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrucks();
  }, [timePeriod]);

  // Handle refresh button click
  const handleRefresh = () => {
    setRefreshing(true);
    fetchTrucks();
  };

  const renderFiltersBar = () => (
    <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center mb-6 gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time period" />
            </SelectTrigger>
            <SelectContent className="border-gray-300 ">
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="thisWeek">This Week</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh} 
            disabled={loading || refreshing}
            className="h-10 w-10 border-gray-300 text-gray-500 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-4">
        <div className="w-full">
          {renderFiltersBar()}
          <Card className="w-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  <p className="text-gray-500">Loading all details for {getTimePeriodDisplay(timePeriod)}...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 py-4">
        <div className="w-full">
          {renderFiltersBar()}
          <Card className="w-full">
            <CardContent className="p-6">
              <div className="text-center text-red-500 py-8">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                <p className="text-xl font-semibold">{error}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // if (!data || data.length === 0) {
  //   return (
  //     <div className="p-2">
  //       <div className="w-full">
  //         {renderFiltersBar()}
  //         <Card className="w-full">
  //           <CardContent className="p-6">
  //             <div className="text-center text-gray-500 py-8">
  //               <Info className="h-12 w-12 mx-auto mb-4" />
  //               <p className="text-xl font-semibold">No trucks registered {getTimePeriodDisplay(timePeriod)}.</p>
  //             </div>
  //           </CardContent>
  //         </Card>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <>
      <div className="p-4">
        <div className="w-full">
          {renderFiltersBar()}
          
          <TruckTableWithPagination2 
            trucks={data} 
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            trucksPerPage={trucksPerPage}
            setTrucksPerPage={setTrucksPerPage}
            onRefreshData={fetchTrucks}
          />
        </div>
      </div>

      {/* Details Dialog */}
      {/* <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader className="text-left">
            <DialogTitle className="text-left">{dialogContent.title}</DialogTitle>
          </DialogHeader>
          {dialogContent.content}
        </DialogContent>
      </Dialog> */}
    </>
  );
};

export default AdminDashBoard2;