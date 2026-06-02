import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { ColumnDef, useReactTable, getCoreRowModel } from '@tanstack/react-table';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit, Plus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { formatDate } from './dateFormatter';

// API_TOKEN = `Bearer ${localStorage.getItem("authToken")}`; // Replace with auth logic

interface Site {
  id: string;
  name: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  name: string;
  sites?: Site[] | null; // Multiple sites
}

interface AssignFormData {
  site_ids: string[];
  user_id: string;
}

const SitePage: React.FC = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sitesPerPage, setSitesPerPage] = useState(10);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [formData, setFormData] = useState({ name: '', address: '' });
  const [assignFormData, setAssignFormData] = useState<AssignFormData>({ site_ids: [], user_id: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sitesRes, usersRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_BASE_URL}/api/v1/sites`, { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } }),
          axios.get(`${import.meta.env.VITE_BASE_URL}/api/v1/users`, { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } }),
        ]);
        const sortedSiteData = sitesRes.data.sort((a: Site, b: Site) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setSites(sortedSiteData);
        setUsers(usersRes.data.data);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchData();
  }, [assignDialogOpen]);

  const columns: ColumnDef<Site>[] = [
    { accessorKey: 'name', header: 'Name' },
    // { accessorKey: 'address', header: 'Address', cell: ({ row }) => row.original.address || 'N/A' },
    {
      accessorKey: 'created_at',
      header: 'Created At',
      cell: ({ row }) => formatDate(row.original.created_at),
    },
    {
      id: 'users',
      header: 'Assigned Users',
      cell: ({ row }) =>
        users.filter(u => u.sites?.some(s => s.id === row.original.id)).map(u => u.name).join(', ') || 'None',
    },
  ];

  const table = useReactTable({
    data: sites,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalPages = Math.ceil(sites.length / sitesPerPage);
  const paginatedSites = sites.slice(
    (currentPage - 1) * sitesPerPage,
    currentPage * sitesPerPage
  );

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAssignInputChange = (name: string, value: string) => {
    setAssignFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (isCreateMode) {
        const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/v1/sites`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}`,'Content-Type': 'application/json'},
          
        });
        setSites(prev => [...prev, res.data]);
      } else if (selectedSite) {
        const res = await axios.patch(
          `${import.meta.env.VITE_BASE_URL}/api/v1/sites/${selectedSite.id}`,
          formData,
          { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } }
        );
        setSites(prev => prev.map(s => (s.id === selectedSite.id ? res.data : s)));
      }
      setDialogOpen(false);
      resetForm();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data?.error || err.message);
      } else {
        setError((err as Error).message);
      }
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || err.message);
      } else {
        setError((err as Error).message);
      }
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!assignFormData.site_ids.length || !assignFormData.user_id) {
      setError('Both site and user must be selected');
      return;
    }

    try {
      const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/v1/sites/assign-multiple`, {
        user_id: assignFormData.user_id,
        site_ids: assignFormData.site_ids
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}`, 'Content-Type': 'application/json' },
      });
      setUsers(prev =>
        prev.map(u => (u.id === assignFormData.user_id ? { ...u, sites: res.data.sites } : u))
      );
      setAssignDialogOpen(false);
      resetAssignForm();

    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || err.message);
      } else {
        setError((err as Error).message);
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', address: '' });
    setIsCreateMode(false);
    setSelectedSite(null);
  };

  const resetAssignForm = () => {
    setAssignFormData({ site_ids: [], user_id: '' });
  };

  const handleAddClick = () => {
    setIsCreateMode(true);
    setSelectedSite(null);
    setFormData({ name: '', address: '' });
    setDialogOpen(true);
  };

  const handleEditClick = (site: Site) => {
    setIsCreateMode(false);
    setSelectedSite(site);
    setFormData({ name: site.name, address: site.address || '' });
    setDialogOpen(true);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-semibold hidden sm:block">Sites</h1>
        <div className="space-x-2 flex justify-end gap-1">
          <Button
            onClick={handleAddClick}
            className="bg-blue-600 text-white hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-4 w-4" /> 
            <span className='hidden sm:inline'>Add</span>
          </Button>
          <Button
            onClick={() => setAssignDialogOpen(true)}
            className="bg-green-600 text-white hover:bg-green-700 flex items-center"
          >
            <Plus className="h-4 w-4" />
            <span className='hidden sm:inline'>Assign</span>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table className="border-collapse w-full">
          <TableHeader className="bg-gray-50">
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id} className="border-b border-gray-200">
                {headerGroup.headers.map(header => (
                  <TableHead
                    key={header.id}
                    className="py-3 px-2 sm:px-4 text-gray-700 font-medium text-left whitespace-nowrap"
                  >
                    {header.column.columnDef.header as string}
                  </TableHead>
                ))}
                <TableHead className="py-3 px-2 sm:px-4 text-gray-700 font-medium text-left w-16">Actions</TableHead>
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {paginatedSites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center">
                  <div className="text-gray-500 font-medium">No sites found.</div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedSites.map((site, index) => (
                <TableRow
                  key={site.id}
                  className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                  }`}
                >
                  <TableCell className="py-0.5 text-sm px-2 sm:px-4 w-[15%] min-w-[120px]">{site.name}</TableCell>
                  <TableCell className="py-0.5 text-sm px-2 sm:px-4 w-[10%] min-w-[180px]">{formatDate(site.created_at)}</TableCell>
                  <TableCell className="py-0.5 text-sm px-2 sm:px-4 w-[65%] min-w-[200px]">
                    {users.filter(u => u.sites?.some(s => s.id === site.id)).map(u => u.name).join(', ') || 'None'}
                  </TableCell>
                  <TableCell className="py-0.5 text-sm px-2 sm:px-4 w-[10%] min-w-[60px]">
                    <Button
                      size="icon" 
                      variant="ghost" 
                      className="h-10 w-10 text-black rounded-md hover:text-blue-800 hover:bg-blue-50"
                      onClick={() => handleEditClick(site)}
                    >
                      <Edit size={20} strokeWidth={1.75} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Update Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white rounded-lg border border-gray-200 shadow-lg">
          <DialogHeader>
            <DialogTitle style={{textAlign:'left'}}>{isCreateMode ? 'Create Site' : 'Update Site'}</DialogTitle>
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
                className="w-full p-2 border rounded"
              />
            </div>
            {/* <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div> */}
            {error && <p className="text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className='hover:bg-gray-100 border border-gray-400'>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
                {isCreateMode ? 'Create' : 'Update'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Site Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white rounded-lg border border-gray-200 shadow-lg">
          <DialogHeader>
            <DialogTitle style={{textAlign:'left'}}>Assign Sites to User</DialogTitle>
            <DialogDescription className='text-gray-400, text-left'>
              <b className='text-red-600'>*</b> Select a user and multiple sites to assign.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">User</label>
              <Select
                value={assignFormData.user_id}
                // onValueChange={(value) => {
                //   handleAssignInputChange('user_id', value);
                //   // When user is selected, set their previously assigned sites
                //   const selectedUser = users.find(u => u.id === value);
                //   if (selectedUser?.sites && selectedUser.sites.length > 0) {
                //     setAssignFormData(prev => ({
                //       ...prev,
                //       site_ids: selectedUser.sites?.map(site => site.id) || []
                //     }));
                //   }
                // }}
                onValueChange={(value) => {
                  handleAssignInputChange('user_id', value);
                  
                  const selectedUser = users.find(u => u.id === value);
                  
                  setAssignFormData(prev => ({
                    ...prev,
                    site_ids: prev.site_ids.length > 0 ? prev.site_ids : selectedUser?.sites?.map(site => site.id) || []
                  }));
                }}                
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} {user.sites?.length ? `(${user.sites.length} sites)` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Sites</label>
              <Select
                value={assignFormData.site_ids[0] || ''}
                onValueChange={(value) => {
                  const newSiteIds = assignFormData.site_ids.includes(value)
                    ? assignFormData.site_ids.filter(id => id !== value)
                    : [...assignFormData.site_ids, value];
                  setAssignFormData(prev => ({ ...prev, site_ids: newSiteIds }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sites" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map(site => (
                    <SelectItem 
                      key={site.id} 
                      value={site.id}
                      className={assignFormData.site_ids.includes(site.id) ? 'bg-blue-100' : ''}
                      style={{borderRadius:'10px'}}
                    >
                      {site.name} {assignFormData.site_ids.includes(site.id) ? '(Selected)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setAssignDialogOpen(false)} className='hover:bg-gray-100 border border-gray-400'>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-600 text-white hover:bg-green-700" >Assign Sites</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {sites.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 px-2 gap-4 sm:gap-0">
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <Select
              value={sitesPerPage.toString()}
              onValueChange={value => {
                setSitesPerPage(Number(value));
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

export default SitePage;