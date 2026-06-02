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
import { ReimbursementModal } from "./ReimbursementModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { formatDate } from "./dateFormatter";

interface Reimbursement {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

const ReimbursementsPage: React.FC = () => {
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [reimbursementsPerPage, setReimbursementsPerPage] = useState(10);
  const [selectedReimbursement, setSelectedReimbursement] = useState<Reimbursement | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reimbursementToDelete, setReimbursementToDelete] = useState<Reimbursement | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Added for error display

  const fetchReimbursements = async () => {
    try {
      const url = `${import.meta.env.VITE_BASE_URL}/api/v1/reimbursements`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      const sortedReimbursements = res.data.sort(
        (a: Reimbursement, b: Reimbursement) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setReimbursements(sortedReimbursements);
    } catch (err) {
      console.error("Error fetching reimbursements:", err);
    }
  };

  useEffect(() => {
    fetchReimbursements();
  }, []);
  const handleDeleteConfirm = async () => {
    if (reimbursementToDelete) {
      try {
        const url = `${import.meta.env.VITE_BASE_URL}/api/v1/reimbursements/${reimbursementToDelete.id}`;
        await axios.delete(url, {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        });
        await fetchReimbursements();
        setDeleteModalOpen(false);
        setReimbursementToDelete(null);
        setErrorMessage(null); // Clear error on success
      } catch (err) {
        if (axios.isAxiosError(err) && err.response) {
          // Extract error message from API response
          setErrorMessage(err.response.data.error || "Failed to delete reimbursement.");
        } else {
          setErrorMessage("An unexpected error occurred.");
        }
        console.error("Error deleting reimbursement:", err);
      }
    }
  };
  const handleDeleteClick = (reimbursement: Reimbursement) => {
    setReimbursementToDelete(reimbursement);
    setDeleteModalOpen(true);
    setErrorMessage(null); // Reset error when opening dialog
  };
  const handleEdit = (reimbursement: Reimbursement) => {
    setSelectedReimbursement(reimbursement);
    setModalOpen(true);
  };

  const columns: ColumnDef<Reimbursement, unknown>[] = [
    { accessorKey: "name", header: "Name", size: 150 },
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
    data: reimbursements,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalPages = Math.ceil(reimbursements.length / reimbursementsPerPage);
  const paginatedReimbursements = reimbursements.slice(
    (currentPage - 1) * reimbursementsPerPage,
    currentPage * reimbursementsPerPage
  );

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handleSave = async (reimbursement: Reimbursement) => {
    setReimbursements(prev =>
      reimbursement.id
        ? prev.map(r => (r.id === reimbursement.id ? reimbursement : r))
        : [...prev, reimbursement]
    );
    await fetchReimbursements();
    setModalOpen(false);
    setSelectedReimbursement(undefined);
  };

  const handleDownloadExcel = () => {
    const excelData = reimbursements.map((reimbursement) => ({
      ID: reimbursement.id,
      Name: reimbursement.name,
      Description: reimbursement.description || "-",
      "Created At": formatDate(reimbursement.createdAt),
      "Updated At": formatDate(reimbursement.updatedAt),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    ws["!cols"] = [
      { wch: 20 }, // Name
      { wch: 30 }, // Description
      { wch: 20 }, // Created At
      { wch: 20 }, // Updated At
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Reimbursements");
    const filename = `reimbursements.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4 space-y-4">
        <h1 className="text-2xl font-semibold mb-2 hidden sm:block">Reimbursements</h1>
        <div className="flex items-center gap-3">
          <Button onClick={() => { setSelectedReimbursement(undefined); setModalOpen(true); }} className="bg-blue-600 text-white hover:bg-blue-700 flex items-center">
          <Plus className="h-4 w-4" /> 
          <span className="hidden sm:inline">Add</span>
          </Button>
          <Button
            onClick={handleDownloadExcel}
            className="bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
            disabled={reimbursements.length === 0}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
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
            {paginatedReimbursements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm">
                  <div className="text-gray-500 font-medium">
                    No reimbursements found.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedReimbursements.map((reimbursement, index) => (
                <TableRow
                  key={reimbursement.id}
                  className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                  }`}
                >
                  <TableCell className="py-0.5 px-4 text-sm" style={{ width: "150px" }}>
                    {reimbursement.name}
                  </TableCell>
                  <TableCell className="py-0.5 px-4 text-sm" style={{ width: "200px" }}>
                    {reimbursement.description || "-"}
                  </TableCell>
                  <TableCell className="py-0.5 px-4 text-sm" style={{ width: "150px" }}>
                    {formatDate(reimbursement.createdAt)}
                  </TableCell>
                  <TableCell className="py-0.5 px-4 text-sm" style={{ width: "150px" }}>
                    {formatDate(reimbursement.updatedAt)}
                  </TableCell>
                  <TableCell className="py-0.5 px-4 text-sm" style={{ width: "70px" }}>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(reimbursement)}
                        className="h-10 w-10 text-black rounded-md hover:text-blue-800 hover:bg-blue-50"
                      >
                        <Pencil size={20} strokeWidth={1.75} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(reimbursement)}
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

      <ReimbursementModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        reimbursement={selectedReimbursement}
        onSave={handleSave}
      />
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="text-white bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-left text-gray-700">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-left text-gray-600">
              Are you sure you want to delete the reimbursement "<b>{reimbursementToDelete?.name}</b>"? 
              This action cannot be undone.
            </DialogDescription>
            {/* Display error message inside dialog */}
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
                setReimbursementToDelete(null);
                setErrorMessage(null); // Clear error when closing dialog
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
      {reimbursements.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 px-2 gap-4 sm:gap-0">
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <Select
              value={reimbursementsPerPage.toString()}
              onValueChange={(value) => {
                setReimbursementsPerPage(Number(value));
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

export default ReimbursementsPage;