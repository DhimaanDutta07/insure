import React, { useEffect, useState } from 'react';
import { getAllPolicyGroups, createPolicyGroup, updatePolicyGroup, deletePolicyGroup } from '../services/policyGroup.service';
import type { PolicyGroup } from '../types/index';
import PolicyGroupModal from '../components/PolicyGroupForm';
import { Button } from '../components/ui/button';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

const PolicyGroupPage: React.FC = () => {
  const [policyGroups, setPolicyGroups] = useState<PolicyGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<PolicyGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<PolicyGroup | undefined>(undefined);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<PolicyGroup | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [groupsPerPage] = useState(10);

  const fetchGroups = () => {
    setLoading(true);
    getAllPolicyGroups()
      .then((groups) => {
        setPolicyGroups(groups);
        setFilteredGroups(groups);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch policy groups');
        toast.error('Failed to fetch policy groups');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    const filtered = policyGroups.filter(group =>
      group.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredGroups(filtered);
    setCurrentPage(1);
  }, [searchTerm, policyGroups]);

  const handleCreate = async (values: { name: string; description?: string | null }) => {
    setFormLoading(true);
    try {
      if (selectedGroup) {
        await updatePolicyGroup(selectedGroup.id, values);
        toast.success('Policy group updated successfully');
      } else {
        await createPolicyGroup(values);
        toast.success('Policy group created successfully');
      }
      setShowCreateModal(false);
      setSelectedGroup(undefined);
      fetchGroups();
    } catch (err) {
      console.error(err);
      toast.error(selectedGroup ? 'Failed to update policy group' : 'Failed to create policy group');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePolicyGroup(id);
      toast.success('Policy group deleted successfully');
      fetchGroups();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete policy group');
    }
  };

  const openEditModal = (group: PolicyGroup) => {
    setSelectedGroup(group);
    setShowCreateModal(true);
  };

  const openDeleteModal = (group: PolicyGroup) => {
    setGroupToDelete(group);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (groupToDelete) {
      await handleDelete(groupToDelete.id);
      setDeleteModalOpen(false);
      setGroupToDelete(undefined);
    }
  };

  // Pagination logic
  const indexOfLastGroup = currentPage * groupsPerPage;
  const indexOfFirstGroup = indexOfLastGroup - groupsPerPage;
  const currentGroups = filteredGroups.slice(indexOfFirstGroup, indexOfLastGroup);
  const totalPages = Math.ceil(filteredGroups.length / groupsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Policy Groups</h1>
        <Button
          onClick={() => {
            setSelectedGroup(undefined);
            setShowCreateModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Policy Group
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="mb-4">
        <Input
          placeholder="Search policy groups..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Policy Names</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center">
                  <div className="text-gray-500">Loading...</div>
                </TableCell>
              </TableRow>
            ) : currentGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center">
                  <div className="text-gray-500">No policy groups found.</div>
                </TableCell>
              </TableRow>
            ) : (
              currentGroups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">{group.name}</TableCell>
                  <TableCell>{group.description || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {group.itemNames?.length || 0} items
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(group)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteModal(group)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">
            Showing {indexOfFirstGroup + 1} to {Math.min(indexOfLastGroup, filteredGroups.length)} of {filteredGroups.length} policy groups
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          {Array.from({ length: totalPages }, (_, i) => (
            <Button
              key={i + 1}
              variant={currentPage === i + 1 ? "default" : "outline"}
              size="sm"
              onClick={() => paginate(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Policy Group Modal */}
      <PolicyGroupModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        policyGroup={selectedGroup}
        onSubmit={handleCreate}
        loading={formLoading}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-left text-gray-700">Confirm Delete</DialogTitle>
            <DialogDescription className="text-left text-gray-600">
              Are you sure you want to delete "<b>{groupToDelete?.name}</b>"? This action cannot be undone.
            </DialogDescription>
            {error && (
              <div className="text-left mt-2 p-2 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setGroupToDelete(undefined);
                setError(null);
              }}
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-300"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PolicyGroupPage; 