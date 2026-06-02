import React, { useState, useEffect } from "react";
import { getAllPolicyTypes, createPolicyType, updatePolicyType, deletePolicyType, PolicyType } from "../services/policyType.service";
import { Button } from "./ui/button";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { PolicyTypeModal } from "./PolicyTypeModal";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { toast } from "sonner";

const PolicyTypePage: React.FC = () => {
  const [policyTypes, setPolicyTypes] = useState<PolicyType[]>([]);
  const [filteredPolicyTypes, setFilteredPolicyTypes] = useState<PolicyType[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [policyTypesPerPage] = useState(10);
  const [selectedPolicyType, setSelectedPolicyType] = useState<PolicyType | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [policyTypeToDelete, setPolicyTypeToDelete] = useState<PolicyType | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchPolicyTypes = async () => {
    try {
      const res = await getAllPolicyTypes();
      setPolicyTypes(res);
      setFilteredPolicyTypes(res);
    } catch (err) {
      console.error(err);
      setErrorMessage("Error fetching policy types");
      toast.error("Failed to fetch policy types");
    }
  };

  useEffect(() => {
    fetchPolicyTypes();
  }, []);

  useEffect(() => {
    const filtered = policyTypes.filter(policyType =>
      policyType.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPolicyTypes(filtered);
    setCurrentPage(1);
  }, [searchTerm, policyTypes]);

  const handleDelete = async (id: string): Promise<boolean> => {
    if (isSaving) return false;
    setIsSaving(true);
    try {
      await deletePolicyType(id);
      await fetchPolicyTypes();
      toast.success("Policy type deleted successfully");
      return true;
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 400) {
        const errorMessage = err.response?.data?.error || "Cannot delete policy type";
        setErrorMessage(errorMessage);
        toast.error(errorMessage);
      } else if (err.response?.status === 404) {
        setErrorMessage("Policy type not found");
        toast.error("Policy type not found");
      } else {
        setErrorMessage("Failed to delete policy type");
        toast.error("Failed to delete policy type");
      }
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (data: any) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      if (selectedPolicyType) {
        await updatePolicyType(selectedPolicyType.id, data);
        toast.success("Policy type updated successfully");
      } else {
        await createPolicyType(data);
        toast.success("Policy type created successfully");
      }
      await fetchPolicyTypes();
      setModalOpen(false);
      setSelectedPolicyType(undefined);
    } catch (err) {
      console.error(err);
      toast.error(selectedPolicyType ? "Failed to update policy type" : "Failed to create policy type");
    } finally {
      setIsSaving(false);
    }
  };

  const openCreateModal = () => {
    setSelectedPolicyType(undefined);
    setModalOpen(true);
  };

  const openEditModal = (policyType: PolicyType) => {
    setSelectedPolicyType(policyType);
    setModalOpen(true);
  };

  const openDeleteModal = (policyType: PolicyType) => {
    setPolicyTypeToDelete(policyType);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (policyTypeToDelete) {
      setErrorMessage(null); // Clear any previous error messages
      const success = await handleDelete(policyTypeToDelete.id);
      // Only close modal if deletion was successful
      if (success) {
        setDeleteModalOpen(false);
        setPolicyTypeToDelete(undefined);
      }
    }
  };

  // Pagination logic
  const indexOfLastPolicyType = currentPage * policyTypesPerPage;
  const indexOfFirstPolicyType = indexOfLastPolicyType - policyTypesPerPage;
  const currentPolicyTypes = filteredPolicyTypes.slice(indexOfFirstPolicyType, indexOfLastPolicyType);
  const totalPages = Math.ceil(filteredPolicyTypes.length / policyTypesPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Policy Types</h1>
        <Button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Policy Type
        </Button>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {errorMessage}
        </div>
      )}

      <div className="mb-4">
        <Input
          placeholder="Search policy types..."
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
              <TableHead>Policies Count</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentPolicyTypes.map((policyType) => (
              <TableRow key={policyType.id}>
                <TableCell className="font-medium">{policyType.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {policyType._count?.policies || 0} policies
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(policyType)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteModal(policyType)}
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
            Showing {indexOfFirstPolicyType + 1} to {Math.min(indexOfLastPolicyType, filteredPolicyTypes.length)} of {filteredPolicyTypes.length} policy types
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

      {/* PolicyType Modal */}
      <PolicyTypeModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedPolicyType(undefined);
        }}
        onSave={handleSave}
        policyType={selectedPolicyType}
        isSaving={isSaving}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-left text-gray-700">Confirm Delete</DialogTitle>
            <DialogDescription className="text-left text-gray-600">
              Are you sure you want to delete "<b>{policyTypeToDelete?.name}</b>"? This action cannot be undone.
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
                setPolicyTypeToDelete(undefined);
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

export default PolicyTypePage; 