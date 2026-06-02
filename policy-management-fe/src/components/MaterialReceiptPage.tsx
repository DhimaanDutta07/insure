import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
} from "@tanstack/react-table";
import { Button } from "./ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Dialog,
  // DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
// import {
//   Sheet,
//   SheetContent,
//   SheetFooter,
//   SheetHeader,
//   SheetTitle,
//   SheetClose,
// } from "./ui/sheet";
// import { DateRange } from 'react-date-range';
import "react-date-range/dist/styles.css"; // main style file
import "react-date-range/dist/theme/default.css"; // theme css file
import {
  MaterialReceipt,
  Site,
  TimePeriod,
  CustomDateRange,
} from "../types/materialReceipt";
import { MaterialReceiptSheet } from "./MaterialReceiptSheet";
import { formatDate } from "./dateFormatter";

const MaterialReceiptPage: React.FC = () => {
  const [receipts, setReceipts] = useState<MaterialReceipt[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [receiptsPerPage, setReceiptsPerPage] = useState(10);
  const [selectedReceipt, setSelectedReceipt] =
    useState<MaterialReceipt | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("last3Days");
  const [selectedSite, setSelectedSite] = useState<string>("all");
  const [sites, setSites] = useState<Site[]>([]);
  const [customDateRange, setCustomDateRange] = useState<CustomDateRange>({
    start: "",
    end: "",
  });
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    item_group_id: "",
    item_name_id: "",
    remark: "",
    user_id: "",
    inward_number: "",
    site_id: "",
    images: [] as File[],
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch sites
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/v1/sites`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          }
        );
        setSites(response.data);
      } catch (error) {
        console.error("Error fetching sites:", error);
      }
    };
    fetchSites();
  }, []);

  // Fetch receipts with site filter
  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        let url: string;
        if (timePeriod === "custom") {
          url = `${
            import.meta.env.VITE_BASE_URL
          }/api/v1/material-receipts/time-period/custom`;
          if (customDateRange.start && customDateRange.end) {
            // Format dates to ISO string and remove time component
            const startDate = new Date(customDateRange.start)
              .toISOString()
              .split("T")[0];
            const endDate = new Date(customDateRange.end)
              .toISOString()
              .split("T")[0];
            url += `?start=${startDate}&end=${endDate}`;
          }
        } else {
          url = `${
            import.meta.env.VITE_BASE_URL
          }/api/v1/material-receipts/time-period/${timePeriod}`;
        }

        if (selectedSite && selectedSite !== "all") {
          url += url.includes("?") ? "&" : "?";
          url += `siteId=${selectedSite}`;
        }

        // console.log("Fetching URL:", url); // Debug log

        const res = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        });

        // console.log("Response:", res.data); // Debug log

        const sortedReceipts = res.data
          .filter((r: MaterialReceipt) => !r.is_deleted)
          .sort(
            (a: MaterialReceipt, b: MaterialReceipt) =>
              new Date(b.updated_at).getTime() -
              new Date(a.updated_at).getTime()
          );
        setReceipts(sortedReceipts);
      } catch (err) {
        console.error("Error fetching receipts:", err);
        if (axios.isAxiosError(err)) {
          console.error("Error response:", err.response?.data);
        }
      }
    };

    // Only fetch if we have valid dates for custom range
    if (
      timePeriod === "custom" &&
      (!customDateRange.start || !customDateRange.end)
    ) {
      return;
    }

    fetchReceipts();
  }, [timePeriod, selectedSite, customDateRange]);

  // const columns: ColumnDef<MaterialReceipt>[] = [
  //   { accessorKey: "inward_number", header: "Inward No.", size: 30 },
  //   {
  //     accessorKey: "site.name",
  //     header: "Site Name",
  //     cell: ({ row }) => row.original.site?.name || "N/A",
  //     size: 90,
  //   },
  //   {
  //     accessorKey: "itemGroup.name",
  //     header: "Item Group",
  //     cell: ({ row }) => row.original.itemGroup?.name || "N/A",
  //     size: 130,
  //   },
  //   {
  //     accessorKey: "itemName.name",
  //     header: "Item Name",
  //     cell: ({ row }) => row.original.itemName?.name || "N/A",
  //     size: 230,
  //   },
  //   {
  //     accessorKey: "created_at",
  //     header: "In Time",
  //     cell: ({ row }) => formatDate(row.original.created_at),
  //     size: 120,
  //   },
  //   {
  //     accessorKey: "user.name",
  //     header: "Operator Name",
  //     cell: ({ row }) => row.original.user.name,
  //     size: 80,
  //   },
  // ];
  const columns: ColumnDef<MaterialReceipt>[] = [
  { accessorKey: "inward_number", header: "Inward No.", size: 84   }, // Adjusted for readability
  {
    accessorKey: "site.name",
    header: "Site Name",
    cell: ({ row }) => row.original.site?.name || "N/A",
    size: 120, // Increased slightly
  },
  {
    accessorKey: "itemGroup.name",
    header: "Item Group",
    cell: ({ row }) => row.original.itemGroup?.name || "N/A",
    size: 150, // Adjusted for longer content
  },
  {
    accessorKey: "itemName.name",
    header: "Item Name",
    cell: ({ row }) => row.original.itemName?.name || "N/A",
    size: 270, // Adjusted for longer content
  },
  {
    accessorKey: "created_at",
    header: "In Time",
    cell: ({ row }) => formatDate(row.original.created_at, 'withTime'),
    size: 155, // Increased for date format
  },
  {
    accessorKey: "user.name",
    header: "Operator Name",
    cell: ({ row }) => row.original.user.name,
    size: 105, // Adjusted for readability
  },
];
  const table = useReactTable({
    data: receipts,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalPages = Math.ceil(receipts.length / receiptsPerPage);
  const paginatedReceipts = receipts.slice(
    (currentPage - 1) * receiptsPerPage,
    currentPage * receiptsPerPage
  );

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files) {
      setFormData((prev) => ({ ...prev, images: Array.from(files) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.images.length === 0) {
      setError("At least one image is required");
      return;
    }

    const data = new FormData();
    if (formData.item_group_id)
      data.append("item_group_id", formData.item_group_id);
    if (formData.item_name_id)
      data.append("item_name_id", formData.item_name_id);
    if (formData.remark) data.append("remark", formData.remark);
    data.append("user_id", formData.user_id);
    data.append("inward_number", formData.inward_number);
    if (formData.site_id) data.append("site_id", formData.site_id);
    formData.images.forEach((file) => data.append(`images`, file)); // Match backend expectation

    try {
      if (isCreateMode) {
        const res = await axios.post(
          `${import.meta.env.VITE_BASE_URL}/api/v1/material-receipts`,
          data,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          }
        );
        setReceipts((prev) => [...prev, res.data]);
      } else if (selectedReceipt) {
        const res = await axios.patch(
          `${import.meta.env.VITE_BASE_URL}/api/v1/material-receipts/${
            selectedReceipt.id
          }`,
          data,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          }
        );
        setReceipts((prev) =>
          prev.map((r) => (r.id === selectedReceipt.id ? res.data : r))
        );
      }
      setDialogOpen(false);
      resetForm();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      item_group_id: "",
      item_name_id: "",
      remark: "",
      user_id: "",
      inward_number: "",
      site_id: "",
      images: [],
    });
    setIsCreateMode(false);
    setSelectedReceipt(null);
  };

  const handleRowClick = (receipt: MaterialReceipt) => {
    setSelectedReceipt(receipt);
    setSheetOpen(true);
  };

  const handleDownloadExcel = () => {
    // Prepare data for Excel
    const excelData = receipts.map((receipt) => ({
      "Inward No.": receipt.inward_number || "N/A",
      "Site Name": receipt.site?.name || "N/A",
      "Item Group": receipt.itemGroup?.name || "N/A",
      "Item Name": receipt.itemName?.name || "N/A",
      "In Time": formatDate(receipt.created_at, 'withTime'),
      "Operator Name": receipt.user.name,
      Remark: receipt.remark || "N/A",
      ...receipt.images
        .map((image, index) => ({
          [`Image ${index + 1}`]: image.directUrl,
        }))
        .reduce((acc, curr) => ({ ...acc, ...curr }), {}),
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 10 }, // Inward No.
      { wch: 20 }, // Site Name
      { wch: 15 }, // Item Group
      { wch: 30 }, // Item Name
      { wch: 20 }, // In Time
      { wch: 15 }, // Operator Name
      { wch: 30 }, // Remark
      { wch: 25 }, // Image URLs
    ];
    ws["!cols"] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Material Receipts");

    // Generate filename based on time period
    let filename = "material_receipts";
    if (
      timePeriod === "custom" &&
      customDateRange.start &&
      customDateRange.end
    ) {
      const startDate = formatDate(customDateRange.start);
      const endDate = formatDate(customDateRange.end);
      filename += `_${startDate}_to_${endDate}`;
    } else {
      filename += `_${timePeriod}`;
    }
    if (selectedSite && selectedSite !== "all") {
      const siteName =
        sites.find((site) => site.id === selectedSite)?.name || "unknown";
      filename += `_${siteName}`;
    }
    filename += ".xlsx";

    // Save file
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4 space-y-4">
        <h1 className="text-2xl font-semibold mb-2 hidden sm:block">Dashboard</h1>
        {/* <div className="flex flex-col gap-1">
            <Select value={timePeriod} onValueChange={(value: TimePeriod) => {
              setTimePeriod(value);
              setShowCustomDatePicker(value === 'custom');
              if (value !== 'custom') {
                setCustomDateRange({ start: '', end: '' });
              }
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="thisWeek">This Week</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            {showCustomDatePicker && (
              <div className="flex gap-2 mt-2">
                <div className="flex flex-col">
                  <label className="text-sm text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={customDateRange.start}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="border rounded px-2 py-1"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={customDateRange.end}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="border rounded px-2 py-1"
                  />
                </div>
              </div>
            )}
          </div> */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-2 max-w-md w-28 sm:w-40">
            <Select
              value={timePeriod}
              onValueChange={(value: TimePeriod) => {
                setTimePeriod(value);
                setShowCustomDatePicker(value === "custom");
                if (value !== "custom") {
                  setCustomDateRange({ start: "", end: "" });
                }
              }}
            >
              <SelectTrigger className="w-full bg-white border border-gray-300 rounded-lg shadow-sm hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200">
                <SelectValue
                  placeholder="Select time period"
                  className="text-xs sm:text-sm text-gray-600"
                />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg">
                {/* <SelectItem
                  value="today"
                  className="hover:bg-blue-50 text-gray-700 py-2 px-8 sm:px-8 text-xs sm:text-sm"
                >
                  Today
                </SelectItem> */}
                {/* <SelectItem
                  value="yesterday"
                  className="hover:bg-blue-50 text-gray-700 py-2 px-8 sm:px-8 text-xs sm:text-sm"
                >
                  Yesterday
                </SelectItem> */}
                <SelectItem
                  value="last3Days"
                  className="hover:bg-blue-50 text-gray-700 py-2 px-8 sm:px-8 text-xs sm:text-sm"
                >
                  Last 3 Days
                </SelectItem>
                <SelectItem
                  value="thisWeek"
                  className="hover:bg-blue-50 text-gray-700 py-2 px-8 sm:px-8 text-xs sm:text-sm"
                >
                  This Week
                </SelectItem>
                <SelectItem
                  value="thisMonth"
                  className="hover:bg-blue-50 text-gray-700 py-2 px-8 sm:px-8 text-xs sm:text-sm"
                >
                  This Month
                </SelectItem>
                <SelectItem
                  value="lastMonth"
                  className="hover:bg-blue-50 text-gray-700 py-2 px-8 sm:px-8 text-xs sm:text-sm"
                >
                  Last Month
                </SelectItem>
                {/* <SelectItem
                  value="custom"
                  className="hover:bg-blue-50 text-gray-700 py-2 px-3"
                >
                  Custom Range
                </SelectItem> */}
              </SelectContent>
            </Select>

            {showCustomDatePicker && (
              <div className="flex gap-4 mt-3 animate-in fade-in duration-300">
                <div className="flex flex-col flex-1">
                  <label className="text-sm font-medium text-gray-700 mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customDateRange.start}
                    onChange={(e) =>
                      setCustomDateRange((prev) => ({
                        ...prev,
                        start: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                <div className="flex flex-col flex-1">
                  <label className="text-sm font-medium text-gray-700 mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customDateRange.end}
                    onChange={(e) =>
                      setCustomDateRange((prev) => ({
                        ...prev,
                        end: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Select value={selectedSite} onValueChange={setSelectedSite}>
              <SelectTrigger className="sm:w-[180px] w-[140px]">
                <SelectValue placeholder="Select site" className="text-sm sm:text-base" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-sm sm:text-base">All Sites</SelectItem>
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.id} className="text-sm sm:text-base">
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleDownloadExcel}
            className="bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
            disabled={receipts.length === 0}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table className="border-collapse w-full">
          <TableHeader className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-gray-200"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="py-2 px-2.5 text-gray-700 font-medium text-left text-sm"
                    style={{ width: `${header.column.columnDef.size}px` }}
                  >
                    {header.column.columnDef.header as string}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {paginatedReceipts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm">
                  <div className="text-gray-500 font-medium">
                    No material receipts found.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedReceipts.map((receipt, index) => (
                <TableRow
                  key={receipt.id}
                  className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                  }`}
                  onClick={() => handleRowClick(receipt)}
                >
                  <TableCell
                    className="py-3 px-2.5 text-sm"
                    style={{ width: "30px" }}
                  >
                    {receipt.inward_number || "N/A"}
                  </TableCell>
                  <TableCell
                    className="py-3 px-2.5 text-sm"
                    style={{ width: "90px" }}
                  >
                    {receipt.site?.name || "N/A"}
                  </TableCell>
                  <TableCell
                    className="py-3 px-2.5 text-sm"
                    style={{ width: "130px" }}
                  >
                    {receipt.itemGroup?.name || "N/A"}
                  </TableCell>
                  <TableCell
                    className="py-3 px-2.5 text-sm"
                    style={{ width: "230px" }}
                  >
                    {receipt.itemName?.name || "N/A"}
                  </TableCell>
                  <TableCell
                    className="py-3 px-2.5 text-sm"
                    style={{ width: "120px" }}
                  >
                    {formatDate(receipt.created_at, 'withTime')}
                  </TableCell>
                  <TableCell
                    className="py-3 px-2.5 text-sm"
                    style={{ width: "80px" }}
                  >
                    {receipt.user.name}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white rounded-lg border border-gray-200 shadow-lg">
          <DialogHeader>
            <DialogTitle>
              {isCreateMode
                ? "Create Material Receipt"
                : "Update Material Receipt"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-medium text-gray-700">
                Item Group ID
              </label>
              <input
                type="text"
                name="item_group_id"
                value={formData.item_group_id}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block font-large text-gray-700">
                Item Name ID
              </label>
              <input
                type="text"
                name="item_name_id"
                value={formData.item_name_id}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700">Remark</label>
              <textarea
                name="remark"
                value={formData.remark}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700">
                User ID *
              </label>
              <input
                type="text"
                name="user_id"
                value={formData.user_id}
                onChange={handleInputChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700">
                Inward Number *
              </label>
              <input
                type="text"
                name="inward_number"
                value={formData.inward_number}
                onChange={handleInputChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700">Site ID</label>
              <input
                type="text"
                name="site_id"
                value={formData.site_id}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700">Images</label>
              <input
                type="file"
                multiple
                name="images"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="w-full"
              />
              {selectedReceipt?.images && !isCreateMode && (
                <div className="mt-2">
                  {selectedReceipt.images.map((img, idx) => (
                    <div key={img.id} className="flex items-center gap-2">
                      <img
                        src={img.directUrl}
                        alt={`Existing image ${idx + 1}`}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <a
                        href={img.directUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600"
                      >
                        View Full Image {idx + 1}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {error && <p className="text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {isCreateMode ? "Create" : "Update"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <MaterialReceiptSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        selectedReceipt={selectedReceipt}
      />

      {receipts.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 px-2 gap-4 sm:gap-0">
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <Select
              value={receiptsPerPage.toString()}
              onValueChange={(value) => {
                setReceiptsPerPage(Number(value));
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
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
          </div>
          <div className="flex space-x-1 w-full sm:w-auto justify-center sm:justify-start">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(1)}
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <ChevronsLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(totalPages)}
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <ChevronsRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialReceiptPage;
