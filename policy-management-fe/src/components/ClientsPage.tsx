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
import { ClientModal } from "./ClientModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { formatDate } from "./dateFormatter";

interface Client {
  id: string;
  name: string;
  phone: number | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  status: "Active" | "Inactive";
}

const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [clientsPerPage, setClientsPerPage] = useState(10);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Added for error display

  const fetchClients = async () => {
    try {
      const url = `${import.meta.env.VITE_BASE_URL}/api/v1/clients`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      const sortedClients = res.data.sort(
        (a: Client, b: Client) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setClients(sortedClients);
    } catch (err) {
      console.error("Error fetching clients:", err);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleDelete = async (id: string) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const url = `${import.meta.env.VITE_BASE_URL}/api/v1/clients/${id}`;
      await axios.delete(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      await fetchClients();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (client: Client) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const url = `${import.meta.env.VITE_BASE_URL}/api/v1/clients${client.id ? `/${client.id}` : ''}`;
      const method = client.id ? 'patch' : 'post';
      const response = await axios[method](url, client, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      console.log('Save response:', response.data);
      await fetchClients();
      setModalOpen(false);
      setSelectedClient(undefined);
    } catch (err) {
      console.error("Error saving client:", err);
      if (axios.isAxiosError(err)) {
        console.error("Error details:", err.response?.data);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete || isSaving) return;
    setIsSaving(true);
    try {
      await handleDelete(clientToDelete.id);
      setDeleteModalOpen(false);
      setClientToDelete(undefined);
      setErrorMessage(null); // Clear error on success
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        // Extract error message from API response
        setErrorMessage(err.response.data.error || "Failed to delete client.");
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
      console.error("Error deleting client:", err);
      // Keep dialog open to show the error
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client);
    setDeleteModalOpen(true);
    setErrorMessage(null); // Reset error when opening dialog
  };

  const columns: ColumnDef<Client, unknown>[] = [
    { accessorKey: "name", header: "Name", size: 200 },
    { 
      accessorKey: "phone", 
      header: "Phone", 
      size: 90,
      cell: ({ row }) => row.original.phone || "-"
    },
    { 
      accessorKey: "description", 
      header: "Description", 
      size: 200,
      cell: ({ row }) => row.original.description || "-" 
    },
    { accessorKey: "status", header: "Status", size: 70 },
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
      id: "actions",
      header: "Actions",
      size: 80,
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            disabled={isSaving}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedClient(row.original);
              setModalOpen(true);
            }}
            className="h-10 w-10 text-black rounded-md hover:text-blue-800 hover:bg-blue-50"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            disabled={isSaving}
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(row.original);
            }}
            className="h-10 w-10 text-black rounded-md hover:text-red-800 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: clients,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalPages = Math.ceil(clients.length / clientsPerPage);
  const paginatedClients = clients.slice(
    (currentPage - 1) * clientsPerPage,
    currentPage * clientsPerPage
  );

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handleDownloadExcel = () => {
    const excelData = clients.map((client) => ({
      ID: client.id,
      Name: client.name,
      Phone: client.phone || "-",
      Description: client.description || "-",
      Status: client.status,
      "Created At": formatDate(client.createdAt),
      "Updated At": formatDate(client.updatedAt),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    ws["!cols"] = [
      { wch: 20 },
      { wch: 15 },
      { wch: 30 },
      { wch: 10 },
      { wch: 20 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Clients");
    const filename = `clients.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4 space-y-4">
        <h1 className="text-2xl font-semibold mb-2 hidden sm:block">Clients</h1>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => { 
              setSelectedClient(undefined); 
              setModalOpen(true); 
            }} 
            className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
            disabled={isSaving}
          >
            Add Client
          </Button>
          <Button
            onClick={handleDownloadExcel}
            className="bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
            disabled={clients.length === 0 || isSaving}
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
            {paginatedClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm">
                  <div className="text-gray-500 font-medium">
                    No clients found.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedClients.map((client, index) => (
                <TableRow
                  key={client.id}
                  className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                  }`}
                >
                  <TableCell className="py-0.5 pl-4 text-sm" style={{ width: "200px" }}>
                    {client.name}
                  </TableCell>
                  <TableCell className="py-0.5 pl-4 text-sm" style={{ width: "90px" }}>
                    {client.phone || "-"}
                  </TableCell>
                  <TableCell className="py-0.5 pl-4 text-sm" style={{ width: "200px" }}>
                    {client.description || "-"}
                  </TableCell>
                  <TableCell className="py-0.5 pl-4 text-sm" style={{ width: "70px" }}>
                    {client.status}
                  </TableCell>
                  <TableCell className="py-0.5 pl-4 text-sm" style={{ width: "150px" }}>
                    {formatDate(client.createdAt)}
                  </TableCell>
                  <TableCell className="py-0.5 pl-4 text-sm" style={{ width: "150px" }}>
                    {formatDate(client.updatedAt)}
                  </TableCell>
                  <TableCell className="py-0.5 pl-4 text-sm" style={{ width: "80px" }}>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isSaving}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClient(client);
                          setModalOpen(true);
                        }}
                        className="h-10 w-10 text-black rounded-md hover:text-blue-800 hover:bg-blue-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isSaving}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(client);
                        }}
                        className="h-10 w-10 text-black rounded-md hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ClientModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        client={selectedClient}
        onSave={handleSave}
      />
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="text-white bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-left text-gray-700">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-left text-gray-600">
              Are you sure you want to delete the client "<b>{clientToDelete?.name}</b>"? 
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
                setClientToDelete(undefined);
                setErrorMessage(null); // Clear error when closing dialog
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
      {clients.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 px-2 gap-4 sm:gap-0">
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <Select
              value={clientsPerPage.toString()}
              onValueChange={(value) => {
                setClientsPerPage(Number(value));
                setCurrentPage(1);
              }}
              disabled={isSaving}
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
              disabled={currentPage <= 1 || isSaving}
              onClick={() => handlePageChange(1)}
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <ChevronsLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage <= 1 || isSaving}
              onClick={() => handlePageChange(currentPage - 1)}
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage >= totalPages || isSaving}
              onClick={() => handlePageChange(currentPage + 1)}
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage >= totalPages || isSaving}
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

export default ClientsPage;