import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ColumnDef, useReactTable, getCoreRowModel } from '@tanstack/react-table';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit, Plus, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { formatDate } from './dateFormatter';

interface ItemName {
  id: string;
  name: string;
  description?: string;
  item_group_id: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

interface ItemGroup {
  id: string;
  name: string;
  is_deleted: boolean;
}

const ItemNamePage: React.FC = () => {
  const [itemNames, setItemNames] = useState<ItemName[]>([]);
  const [itemGroups, setItemGroups] = useState<ItemGroup[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedItemName, setSelectedItemName] = useState<ItemName | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', item_group_id: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [namesRes, groupsRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_BASE_URL}/api/v1/item-name`, { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } }),
          axios.get(`${import.meta.env.VITE_BASE_URL}/api/v1/item-groups`, { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } }),
        ]);
        const sortedItemNames = namesRes.data.sort((a: ItemName, b: ItemName) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setItemNames(sortedItemNames.filter((inm: ItemName) => !inm.is_deleted));
        setItemGroups(groupsRes.data.itemGroups.filter((ig: ItemGroup) => !ig.is_deleted));
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchData();
  }, []);

  const columns: ColumnDef<ItemName>[] = [
    { accessorKey: 'name', header: 'Name' },
    {
      accessorKey: 'item_group_id',
      header: 'Item Group',
      cell: ({ row }) => itemGroups.find(ig => ig.id === row.original.item_group_id)?.name || 'N/A',
    },
    {
      accessorKey: 'created_at',
      header: 'Created At',
      cell: ({ row }) => formatDate(row.original.created_at),
    },
    { accessorKey: 'description', header: 'Description', cell: ({ row }) => row.original.description || 'N/A' },
  ];
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [itemNameDelete, setItemNameDelete] = useState('');
  const table = useReactTable({
    data: itemNames,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalPages = Math.ceil(itemNames.length / itemsPerPage);
  const paginatedItemNames = itemNames.slice(
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

    if (!formData.item_group_id) {
      setError("Please select an item group");
      return;
    }

    try {
      if (isCreateMode) {
        const res = await axios.post(
          `${import.meta.env.VITE_BASE_URL}/api/v1/item-groups/${formData.item_group_id}/item-names`,
          { name: formData.name, description: formData.description, item_group_id: formData.item_group_id },
          { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } }
        );
        setItemNames(prev => [...prev, res.data]);
      } else if (selectedItemName) {
        const res = await axios.patch(
          `${import.meta.env.VITE_BASE_URL}/api/v1/item-names/${selectedItemName.id}`,
          { name: formData.name, description: formData.description, item_group_id: formData.item_group_id },
          { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } }
        );
        setItemNames(prev => prev.map(inm => (inm.id === selectedItemName.id ? res.data : inm)));
      }
      setDialogOpen(false);
      resetForm();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data?.error || err.message);
      } else {
        setError((err as Error).message);
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${import.meta.env.VITE_BASE_URL}/api/v1/item-names/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      setItemNames((prev) => prev.filter((inm) => inm.id !== id));
    } catch (err) {
      console.error("Error deleting item name:", err);
    } finally {
      setIsDialogOpen(false);
      setDeleteId(null);
    }
  };

  const openDeleteConfirmation = (id: string, itemName: string) => {
    setDeleteId(id);
    setIsDialogOpen(true);
    setItemNameDelete(itemName)
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', item_group_id: '' });
    setIsCreateMode(false);
    setSelectedItemName(null);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-semibold hidden sm:block">Item Names</h1>
        <Button
          onClick={() => {
            setIsCreateMode(true);
            setDialogOpen(true);
          }}
          className="bg-blue-600 text-white hover:bg-blue-700 flex items-center"
        >
          <Plus className="h-4 w-4" /> 
          <span className="hidden sm:inline">Add Item</span>
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table className="border-collapse w-full min-w-[900px]">
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
            {paginatedItemNames.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center">
                  <div className="text-gray-500 font-medium">No item names found.</div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedItemNames.map((itemName, index) => (
                <TableRow
                  key={itemName.id}
                  className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                  }`}
                >
                  <TableCell className="py-0.5">{itemName.name}</TableCell>
                  <TableCell className="py-0.5">
                    {itemGroups.find(ig => ig.id === itemName.item_group_id)?.name || '-'}
                  </TableCell>
                  <TableCell className="py-0.5">{formatDate(itemName.created_at)}</TableCell>
                  <TableCell className="py-0.5">{itemName.description || '-'}</TableCell>
                  <TableCell className="py-0.5">
                    <Button
                      size="icon" 
                      variant="ghost" 
                      className="h-10 w-10 text-black rounded-md  hover:text-blue-800 hover:bg-blue-50"
                      onClick={() => {
                        setSelectedItemName(itemName);
                        setFormData({
                          name: itemName.name,
                          description: itemName.description || '',
                          item_group_id: itemName.item_group_id,
                        });
                        setDialogOpen(true);
                      }}
                    >
                      <Edit  size={20} strokeWidth={1.75} />
                    </Button>
                    <Button
                      size="icon" 
                      variant="ghost" 
                      className="h-10 w-10 text-black rounded-md hover:text-red-800 hover:bg-red-50" 
                      onClick={() => openDeleteConfirmation(itemName.id,itemName.name)}
                    >
                      <Trash2 size={20} strokeWidth={1.75} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the <b>Item Name:</b>{" "}
              <strong>{itemNameDelete}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDialogOpen(false)} className="border border-gray-300 hover:bg-gray-100">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={dialogOpen} onOpenChange={open => {
        if (!open) resetForm();
        setDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-[400px] bg-white rounded-lg border border-gray-200 shadow-lg">
          <DialogHeader>
            <DialogTitle style={{textAlign:'left'}}>{isCreateMode ? 'Create Item Name' : 'Update Item Name'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full p-2 border rounded border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full p-2 border rounded border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Item Group <span className="text-red-500">*</span></label>
              <Select
                value={formData.item_group_id}
                onValueChange={value => setFormData(prev => ({ ...prev, item_group_id: value }))}
              >
                <SelectTrigger className="w-full border border-gray-300 h-10 rounded">
                  <SelectValue placeholder="Select an item group" />
                </SelectTrigger>
                <SelectContent>
                  {itemGroups.map(ig => (
                    <SelectItem key={ig.id} value={ig.id}>
                      {ig.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border border-gray-300 hover:bg-gray-100">
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
                {isCreateMode ? 'Create' : 'Update'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

        {itemNames.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 px-2 space-y-4 sm:space-y-0">
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
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

export default ItemNamePage;