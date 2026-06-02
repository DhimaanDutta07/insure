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
  Pencil,
  Plus,
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
import CommissionModal from "./CommissionModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { formatDate } from "./dateFormatter";

interface Commission {
  id: string;
  name: string;
  amount: number;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

const CommissionPage: React.FC = () => {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [commissionsPerPage, setCommissionsPerPage] = useState(10);
  const [selectedCommission, setSelectedCommission] = useState<Commission | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [commissionToDelete, setCommissionToDelete] = useState<Commission | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchCommissions = async () => {
    try {
      const url = `${import.meta.env.VITE_BASE_URL}/api/v1/commissions`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      const sortedCommissions = res.data.sort(
        (a: Commission, b: Commission) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setCommissions(sortedCommissions);
    } catch (err) {
      console.error("Error fetching commissions:", err);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, []);

  const handleDeleteConfirm = async () => {
    if (commissionToDelete) {
      try {
        const url = `${import.meta.env.VITE_BASE_URL}/api/v1/commissions/${commissionToDelete.id}`;
        await axios.delete(url, {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        });
        await fetchCommissions();
        setDeleteModalOpen(false);
        setCommissionToDelete(null);
        setErrorMessage(null);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response) {
          setErrorMessage(err.response.data.error || "Failed to delete commission.");
        } else {
          setErrorMessage("An unexpected error occurred.");
        }
        console.error("Error deleting commission:", err);
      }
    }
  };

  const handleDeleteClick = (commission: Commission) => {
    setCommissionToDelete(commission);
    setDeleteModalOpen(true);
    setErrorMessage(null);
  };

  const handleEdit = (commission: Commission) => {
    setSelectedCommission(commission);
    setModalOpen(true);
  };

  const columns: ColumnDef<Commission, unknown>[] = [
    { accessorKey: "name", header: "Name", size: 150 },
    { accessorKey: "amount", header: "Amount", size: 120, cell: ({ row }) => row.original.amount },
    {
      accessorKey: "description",
      header: "Description",
      size: 200,
      cell: ({ row }) => row.original.description || '-'
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => formatDate(row.original.createdAt),
      size: 150,
    },
    {
      accessorKey: "updatedAt",
      header: "Updated At",
      cell: ({ row }) => formatDate(row.original.updatedAt),
      size: 150,
    },
    {
      accessorKey: "actions",
      header: "Actions",
      size: 60,
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(row.original)}
            className="h-10 w-10 text-black rounded-md  hover:text-blue-800 hover:bg-blue-50"
            >
            <Pencil size={20} strokeWidth={1.75} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteClick(row.original)}
            className="h-10 w-10 text-black rounded-md hover:text-red-800 hover:bg-red-50" 
            >
            <Trash2 size={20} strokeWidth={1.75}  />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: commissions,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalPages = Math.ceil(commissions.length / commissionsPerPage);
  const paginatedCommissions = commissions.slice(
    (currentPage - 1) * commissionsPerPage,
    currentPage * commissionsPerPage
  );

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handleSave = async (commission: Commission) => {
    setCommissions(prev =>
      commission.id
        ? prev.map(r => (r.id === commission.id ? commission : r))
        : [...prev, commission]
    );
    await fetchCommissions();
    setModalOpen(false);
    setSelectedCommission(undefined);
  };

  const handleDownloadExcel = () => {
    const excelData = commissions.map((commission) => ({
      ID: commission.id,
      Name: commission.name,
      Amount: commission.amount,
      Description: commission.description || "-",
      "Created At": formatDate(commission.createdAt),
      "Updated At": formatDate(commission.updatedAt),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    ws["!cols"] = [
      { wch: 20 }, // Name
      { wch: 15 }, // Amount
      { wch: 30 }, // Description
      { wch: 20 }, // Created At
      { wch: 20 }, // Updated At
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Commissions");
    const filename = `commissions.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Commissions</h1>
        <div className="flex items-center gap-3">
          <Button onClick={() => { setSelectedCommission(undefined); setModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Commission
          </Button>
          <Button
            onClick={handleDownloadExcel}
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={commissions.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table className="border-collapse w-full" style={{ tableLayout: "fixed" }}>
          <TableHeader className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-gray-200">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="py-2 px-4 text-gray-700 font-medium text-left text-sm"
                    style={{ width: `${header.column.columnDef.size}px` }}
                  >
                    {header.column.columnDef.header as string}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {paginatedCommissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm">
                  <div className="text-gray-500 font-medium">
                    No commissions found.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedCommissions.map((commission, index) => (
                <TableRow
                  key={commission.id}
                  className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                  }`}
                >
                  <TableCell className="py-0.5 px-4 text-sm" style={{ width: "150px" }}>
                    {commission.name}
                  </TableCell>
                  <TableCell className="py-0.5 px-4 text-sm" style={{ width: "120px" }}>
                    {commission.amount}
                  </TableCell>
                  <TableCell className="py-0.5 px-4 text-sm" style={{ width: "200px" }}>
                    {commission.description || "-"}
                  </TableCell>
                  <TableCell className="py-0.5 px-4 text-sm" style={{ width: "150px" }}>
                    {formatDate(commission.createdAt)}
                  </TableCell>
                  <TableCell className="py-0.5 px-4 text-sm" style={{ width: "150px" }}>
                    {formatDate(commission.updatedAt)}
                  </TableCell>
                  <TableCell className="py-0.5 px-4 text-sm" style={{ width: "70px" }}>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(commission)}
                        className="h-10 w-10 text-black rounded-md hover:text-blue-800 hover:bg-blue-50"
                      >
                        <Pencil size={20} strokeWidth={1.75} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(commission)}
                        className="h-10 w-10 text-black rounded-md hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 size={20} strokeWidth={1.75} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CommissionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        commission={selectedCommission}
        onSave={handleSave}
      />
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="text-white bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-left text-gray-700">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-left text-gray-600">
              Are you sure you want to delete the commission "<b>{commissionToDelete?.name}</b>"? 
              This action cannot be undone.
            </DialogDescription>
            {errorMessage && (
              <div className="text-left mt-2 p-2 bg-red-100 text-red-700 rounded">
                {errorMessage}
              </div>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setCommissionToDelete(null);
                setErrorMessage(null);
              }}
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-300"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {commissions.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 px-4 py-4 bg-gray-50/50 border-t border-gray-200 gap-4 sm:gap-0">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-start">
            <span className="text-sm font-medium text-gray-700">Rows per page:</span>
            <Select
              value={commissionsPerPage.toString()}
              onValueChange={(value) => {
                setCommissionsPerPage(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-20 h-9 border-gray-300 bg-white text-sm font-medium">
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
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
            <span className="text-sm font-medium text-gray-700">
              Page {currentPage} of {totalPages || 1}
            </span>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-center sm:justify-end">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(1)}
              className="h-9 w-9 border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              title="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="h-9 w-9 border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="h-9 w-9 border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              title="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(totalPages)}
              className="h-9 w-9 border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              title="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommissionPage; 