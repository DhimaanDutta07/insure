/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Enquiry } from "../../types/enquiry";
import { enquiryService } from "../../services/enquiry.service";
import { Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Pencil, Download, Plus,
  // CalendarIcon
 } from "lucide-react";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { EnquiryForm } from "./EnquiryForm";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "../ui/sheet";
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { formatDate } from "../dateFormatter";
// import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
// import Calendar from "../ui/calendar";

// type TimePeriod = "today" | "yesterday" | "thisWeek" | "thisMonth" | "lastMonth" | "custom";
// type CustomDateRange = {
//   start: string;
//   end: string;
// };

const EnquirySheet: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEnquiry: Enquiry | null;
}> = ({ open, onOpenChange, selectedEnquiry }) => {
  const formatPropertyType = (type: Enquiry["propertyType"]) => {
    switch (type) {
      case "BTS":
        return "BTS";
      case "READY_TO_MOVE":
        return "Ready to Move";
      case "UNDER_CONSTRUCTION":
        return "Under Construction";
      default:
        return type;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xs bg-white border-none overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Enquiry Details</SheetTitle>
        </SheetHeader>
        {selectedEnquiry && (
          <div className="mt-8 mb-4">
            <div className="grid grid-cols-1 gap-y-2 font-normal text-gray-700">
              <p><span className="font-medium">Date:</span> {formatDate(selectedEnquiry.date)}</p>
              <p><span className="font-medium">Site Name:</span> {selectedEnquiry.siteName}</p>
              <p><span className="font-medium">Area Required:</span> {selectedEnquiry.areaRequired} sq. ft.</p>
              <p><span className="font-medium">When Required:</span> {formatDate(selectedEnquiry.whenRequired)}</p>
              <p><span className="font-medium">Company:</span> {selectedEnquiry.company}</p>
              <p><span className="font-medium">Contact Person:</span> {selectedEnquiry.enquiryPersonOrBroker}</p>
              <p><span className="font-medium">Contact Number:</span> {selectedEnquiry.contactNumber}</p>
              <p><span className="font-medium">Rent Quoted:</span> ₹{selectedEnquiry.rentQuoted.toLocaleString()}</p>
              <p><span className="font-medium">Property Type:</span> {formatPropertyType(selectedEnquiry.propertyType)}</p>
              <p><span className="font-medium">Entered By:</span> {selectedEnquiry.user.name}</p>
              {selectedEnquiry.remarks && <p><span className="font-medium">Remarks:</span> {selectedEnquiry.remarks}</p>}
            </div>
          </div>
        )}
        <div className="sticky bottom-0 bg-white py-4">
          <SheetFooter>
            <SheetClose asChild>
              <Button type="button" className="text-white w-full" style={{ background: "#0f50ba" }}>
                Close
              </Button>
            </SheetClose>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export const EnquiryList: React.FC = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [enquiriesPerPage, setEnquiriesPerPage] = useState(10);
  const [editingEnquiry, setEditingEnquiry] = useState<Enquiry | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [enquiryToDelete, setEnquiryToDelete] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  // const [timePeriod, setTimePeriod] = useState<TimePeriod>("today");
  // const [customDateRange, setCustomDateRange] = useState<CustomDateRange>({
  //   start: '',
  //   end: ''
  // });
  // const [showCustomDatePicker, setShowCustomDate/Picker] = useState(false);

  useEffect(() => {
    fetchEnquiries();
  }, [showDeleted]);

  const fetchEnquiries = async () => {
    try {
      // const url = 
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/v1/enquiries`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      setEnquiries(response.data.filter((enquiry: Enquiry) => 
        showDeleted ? enquiry.is_deleted : !enquiry.is_deleted
      ));
    } catch (err) {
      setError("Failed to fetch enquiries");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // const handleDelete = async (id: string) => {
  //   if (window.confirm("Are you sure you want to delete this enquiry?")) {
  //     try {
  //       await enquiryService.deleteEnquiry(id);
  //       setEnquiries(enquiries.filter((enquiry) => enquiry.id !== id));
  //       // Adjust current page if necessary after deletion
  //       const totalPages = Math.ceil((enquiries.length - 1) / enquiriesPerPage);
  //       if (currentPage > totalPages) {
  //         setCurrentPage(totalPages || 1);
  //       }
  //     } catch (err) {
  //       setError("Failed to delete enquiry"+ err);
  //       console.error(err);
  //     }
  //   }
  // };
  const handleDelete = (id: string) => {
    setEnquiryToDelete(id);
    setIsDeleteModalOpen(true);
  };
  const confirmDelete = async () => {
    if (enquiryToDelete) {
      try {
        await enquiryService.deleteEnquiry(enquiryToDelete);
        setEnquiries(enquiries.filter((enquiry) => enquiry.id !== enquiryToDelete));
        const totalPages = Math.ceil((enquiries.length - 1) / enquiriesPerPage);
        if (currentPage > totalPages) {
          setCurrentPage(totalPages || 1);
        }
      } catch (err) {
        setError("Failed to delete enquiry");
        console.error(err);
      } finally {
        setIsDeleteModalOpen(false);
        setEnquiryToDelete(null);
      }
    }
  };

  const handleEdit = (enquiry: Enquiry) => {
    console.log("Editing enquiry:", enquiry)
    setEditingEnquiry(enquiry);
    setShowForm(true);
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingEnquiry(null);
    fetchEnquiries(); // Refresh the list
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingEnquiry(null);
  };

  const formatPropertyType = (type: Enquiry["propertyType"]) => {
    switch (type) {
      case "BTS":
        return "BTS";
      case "READY_TO_MOVE":
        return "Ready to Move";
      case "UNDER_CONSTRUCTION":
        return "Under Construction";
      default:
        return type;
    }
  };

  const totalPages = Math.ceil(enquiries.length / enquiriesPerPage);
  const paginatedEnquiries = enquiries.slice(
    (currentPage - 1) * enquiriesPerPage,
    currentPage * enquiriesPerPage
  );

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handleRowClick = (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
    setSheetOpen(true);
  };

  const handleDownloadExcel = () => {
    // Prepare data for Excel
    const excelData = enquiries.map(enquiry => ({
      'Date': formatDate(enquiry.date),
      'Site Name': enquiry.siteName,
      'Area Required (sq. ft.)': enquiry.areaRequired,
      'When Required': formatDate(enquiry.whenRequired),
      'Company': enquiry.company,
      'Contact Person': enquiry.enquiryPersonOrBroker,
      'Contact Number': enquiry.contactNumber,
      'Rent Quoted': `₹${enquiry.rentQuoted.toLocaleString()}`,
      'Property Type': formatPropertyType(enquiry.propertyType),
      'Entered By': enquiry.user.name,
      'Remarks': enquiry.remarks || 'N/A'
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 12 },  // Date
      { wch: 20 },  // Site Name
      { wch: 15 },  // Area Required
      { wch: 15 },  // When Required
      { wch: 25 },  // Company
      { wch: 20 },  // Contact Person
      { wch: 15 },  // Contact Number
      { wch: 15 },  // Rent Quoted
      { wch: 15 },  // Property Type
      { wch: 15 },  // Entered By
      { wch: 30 },  // Remarks
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Enquiries');

    // Generate filename based on time period
    let filename = 'enquiries';
    // if (timePeriod === 'custom' && customDateRange.start && customDateRange.end) {
    //   const startDate = formatDate(customDateRange.start)
    //   const endDate = formatDate(customDateRange.end)
    //   filename += `_${startDate}_to_${endDate}`;
    // } else {
      filename += ``;
    // }
    filename += '.xlsx';

    // Save file
    XLSX.writeFile(wb, filename);
  };

  if (loading) return <div className="text-gray-500 font-medium text-center py-10">Loading...</div>;
  if (error) return <div className="text-red-500 font-medium text-center py-10">{error}</div>;

  return (
    <div>
      {showForm ? (
        <EnquiryForm
          enquiry={editingEnquiry || undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
        />
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-semibold hidden sm:block">Enquiries</h1>
          <div className="flex justify-end items-center w-full gap-2">
            {/* <div className="w-32">
              <Select 
                value={timePeriod} 
                onValueChange={(value: TimePeriod) => {
                  setTimePeriod(value);
                  setShowCustomDatePicker(value === 'custom');
                  if (value !== 'custom') {
                    setCustomDateRange({ start: '', end: '' });
                  }
                }}
              >
                <SelectTrigger className="w-full bg-white border border-gray-300 rounded-lg shadow-sm hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200">
                  <SelectValue placeholder="Select time period" className="text-gray-600" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg">
                  <SelectItem value="today" className="hover:bg-blue-50 text-gray-700 py-2 px-8">Today</SelectItem>
                  <SelectItem value="yesterday" className="hover:bg-blue-50 text-gray-700 py-2 px-8">Yesterday</SelectItem>
                  <SelectItem value="thisWeek" className="hover:bg-blue-50 text-gray-700 py-2 px-8">This Week</SelectItem>
                  <SelectItem value="thisMonth" className="hover:bg-blue-50 text-gray-700 py-2 px-8">This Month</SelectItem>
                  <SelectItem value="lastMonth" className="hover:bg-blue-50 text-gray-700 py-2 px-8">Last Month</SelectItem>
                  <SelectItem value="custom" className="hover:bg-blue-50 text-gray-700 py-2 px-3">Custom Range</SelectItem>
                </SelectContent>
              </Select>

              {showCustomDatePicker && (
                <div className="animate-in fade-in duration-300">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal border border-gray-300 rounded-lg shadow-sm hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customDateRange.start && customDateRange.end ? (
                          <span>{formatDate(customDateRange.start)} - {formatDate(customDateRange.end)}</span>
                        ) : (
                          <span className="text-gray-600">Select date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={{
                          from: customDateRange.start ? new Date(customDateRange.start) : null,
                          to: customDateRange.end ? new Date(customDateRange.end) : null
                        }}
                        onSelect={(range) => {
                          if (range?.from) {
                            setCustomDateRange({
                              start: format(range.from, 'yyyy-MM-dd'),
                              end: range.to ? format(range.to, 'yyyy-MM-dd') : ''
                            });
                          } else {
                            setCustomDateRange({ start: '', end: '' });
                          }
                        }}
                        numberOfMonths={1}
                      />
                      <div className="flex items-center justify-end gap-2 p-3 border-t border-gray-100">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCustomDateRange({ start: '', end: '' });
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          Clear
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div> */}
              {/* Add Checkbox here */}
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showDeleted}
                  onChange={(e) => setShowDeleted(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Show Inactive</span>
              </label>
            <Button
              onClick={handleDownloadExcel}
              className="bg-green-600 text-white hover:bg-green-700 flex items-center"
              disabled={enquiries.length === 0}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Download</span>
              {/* <span className="sm:hidden ml-2">Excel</span> */}
            </Button>
            <button
              onClick={() => {
                setEditingEnquiry(null);
                setShowForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded cursor-pointer flex items-center"
            >
              <Plus className="w-4 h-4"/><span className="hidden sm:inline ml-2">New</span>
            </button>
          </div>
          </div>
          <div className="overflow-x-auto">
            <Table className="border-collapse w-full">
              <TableHeader className="bg-gray-50">
                <TableRow className="border-b border-gray-200">
                  <TableHead className="py-0.5 px-2 text-gray-700 font-medium text-left whitespace-nowrap">Date</TableHead>
                  <TableHead className="py-0.5 px-2 text-gray-700 font-medium text-left">Site Name</TableHead>
                  <TableHead className="py-0.5 px-2 text-gray-700 font-medium text-right w-20">Area Req. (sq. ft.)</TableHead>
                  <TableHead className="py-0.5 px-2 text-gray-700 font-medium text-left whitespace-nowrap">When Req.</TableHead>
                  <TableHead className="py-0.5 px-2 text-gray-700 font-medium text-left">Company</TableHead>
                  <TableHead className="py-0.5 px-2 text-gray-700 font-medium text-left">Contact Person</TableHead>
                  <TableHead className="py-0.5 px-2 text-gray-700 font-medium text-right">Contact Number</TableHead>
                  <TableHead className="py-0.5 px-2 text-gray-700 font-medium text-right">Rent Quoted</TableHead>
                  <TableHead className="py-0.5 px-2 text-gray-700 font-medium text-left">Property Type</TableHead>
                  <TableHead className="py-0.5 px-2 text-gray-700 font-medium text-left">Entered By</TableHead>
                  <TableHead className="py-0.5 px-2 text-gray-700 font-medium text-left">Actions</TableHead>
                </TableRow>
              </TableHeader> 
              <TableBody>
                {paginatedEnquiries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-10 text-center">
                      <div className="text-gray-500 font-medium">No enquiries found.</div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedEnquiries.map((enquiry, index) => (
                    <TableRow
                      key={enquiry.id}
                      className={`border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                      }`}
                      onClick={() => handleRowClick(enquiry)}
                    >
                      <TableCell className="py-0.5 px-2 text-sm whitespace-nowrap">
                        {formatDate(enquiry.date)}
                      </TableCell>
                      <TableCell className="py-0.5 px-2 text-sm">{enquiry.siteName}</TableCell>
                      <TableCell className="py-0.5 px-2 text-sm text-right">{enquiry.areaRequired}</TableCell>
                      <TableCell className="py-0.5 px-2 text-sm whitespace-nowrap">{formatDate(enquiry.whenRequired)}</TableCell>
                      <TableCell className="py-0.5 px-2 text-sm">{enquiry.company}</TableCell>
                      <TableCell className="py-0.5 px-2 text-sm">{enquiry.enquiryPersonOrBroker}</TableCell>
                      <TableCell className="py-0.5 px-2 text-sm text-right">{enquiry.contactNumber}</TableCell>
                      <TableCell className="py-0.5 px-2 text-sm text-right">₹{enquiry.rentQuoted.toLocaleString()}</TableCell>
                      <TableCell className="py-0.5 px-2 text-sm">{formatPropertyType(enquiry.propertyType)}</TableCell>
                      <TableCell className="py-0.5 px-2 text-sm">{enquiry.user.name}</TableCell>
                      <TableCell className="py-0.5 px-0 text-sm">
                        <div className="flex">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-4 w-4 p-4 text-black rounded-md hover:text-blue-800 hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(enquiry);
                            }}
                          >
                            <Pencil size={20} strokeWidth={1.50} />
                          </Button>
                          { !showDeleted && <Button
                            size="icon"
                            variant="ghost"
                            className="h-4 w-4 p-4 text-black rounded-md hover:text-red-800 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(enquiry.id);
                            }}
                          >
                            <Trash2 size={20} strokeWidth={1.75} />
                          </Button>
                          }
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {enquiries.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 px-2 gap-4 sm:gap-0">
              <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
                <span className="text-sm text-gray-600">Rows per page:</span>
                <Select
                  value={enquiriesPerPage.toString()}
                  onValueChange={(value) => {
                    setEnquiriesPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-16 border-gray-300 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1 mx-2 w-full sm:w-auto justify-center sm:justify-start">
                <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
              </div>
              <div className="flex space-x-1 w-full sm:w-auto justify-center sm:justify-start">
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
          <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
            <DialogContent className="sm:max-w-[425px] bg-white">
              <DialogHeader>
                <DialogTitle className="text-left">Confirm Deletion</DialogTitle>
                <DialogDescription className="text-left">
                  <span className="text-red-500 font-extrabold">* </span>
                  Are you sure you want to delete this enquiry? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setEnquiryToDelete(null);
                  }}
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <EnquirySheet
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            selectedEnquiry={selectedEnquiry}
          />
        </>
      )}
    </div>
  );
};