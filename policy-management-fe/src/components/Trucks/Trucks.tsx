/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback } from "react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../../components/ui/dialog";
import {
  Trash2,
  // Check,
  // ChevronsUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import axios from "axios";
import { toast } from "sonner";
import debounce from "lodash/debounce";
// import { cn } from "../../lib/utils";

// interface Vendor {
//   id: string;
//   name: string;
// }

interface Truck {
  id: string;
  // vendor_id: string;
  truck_number: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  // vendor: {
  //   id: string;
  //   name: string;
  // };
}

interface PaginationMeta {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

interface TruckResponse {
  status: string;
  message: string;
  data: Truck[];
  meta: PaginationMeta;
}

const Trucks = () => {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  // const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  // const [vendorSearchTerm, setVendorSearchTerm] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [truckToDelete, setTruckToDelete] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });
  const [formData, setFormData] = useState({
    truck_number: "",
    // vendor_id: "",
  });

  // Fetch vendors and trucks data
  useEffect(() => {
    // fetchVendors();
    fetchTrucks();
  }, []);

  // const fetchVendors = async () => {
  //   try {
  //     const vendorsResponse = await axios.get(
  //       `${import.meta.env.VITE_BASE_URL}/api/v1/vendors`,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${localStorage.getItem("authToken")}`,
  //         },
  //       }
  //     );
  //     setVendors(vendorsResponse.data.data);
  //   } catch (error) {
  //     console.error("Error fetching vendors:", error);
  //     toast.error("Failed to fetch vendors");
  //   }
  // };

  const fetchTrucks = async (
    page = pagination.currentPage,
    limit = pagination.limit
  ) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      console.log(`Fetching page ${page} with limit ${limit}`); // Debug log
      const response = await axios.get<TruckResponse>(
        `${import.meta.env.VITE_BASE_URL}/api/v1/trucks`,
        {
          params: {
            page,
            limit,
            search: searchTerm.trim(),
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      console.log('Response meta:', response.data.meta); // Debug log
      setTrucks(response.data.data);
      setPagination({
        currentPage: response.data.meta?.currentPage || 1,
        totalPages: response.data.meta?.totalPages || 1,
        totalItems: response.data.meta.totalCount || 0,
        limit: limit
      });
    } catch (error) {
      console.error("Error fetching trucks:", error);
      toast.error("Failed to fetch trucks");
      setTrucks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce(async (searchValue: string) => {
      if (!searchValue.trim()) {
        fetchTrucks(1, pagination.limit);
        return;
      }
      console.log("Search term:", searchValue);
      setIsLoading(true);
      try {
        const response = await axios.get<TruckResponse>(
          `${import.meta.env.VITE_BASE_URL}/api/v1/search/truck`,
          {
            params: {
              page: 1,
              limit: pagination.limit,
              search: searchValue.trim(),
            },
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          }
        );
        console.log("Search results:", response.data.data);
        setTrucks(response.data.data);
        setPagination({
          currentPage: 1,
          totalPages: response.data.meta?.totalPages || 1,
          totalItems: response.data.meta.totalCount || 0,
          limit: pagination.limit
        });
      } catch (error) {
        console.error("Error searching trucks:", error);
        toast.error("Failed to search trucks");
        setTrucks([]);
      } finally {
        setIsLoading(false);
      }
    }, 500),
    [pagination.limit]
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim()) {
      debouncedSearch(value);
    } else {
      fetchTrucks(1, pagination.limit);
    }
  };

  const handlePageChange = (newPage: number) => {
    console.log(`Changing to page ${newPage}`); // Debug log
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({
        ...prev,
        currentPage: newPage
      }));
      fetchTrucks(newPage, pagination.limit);
    }
  };

  const handlePageSizeChange = (value: string) => {
    const newLimit = parseInt(value);
    console.log(`Changing page size to ${newLimit}`); // Debug log
    setPagination(prev => ({
      ...prev,
      limit: newLimit,
      currentPage: 1 // Reset to first page when changing page size
    }));
    fetchTrucks(1, newLimit);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate truck number format
    if (!/^[A-Z0-9]{3,10}$/.test(formData.truck_number)) {
      toast.error(
        "Please enter a valid truck number (3-10 alphanumeric characters)"
      );
      return;
    }

    // if (!formData.vendor_id) {
    //   toast.error("Please select a vendor");
    //   return;
    // }

    setIsLoading(true);

    try {
      // Create new truck using the API endpoint
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/v1/truck`,
        {
          truck_number: formData.truck_number,
          // vendor_id: formData.vendor_id,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      // Refresh the truck list after adding a new truck
      fetchTrucks();
      handleCloseDialog();
      toast.success("Truck added successfully!");
    } catch (error: unknown) {
      console.error("Error creating truck:", error);
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to create truck");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteModal = (truckId: string) => {
    setTruckToDelete(truckId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!truckToDelete) return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_BASE_URL}/api/v1/truck/${truckToDelete}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      // Refresh the list after deletion
      fetchTrucks();
      toast.success("Truck deleted successfully!");
    } catch (error) {
      console.error("Error deleting truck:", error);
      toast.error("Failed to delete truck");
    } finally {
      setDeleteModalOpen(false);
      setTruckToDelete(null);
    }
  };

  const handleCloseDialog = () => {
    setFormData({
      truck_number: "",
      // vendor_id: "",
    });
    // setVendorSearchTerm("");
    setIsDialogOpen(false);
  };

  // Filter vendors based on search term
  // const filteredVendors = vendors.filter(vendor => 
  //   vendor.name.toLowerCase().includes(vendorSearchTerm.toLowerCase())
  // );

  const requiredField = <span className="text-red-500 ml-1">*</span>;

  return (
    <div className="space-y-6 py-4">
      <div className="flex justify-end gap-4 items-center mb-6">
        <div className="relative w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search trucks..."
            value={searchTerm}
            onChange={handleSearch}
            className="pl-10"
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="text-white hover:bg-gray-800"
              style={{ background: "#0f50ba" }}
            >
              Add Truck
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle className="text-left">Add New Truck</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="truck_number" className="text-sm font-medium">
                  Truck Number{requiredField}
                </label>
                <Input
                  id="truck_number"
                  placeholder="Enter truck number"
                  value={formData.truck_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      truck_number: e.target.value.toUpperCase(),
                    })
                  }
                  required
                  className="uppercase"
                />
                <p className="text-xs text-gray-500">
                  Example: DL01AB1234 (Delhi)
                </p>
              </div>

              {/* <div className="space-y-2">
                <label className="text-sm font-medium">Vendor{requiredField}</label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search vendor..."
                    value={vendorSearchTerm}
                    onChange={(e) => {
                      setVendorSearchTerm(e.target.value);
                      setIsVendorDropdownOpen(true);
                    }}
                    onClick={() => setIsVendorDropdownOpen(true)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setIsVendorDropdownOpen(!isVendorDropdownOpen)}
                  >
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </Button>
                  
                  {isVendorDropdownOpen && (
                    <div className="absolute z-50 w-2xs mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredVendors.length === 0 ? (
                        <div className="p-2 text-sm text-gray-500">No vendor found.</div>
                      ) : (
                        filteredVendors.map((vendor) => (
                          <div
                            key={vendor.id}
                            className="p-2 cursor-pointer hover:bg-gray-100 flex items-center"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                vendor_id: vendor.id,
                              });
                              setVendorSearchTerm(vendor.name);
                              setIsVendorDropdownOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.vendor_id === vendor.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {vendor.name}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div> */}
              <DialogFooter className="flex justify-end gap-2">
                <Button
                  type="submit"
                  className="text-white"
                  style={{ background: "#0f50ba" }}
                  disabled={isLoading}
                >
                  {isLoading ? "Adding..." : "Add Truck"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Truck Number</TableHead>
            {/* <TableHead>Vendor</TableHead> */}
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-8">
                <div className="flex flex-col items-center justify-center text-gray-500">
                  <p className="text-lg font-medium">Loading...</p>
                </div>
              </TableCell>
            </TableRow>
          ) : trucks.length > 0 ? (
            trucks.map((truck) => (
              <TableRow key={truck.id}>
                <TableCell className="font-medium py-4">
                  {truck.truck_number}
                </TableCell>
                {/* <TableCell className="py-4">{truck.vendor.name}</TableCell> */}
                <TableCell className="py-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openDeleteModal(truck.id)}
                    className="hover:text-red-800 hover:bg-red-50 "
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-8">
                <div className="flex flex-col items-center justify-center text-gray-500">
                  <p className="text-lg font-medium">No trucks found</p>
                  {searchTerm && (
                    <p className="text-sm mt-1">
                      No results found for "{searchTerm}"
                    </p>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Enhanced Pagination */}
      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center space-x-2">
          <span>Rows per page</span>
          <Select
            value={pagination.limit.toString()}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger className="w-16 cursor-pointer border-gray-300 h-8 rounded">
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

        <div className="text-sm">
          {pagination.totalItems > 0 ? (
            <>
              Showing {(pagination.currentPage - 1) * pagination.limit + 1} to {
                Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)
              } of {pagination.totalItems} entries
            </>
          ) : (
            "No entries"
          )}
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

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" style={{ color: "#0f50ba" }} />
              <span>Confirm Deletion</span>
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="py-4">
            Are you sure you want to delete this truck? This action cannot be
            undone.
          </DialogDescription>
          <DialogFooter className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              className="text-white"
              style={{ background: "#0f50ba" }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Trucks;