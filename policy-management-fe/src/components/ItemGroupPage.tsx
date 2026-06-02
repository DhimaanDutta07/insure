import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ColumnDef, useReactTable, getCoreRowModel } from '@tanstack/react-table';
import { Button } from './ui/button';
// import { Dialog, DialogContent, DialogTitle } from '@radix-ui/react-dialog';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@radix-ui/react-select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

// API_TOKEN = `Bearer ${localStorage.getItem("authToken")}`; // Replace with auth logic

interface ItemGroup {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

const ItemGroupPage: React.FC = () => {
  const [itemGroups, setItemGroups] = useState<ItemGroup[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedItemGroup, setSelectedItemGroup] = useState<ItemGroup | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItemGroups = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/v1/item-groups`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        });
        setItemGroups(res.data.itemGroups.filter((ig: ItemGroup) => !ig.is_deleted));
      } catch (err) {
        console.error('Error fetching item groups:', err);
      }
    };
    fetchItemGroups();
  }, []);

  const columns: ColumnDef<ItemGroup>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'description', header: 'Description', cell: ({ row }) => row.original.description || 'N/A' },
    {
      accessorKey: 'created_at',
      header: 'Created At',
      cell: ({ row }) => format(new Date(row.original.created_at), 'PPp'),
    },
  ];

  const table = useReactTable({
    data: itemGroups,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalPages = Math.ceil(itemGroups.length / itemsPerPage);
  const paginatedItemGroups = itemGroups.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (isCreateMode) {
        const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/v1/item-groups`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        });
        setItemGroups(prev => [...prev, res.data]);
      } else if (selectedItemGroup) {
        const res = await axios.patch(
          `${import.meta.env.VITE_BASE_URL}/api/v1/item-groups/${selectedItemGroup.id}`,
          formData,
          { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } }
        );
        setItemGroups(prev => prev.map(ig => (ig.id === selectedItemGroup.id ? res.data : ig)));
      }
      setDialogOpen(false);
      resetForm();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${import.meta.env.VITE_BASE_URL}/api/v1/item-groups/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      setItemGroups(prev => prev.filter(ig => ig.id !== id));
    } catch (err) {
      console.error('Error deleting item group:', err);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setIsCreateMode(false);
    setSelectedItemGroup(null);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-semibold">Item Groups</h1>
        <Button
          onClick={() => {
            setIsCreateMode(true);
            setDialogOpen(true);
          }}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Item Group
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table className="border-collapse w-full">
          <TableHeader className="bg-gray-50">
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id} className="border-b border-gray-200">
                {headerGroup.headers.map(header => (
                  <TableHead
                    key={header.id}
                    className="py-3 text-gray-700 font-medium text-left"
                  >
                    {header.column.columnDef.header as string}
                  </TableHead>
                ))}
                <TableHead className="py-3 text-gray-700 font-medium text-left">Actions</TableHead>
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {paginatedItemGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center">
                  <div className="text-gray-500 font-medium">No item groups found.</div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedItemGroups.map((itemGroup, index) => (
                <TableRow
                  key={itemGroup.id}
                  className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                  }`}
                >
                  <TableCell className="py-4">{itemGroup.name}</TableCell>
                  <TableCell className="py-4">{itemGroup.description || 'N/A'}</TableCell>
                  <TableCell className="py-4">{format(new Date(itemGroup.created_at), 'PPp')}</TableCell>
                  <TableCell className="py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedItemGroup(itemGroup);
                        setFormData({ name: itemGroup.name, description: itemGroup.description || '' });
                        setDialogOpen(true);
                      }}
                      className="mr-2"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(itemGroup.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white rounded-lg border border-gray-200 shadow-lg">
          <DialogHeader>
            <DialogTitle>{isCreateMode ? 'Create Item Group' : 'Update Item Group'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            {error && <p className="text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
                {isCreateMode ? 'Create' : 'Update'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {itemGroups.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 px-2 gap-4 sm:gap-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={value => {
                setItemsPerPage(Number(value));
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
          <div className="flex items-center gap-1 mx-2 w-full sm:w-auto justify-center">
            <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
          </div>
          <div className="flex space-x-1 w-full sm:w-auto justify-center sm:justify-end">
            <Button variant="outline" size="icon" disabled={currentPage <= 1} onClick={() => handlePageChange(1)}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" disabled={currentPage <= 1} onClick={() => handlePageChange(currentPage - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" disabled={currentPage >= totalPages} onClick={() => handlePageChange(currentPage + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" disabled={currentPage >= totalPages} onClick={() => handlePageChange(totalPages)}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemGroupPage;