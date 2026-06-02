import React, { useState, useEffect } from "react";
import { getAllCompanies, createCompany, updateCompany, deleteCompany, Company } from "../services/company.service";
import { Button } from "./ui/button";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { CompanyModal } from "./CompanyModal";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { toast } from "sonner";

const CompanyPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [companiesPerPage] = useState(10);
  const [selectedCompany, setSelectedCompany] = useState<Company | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCompanies = async () => {
    try {
      const res = await getAllCompanies();
      setCompanies(res);
      setFilteredCompanies(res);
    } catch (err) {
      console.error(err);
      setErrorMessage("Error fetching companies");
      toast.error("Failed to fetch companies");
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    const filtered = companies.filter(company =>
      company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCompanies(filtered);
    setCurrentPage(1);
  }, [searchTerm, companies]);

  const handleDelete = async (id: string) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await deleteCompany(id);
      await fetchCompanies();
      toast.success("Company deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete company");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (data: any) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      if (selectedCompany) {
        await updateCompany(selectedCompany.id, data);
        toast.success("Company updated successfully");
      } else {
        await createCompany(data);
        toast.success("Company created successfully");
      }
      await fetchCompanies();
      setModalOpen(false);
      setSelectedCompany(undefined);
    } catch (err) {
      console.error(err);
      toast.error(selectedCompany ? "Failed to update company" : "Failed to create company");
    } finally {
      setIsSaving(false);
    }
  };

  const openCreateModal = () => {
    setSelectedCompany(undefined);
    setModalOpen(true);
  };

  const openEditModal = (company: Company) => {
    setSelectedCompany(company);
    setModalOpen(true);
  };

  const openDeleteModal = (company: Company) => {
    setCompanyToDelete(company);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (companyToDelete) {
      await handleDelete(companyToDelete.id);
      setDeleteModalOpen(false);
      setCompanyToDelete(undefined);
    }
  };

  // Pagination logic
  const indexOfLastCompany = currentPage * companiesPerPage;
  const indexOfFirstCompany = indexOfLastCompany - companiesPerPage;
  const currentCompanies = filteredCompanies.slice(indexOfFirstCompany, indexOfLastCompany);
  const totalPages = Math.ceil(filteredCompanies.length / companiesPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Companies</h1>
        <Button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Company
        </Button>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {errorMessage}
        </div>
      )}

      <div className="mb-4">
        <Input
          placeholder="Search companies..."
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
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentCompanies.map((company) => (
              <TableRow key={company.id}>
                <TableCell className="font-medium">{company.name}</TableCell>
                <TableCell>
                  <Badge variant={company.category === 'HEALTH' ? 'default' : 'secondary'}>
                    {company.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(company)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteModal(company)}
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
            Showing {indexOfFirstCompany + 1} to {Math.min(indexOfLastCompany, filteredCompanies.length)} of {filteredCompanies.length} companies
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

      {/* Company Modal */}
      <CompanyModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedCompany(undefined);
        }}
        onSave={handleSave}
        company={selectedCompany}
        isSaving={isSaving}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-left text-gray-700">Confirm Delete</DialogTitle>
            <DialogDescription className="text-left text-gray-600">
              Are you sure you want to delete "<b>{companyToDelete?.name}</b>"? This action cannot be undone.
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
                setCompanyToDelete(undefined);
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

export default CompanyPage; 