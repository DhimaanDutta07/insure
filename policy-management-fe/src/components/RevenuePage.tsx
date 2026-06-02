/* eslint-disable react-hooks/exhaustive-deps */
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
  Trash2,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { RevenueForm } from "./RevenueForm";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { formatDate } from "./dateFormatter";
import { getAllAgents } from "../services/agent.service";
import { getAllCommissions } from "../services/commission.service";

interface Revenue {
  id: string;
  reimbursementId: string;
  commissionId: string;
  area: number;
  month: string;
  agentId: string;
  amount: number;
  camCharge: number;
  gst: number;
  lessTds: number;
  receivable: number;
  receivedInBank: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  commission: { name: string };
  agent: { name: string };
  reimbursement: { name: string };
}

interface Reimbursement {
  id: string;
  name: string;
}

interface Commission {
  id: string;
  name: string;
  description?: string;
}

interface Agent {
  id: string;
  name: string;
  phone?: string;
  status: string;
}

type TimePeriod = "last3Days" | "thisWeek" | "thisMonth" | "lastMonth";

const RevenuePage: React.FC = () => {
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [revenuesPerPage, setRevenuesPerPage] = useState(10);
  const [selectedRevenue, setSelectedRevenue] = useState<Revenue | undefined>(undefined);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("last3Days");
  const [selectedCommissionId, setSelectedCommissionId] = useState<string>("all");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [revenueToDelete, setRevenueToDelete] = useState<Revenue | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    try {
      // Fetch revenues - this endpoint exists
      const revenueRes = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/v1/revenues`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      const sortedRevenues = revenueRes.data
        .filter((r: Revenue) => !r.isDeleted)
        .sort((a: Revenue, b: Revenue) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setRevenues(sortedRevenues);

      // Fetch agents using the service
      try {
        const agentsData = await getAllAgents();
        setAgents(agentsData.filter(agent => agent.status === 'Active'));
      } catch (err) {
        console.error("Error fetching agents:", err);
        // Fallback to empty array if service fails
        setAgents([]);
      }

      // Fetch commissions using the service
      try {
        const commissionsData = await getAllCommissions();
        setCommissions(commissionsData);
      } catch (err) {
        console.error("Error fetching commissions:", err);
        // Fallback to empty array if service fails
        setCommissions([]);
      }

      // Mock data for reimbursements since endpoint is not available
      setReimbursements([
        { id: "1", name: "Default Reimbursement" },
        { id: "2", name: "Special Reimbursement" },
      ]);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timePeriod, selectedCommissionId]);

  // Calculate Balance Receivable
  const calculateBalanceReceivable = (revenue: Revenue) => {
    return revenue.receivable - revenue.receivedInBank;
  };

  const columns: ColumnDef<Revenue, unknown>[] = [
    { accessorKey: "reimbursement.name", header: "Reimbursement", size: 135 },
    { accessorKey: "commission.name", header: "Commission", size: 110 },
    { accessorKey: "area", header: "Area (sq. ft.)", size: 90 },
    {
      accessorKey: "month",
      header: "Month",
      cell: ({ row }) => formatDate(row.original.month, 'monthYear'),
      size: 75,
    },
    { accessorKey: "agent.name", header: "Agent", size: 100 },
    { accessorKey: "amount", header: "Amount", size: 80 },
    { accessorKey: "camCharge", header: "CAM Charge", size: 90 },
    { accessorKey: "gst", header: "GST", size: 50 },
    { accessorKey: "lessTds", header: "Less TDS", size: 90 },
    { accessorKey: "receivable", header: "Receivable", size: 90 },
    { accessorKey: "receivedInBank", header: "Recd in Bank", size: 100 },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="destructive"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            setRevenueToDelete(row.original);
            setDeleteModalOpen(true);
          }}
          className="h-10 w-10 text-black rounded-md hover:text-red-800 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
      size: 60,
    },
  ];

  const table = useReactTable({
    data: revenues,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalPages = Math.ceil(revenues.length / revenuesPerPage);
  const paginatedRevenues = revenues.slice(
    (currentPage - 1) * revenuesPerPage,
    currentPage * revenuesPerPage
  );

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handleSave = async (revenue: Revenue) => {
    setRevenues((prev) =>
      revenue.id
        ? prev.map((r) => (r.id === revenue.id ? revenue : r))
        : [...prev, revenue]
    );
    setIsFormVisible(false);
    setSelectedRevenue(undefined);
    await fetchData();
  };

  const handleDelete = async (id: string) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await axios.delete(`${import.meta.env.VITE_BASE_URL}/api/v1/revenues/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      setRevenues((prev) => prev.filter((r) => r.id !== id));
      await fetchData();
    } catch (err) {
      console.error("Error deleting revenue:", err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!revenueToDelete || isSaving) return;
    setIsSaving(true);
    try {
      await handleDelete(revenueToDelete.id);
      setDeleteModalOpen(false);
      setRevenueToDelete(undefined);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRowClick = (revenue: Revenue) => {
    setSelectedRevenue(revenue);
    setIsFormVisible(true);
  };

  const handleAddRevenue = () => {
    setSelectedRevenue(undefined);
    setIsFormVisible(true);
  };

  const handleCancel = async () => {
    setIsFormVisible(false);
    setSelectedRevenue(undefined);
    await fetchData();
  };

  const handleDownloadExcel = () => {
    // Define the type for revenue data
    interface RevenueRow {
      "Reimbursement"?: string;
      "Commission": string;
      "Area (sq. ft.)"?: string;
      "Month"?: string;
      "Agent"?: string;
      "Amount"?: string;
      "CAM Charge"?: string;
      "GST"?: string;
      "Less TDS"?: string;
      "Receivable"?: string;
      "Recd in Bank"?: string;
      "Balance Receivable"?: string;
    }
  
    // Log initial revenues to debug
    console.log("All revenues:", revenues);
  
    // Group data by commission.name
    const groupedByCommission = revenues.reduce((acc, revenue) => {
      const commissionName = revenue.commission?.name || "Unknown Commission";
      if (!acc[commissionName]) {
        acc[commissionName] = [];
      }
      acc[commissionName].push(revenue);
      return acc;
    }, {} as { [key: string]: Revenue[] });
  
    // Log grouped data to debug
    console.log("Grouped by commission:", groupedByCommission);
  
    // Prepare data for each commission
    const allSheetsData: { [key: string]: RevenueRow[] } = {};
    let overallTotalBalance = 0;
  
    Object.entries(groupedByCommission).forEach(([commissionName, commissionRevenues]) => {
      console.log(`Processing commission: ${commissionName}, records: ${commissionRevenues.length}`);
      
      const commissionData: RevenueRow[] = commissionRevenues.map((revenue) => {
        const balance = calculateBalanceReceivable(revenue);
        return {
          "Reimbursement": revenue.reimbursement?.name || "",
          "Commission": revenue.commission?.name || "",
          "Area (sq. ft.)": `${(revenue.area).toLocaleString('en-IN')}`,
          "Month": formatDate(revenue.month, 'monthYear'),
          "Agent": revenue.agent?.name || "",
          "Amount": `₹${(revenue.amount).toLocaleString('en-IN')}`,
          "CAM Charge": `₹${(revenue.camCharge).toLocaleString('en-IN')}`,
          "GST": `₹${(revenue.gst).toLocaleString('en-IN')}`,
          "Less TDS": `₹${(revenue.lessTds).toLocaleString('en-IN')}`,
          "Receivable": `₹${(revenue.receivable).toLocaleString('en-IN')}`,
          "Recd in Bank": `₹${(revenue.receivedInBank).toLocaleString('en-IN')}`,
          "Balance Receivable": `₹${balance.toLocaleString('en-IN')}`,
        };
      });
  
      // Calculate total balance for this commission
      const commissionTotalBalance = commissionRevenues.reduce((sum, revenue) => 
        sum + calculateBalanceReceivable(revenue), 0);
      
      overallTotalBalance += commissionTotalBalance;
  
      // Add summary row for this commission
      commissionData.push({
        "Commission": `Total for ${commissionName}`,
        "Balance Receivable": `₹${commissionTotalBalance.toLocaleString('en-IN')}`
      });
  
      allSheetsData[commissionName] = commissionData;
    });
  
    // Create workbook
    const wb = XLSX.utils.book_new();
  
    // Add sheets for each commission
    Object.entries(allSheetsData).forEach(([commissionName, data]) => {
      const ws = XLSX.utils.json_to_sheet(data);
      ws["!cols"] = [
        { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 15 },
        { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
        { wch: 10 }, { wch: 15 }
      ];
      XLSX.utils.book_append_sheet(wb, ws, commissionName.slice(0, 31));
    });
  
    // Define type for summary data
    interface SummaryRow {
      "Commission": string;
      "Total Balance Receivable": string;
    }
  
    // Add overall summary sheet
    const summaryData: SummaryRow[] = [
      ...Object.entries(groupedByCommission).map(([commissionName]) => ({
        "Commission": commissionName,
        "Total Balance Receivable": `${allSheetsData[commissionName]
          .slice(-1)[0]["Balance Receivable"]}`
      })),
      {
        "Commission": "Overall Total",
        "Total Balance Receivable": `₹${overallTotalBalance.toLocaleString('en-IN')}`
      }
    ];
  
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    summaryWs["!cols"] = [{ wch: 15 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");
    const filename = `revenues_${timePeriod}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      {isFormVisible ? (
        <RevenueForm
          revenue={selectedRevenue}
          reimbursements={reimbursements}
          commissions={commissions}
          agents={agents}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ) : (
        <>
          <div className="mb-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold hidden sm:block">Revenues</h1>
            </div>
            <div className="flex justify-between mt-4 space-y-4 sm:space-y-0">
              <div className="flex items-center gap-3">
                <div className="text-lg font-medium">
                  Balance Receivable: <span className="text-green-600">₹{revenues.reduce((sum, revenue) => 
                    sum + calculateBalanceReceivable(revenue), 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex flex-col gap-2 max-w-md w-28 sm:w-40">
                  <Select value={selectedCommissionId} onValueChange={(value) => setSelectedCommissionId(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select commission" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Commissions</SelectItem>
                      {commissions.map((commission) => (
                        <SelectItem key={commission.id} value={commission.id}>{commission.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-2 max-w-md w-28 sm:w-40">
                  <Select value={timePeriod} onValueChange={(value: TimePeriod) => setTimePeriod(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select time period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last3Days">Last 3 Days</SelectItem>
                      <SelectItem value="thisWeek">This Week</SelectItem>
                      <SelectItem value="thisMonth">This Month</SelectItem>
                      <SelectItem value="lastMonth">Last Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddRevenue} className="bg-blue-600 text-white hover:bg-blue-700">
                  Add Revenue
                </Button>
                <Button
                  onClick={handleDownloadExcel}
                  className="bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
                  disabled={revenues.length === 0}
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table className="border-collapse w-full">
              <TableHeader className="bg-gray-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="border-b border-gray-200">
                    {headerGroup.headers.map((header) => {
                      const headerText = header.column.columnDef.header as string;
                      const rightAlignedHeaders = [
                        "GST",
                        "Amount",
                        "CAM Charge",
                        "Less TDS",
                        "Receivable",
                        "Recd in Bank",
                      ];
                      const isRightAligned = rightAlignedHeaders.includes(headerText);

                      return (
                        <TableHead
                          key={header.id}
                          className={`py-1 px-2 text-gray-700 font-medium text-sm ${
                            isRightAligned ? "text-right" : "text-left"
                          }`}
                          style={{ width: `${header.column.columnDef.size}px` }}
                        >
                          {headerText}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {paginatedRevenues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="py-10 text-center text-sm">
                      <div className="text-gray-500 font-medium">
                        No revenues found.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRevenues.map((revenue, index) => (
                    <TableRow
                      key={revenue.id}
                      className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                      }`}
                      onClick={() => handleRowClick(revenue)}
                    >
                      <TableCell className="py-0.5 px-2 text-sm" style={{ width: "135px" }}>
                        {revenue.reimbursement?.name}
                      </TableCell>
                      <TableCell className="py-0.5 px-2 text-sm" style={{ width: "110px" }}>
                        {revenue.commission?.name}
                      </TableCell>
                      <TableCell className="py-0.5 px-2 text-sm text-right" style={{ width: "90px" }}>
                        {(revenue.area).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="py-0.5 px-2 text-sm whitespace-nowrap" style={{ width: "75px" }}>
                        {formatDate(revenue.month, 'monthYear')}
                      </TableCell>
                      <TableCell className="py-0.5 px-2 text-sm" style={{ width: "100px" }}>
                        {revenue.agent?.name}
                      </TableCell>
                      <TableCell className="py-0.5 px-2 text-sm text-right" style={{ width: "80px" }}>
                        ₹{(revenue.amount).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="py-0.5 px-2 text-sm text-right" style={{ width: "90px" }}>
                        ₹{(revenue.camCharge).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="py-0.5 px-2 text-sm text-right" style={{ width: "50px" }}>
                        ₹{(revenue.gst).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="py-0.5 px-2 text-sm text-right" style={{ width: "90px" }}>
                        ₹{(revenue.lessTds).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="py-0.5 px-2 text-sm text-right" style={{ width: "90px" }}>
                        ₹{(revenue.receivable).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="py-0.5 px-2 text-sm text-right" style={{ width: "100px" }}>
                        ₹{(revenue.receivedInBank).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="py-0.5 px-2 text-sm" style={{ width: "60px" }}>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRevenueToDelete(revenue);
                            setDeleteModalOpen(true);
                          }}
                          className="h-10 w-10 text-black rounded-md hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
            <DialogContent className="text-white bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle className="text-left text-gray-700">Confirm Deletion</DialogTitle>
                <DialogDescription className="text-left text-gray-600">
                  Are you sure you want to delete the revenue for "<b>{revenueToDelete?.reimbursement.name}</b>"?
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setRevenueToDelete(undefined);
                  }}
                  className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-300"
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  className="bg-red-600 text-white hover:bg-red-700"
                  disabled={isSaving}
                >
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {revenues.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 px-2 gap-4 sm:gap-0">
              <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
                <span className="text-sm text-gray-600">Rows per page:</span>
                <Select
                  value={revenuesPerPage.toString()}
                  onValueChange={(value) => {
                    setRevenuesPerPage(Number(value));
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
        </>
      )}
    </div>
  );
};

export default RevenuePage;