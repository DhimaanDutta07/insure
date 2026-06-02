import React, { useState, useEffect } from "react";
import { getAllCompanies, Company } from "../services/company.service";
import { Button } from "./ui/button";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { CompanyFormFieldModal } from "./CompanyFormFieldModal";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import axios from "axios";

interface CompanyFormField {
  id: string;
  company_id: string;
  label: string;
  field_type: string;
  is_required: boolean;
  order: number;
  company?: Company;
}

interface CreateCompanyFormFieldRequest {
  company_id: string;
  label: string;
  field_type: string;
  is_required: boolean;
  order: number;
}

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const CompanyFormFieldPage: React.FC = () => {
  const [companyFormFields, setCompanyFormFields] = useState<CompanyFormField[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredFormFields, setFilteredFormFields] = useState<CompanyFormField[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [formFieldsPerPage] = useState(10);
  const [selectedFormField, setSelectedFormField] = useState<CompanyFormField | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [formFieldToDelete, setFormFieldToDelete] = useState<CompanyFormField | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCompanyFormFields = async () => {
    try {
      const companies = await getAllCompanies();
      setCompanies(companies);
      
      // Fetch form fields for all companies
      const allFormFields: CompanyFormField[] = [];
      for (const company of companies) {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/v1/company-form-fields/${company.id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            },
          });
          const formFields = response.data.map((field: any) => ({
            ...field,
            company: company,
          }));
          allFormFields.push(...formFields);
        } catch (err) {
          console.error(`Error fetching form fields for company ${company.id}:`, err);
        }
      }
      
      setCompanyFormFields(allFormFields);
      setFilteredFormFields(allFormFields);
    } catch (err) {
      console.error(err);
      setErrorMessage("Error fetching company form fields");
      toast.error("Failed to fetch company form fields");
    }
  };

  useEffect(() => {
    fetchCompanyFormFields();
  }, []);

  useEffect(() => {
    let filtered = companyFormFields;
    
    // Filter by company
    if (selectedCompany !== "all") {
      filtered = filtered.filter(field => field.company_id === selectedCompany);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(field =>
        field.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.field_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.company?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredFormFields(filtered);
    setCurrentPage(1);
  }, [searchTerm, selectedCompany, companyFormFields]);

  const handleDelete = async (id: string) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await axios.delete(`${API_BASE_URL}/api/v1/company-form-field/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      await fetchCompanyFormFields();
      toast.success("Company form field deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete company form field");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (data: CreateCompanyFormFieldRequest) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      if (selectedFormField) {
        await axios.patch(`${API_BASE_URL}/api/v1/company-form-field/${selectedFormField.id}`, data, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        toast.success("Company form field updated successfully");
      } else {
        await axios.post(`${API_BASE_URL}/api/v1/company-form-fields`, data, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        toast.success("Company form field created successfully");
      }
      await fetchCompanyFormFields();
      setModalOpen(false);
      setSelectedFormField(undefined);
    } catch (err) {
      console.error(err);
      toast.error(selectedFormField ? "Failed to update company form field" : "Failed to create company form field");
    } finally {
      setIsSaving(false);
    }
  };

  const openCreateModal = () => {
    setSelectedFormField(undefined);
    setModalOpen(true);
  };

  const openEditModal = (formField: CompanyFormField) => {
    setSelectedFormField(formField);
    setModalOpen(true);
  };

  const openDeleteModal = (formField: CompanyFormField) => {
    setFormFieldToDelete(formField);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (formFieldToDelete) {
      await handleDelete(formFieldToDelete.id);
      setDeleteModalOpen(false);
      setFormFieldToDelete(undefined);
    }
  };

  // Pagination logic
  const indexOfLastFormField = currentPage * formFieldsPerPage;
  const indexOfFirstFormField = indexOfLastFormField - formFieldsPerPage;
  const currentFormFields = filteredFormFields.slice(indexOfFirstFormField, indexOfLastFormField);
  const totalPages = Math.ceil(filteredFormFields.length / formFieldsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Company Form Fields</h1>
        <Button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Form Field
        </Button>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {errorMessage}
        </div>
      )}

      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Search form fields..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={selectedCompany} onValueChange={setSelectedCompany}>
          <SelectTrigger className="max-w-sm">
            <SelectValue placeholder="Filter by company" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Field Type</TableHead>
              <TableHead>Required</TableHead>
              <TableHead>Order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentFormFields.map((formField) => (
              <TableRow key={formField.id}>
                <TableCell className="font-medium">{formField.label}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {formField.company?.name || "Unknown"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {formField.field_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={formField.is_required ? "default" : "secondary"}>
                    {formField.is_required ? "Required" : "Optional"}
                  </Badge>
                </TableCell>
                <TableCell>{formField.order}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(formField)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteModal(formField)}
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
            Showing {indexOfFirstFormField + 1} to {Math.min(indexOfLastFormField, filteredFormFields.length)} of {filteredFormFields.length} form fields
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

      {/* CompanyFormField Modal */}
      <CompanyFormFieldModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedFormField(undefined);
        }}
        onSave={handleSave}
        formField={selectedFormField}
        companies={companies}
        isSaving={isSaving}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the form field "{formFieldToDelete?.label}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
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

export default CompanyFormFieldPage; 