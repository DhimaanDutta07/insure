import React, { useState, useEffect } from "react";
import { getAllPolicyNames, createPolicyName, updatePolicyName, deletePolicyName, PolicyName } from "../services/policyName.service";
import { getAllPolicyGroups } from "../services/policyGroup.service";
import { PolicyGroup } from "../types/index";
import { Button } from "./ui/button";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { PolicyNameModal } from "./PolicyNameModal";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { toast } from "sonner";

const PolicyNamePage: React.FC = () => {
  const [policyNames, setPolicyNames] = useState<PolicyName[]>([]);
  const [policyGroups, setPolicyGroups] = useState<PolicyGroup[]>([]);
  const [filteredPolicyNames, setFilteredPolicyNames] = useState<PolicyName[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [policyNamesPerPage] = useState(10);
  const [selectedPolicyName, setSelectedPolicyName] = useState<PolicyName | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [policyNameToDelete, setPolicyNameToDelete] = useState<PolicyName | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchPolicyNames = async () => {
    try {
      const res = await getAllPolicyNames();
      setPolicyNames(res);
      setFilteredPolicyNames(res);
    } catch (err) {
      console.error(err);
      setErrorMessage("Error fetching policy names");
      toast.error("Failed to fetch policy names");
    }
  };

  const fetchPolicyGroups = async () => {
    try {
      const res = await getAllPolicyGroups();
      setPolicyGroups(res);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch policy groups");
    }
  };

  useEffect(() => {
    fetchPolicyNames();
    fetchPolicyGroups();
  }, []);

  useEffect(() => {
    const filtered = policyNames.filter(policyName =>
      policyName.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policyName.policyGroup?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policyName.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPolicyNames(filtered);
    setCurrentPage(1);
  }, [searchTerm, policyNames]);

  const handleDelete = async (id: string) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await deletePolicyName(id);
      await fetchPolicyNames();
      toast.success("Policy name deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete policy name");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (data: any) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      if (selectedPolicyName) {
        await updatePolicyName(selectedPolicyName.id, data);
        toast.success("Policy name updated successfully");
      } else {
        if (!data.policy_group_id) {
          toast.error("Please select a policy group");
          setIsSaving(false);
          return;
        }
        await createPolicyName(data.policy_group_id, data);
        toast.success("Policy name created successfully");
      }
      await fetchPolicyNames();
      setModalOpen(false);
      setSelectedPolicyName(undefined);
    } catch (err) {
      console.error(err);
      toast.error(selectedPolicyName ? "Failed to update policy name" : "Failed to create policy name");
    } finally {
      setIsSaving(false);
    }
  };

  const openCreateModal = () => {
    setSelectedPolicyName(undefined);
    setModalOpen(true);
  };

  const openEditModal = (policyName: PolicyName) => {
    setSelectedPolicyName(policyName);
    setModalOpen(true);
  };

  const openDeleteModal = (policyName: PolicyName) => {
    setPolicyNameToDelete(policyName);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (policyNameToDelete) {
      await handleDelete(policyNameToDelete.id);
      setDeleteModalOpen(false);
      setPolicyNameToDelete(undefined);
    }
  };

  // Pagination logic
  const indexOfLastPolicyName = currentPage * policyNamesPerPage;
  const indexOfFirstPolicyName = indexOfLastPolicyName - policyNamesPerPage;
  const currentPolicyNames = filteredPolicyNames.slice(indexOfFirstPolicyName, indexOfLastPolicyName);
  const totalPages = Math.ceil(filteredPolicyNames.length / policyNamesPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Policy Names</h1>
        <Button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Policy Name
        </Button>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {errorMessage}
        </div>
      )}

      <div className="mb-4">
        <Input
          placeholder="Search policy names..."
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
              <TableHead>Policy Group</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentPolicyNames.map((policyName) => (
              <TableRow key={policyName.id}>
                <TableCell className="font-medium">{policyName.name}</TableCell>
                <TableCell>
                  {policyName.policyGroup ? (
                    <Badge variant="secondary">
                      {policyName.policyGroup.name}
                    </Badge>
                  ) : (
                    <span className="text-gray-500">No group</span>
                  )}
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {policyName.description || "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(policyName)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteModal(policyName)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">
            Showing {indexOfFirstPolicyName + 1} to {Math.min(indexOfLastPolicyName, filteredPolicyNames.length)} of {filteredPolicyNames.length} policy names
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

      {/* PolicyName Modal */}
      <PolicyNameModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedPolicyName(undefined);
        }}
        onSave={handleSave}
        policyName={selectedPolicyName}
        policyGroups={policyGroups}
        isSaving={isSaving}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-left text-gray-700">Confirm Delete</DialogTitle>
            <DialogDescription className="text-left text-gray-600">
              Are you sure you want to delete "<b>{policyNameToDelete?.name}</b>"? This action cannot be undone.
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
                setPolicyNameToDelete(undefined);
                setErrorMessage(null);
              }}
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-300"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={isSaving}
            >
              {isSaving ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PolicyNamePage; 