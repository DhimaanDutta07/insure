import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Plus, Download, Pencil, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw, MoreVertical, Upload, FileText, X, ChevronDown,
  FilterXIcon, Building2, ArrowRight, History, Link, Copy, Trash2,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../ui/dialog";
import { ClaimSheet } from "../claims/ClaimSheet";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "../ui/dropdown-menu";
import * as XLSX from "xlsx";
import Calendar from "../ui/calendar"; // Use the local Calendar component
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import PolicyTransitionSheet from "./PolicyTransitionSheet";
import PolicyHistorySheet from "./PolicyHistorySheet";
// import { format } from "date-fns";
// import { PolicyGroup } from "../../types";
import { useAuth } from "../../Context/AuthContext";
import { usePolicies, usePolicyGroups, usePrefetchPolicy } from "../../hooks/useApi";

// Custom hook for drag and drop
const useDragAndDrop = (onFileSelect: (file: File) => void) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const validFile = files.find(file => 
      file.type === 'text/csv' || 
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel' ||
      file.name.endsWith('.csv') ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls')
    );

    if (validFile) {
      onFileSelect(validFile);
    }
  }, [onFileSelect]);

  return {
    isDragOver,
    dragHandlers: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    }
  };
};

// Types (keeping all existing interfaces unchanged)
export type InsuranceType =
  | "Health Insurance"
  | "Motor Insurance"
  | "Life Insurance"
  | "all";
export type PolicyStatus =
  | "Fresh"
  | "Migration"
  | "Renewal"
  | "Portablity"
  | "all";







import type { Policy, Company } from '../../types/index';
import { PolicyTransitionService, PolicyTransitionHistory } from '../../services/policyTransition.service';

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "2-digit",
    month: "short",
    day: "numeric",
  });

// Helper function to format date for Excel export (YYYY-MM-DD format)
const formatDateForExport = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const variants: Record<string, string> = {
    Fresh: "bg-green-100 text-green-800 border-green-200",
    Migration: "bg-blue-100 text-blue-800 border-blue-200",
    Renewal: "bg-amber-100 text-amber-800 border-amber-200",
    Portablity: "bg-purple-100 text-purple-800 border-purple-200",
  };
  
  // Map backend values to display names
  const getDisplayName = (status: string) => {
    switch (status) {
      case 'Migration':
        return 'Internal Portability';
      default:
        return status;
    }
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${variants[status] || variants.Inactive} transition-colors`}>
      {getDisplayName(status)}
    </span>
  );
};

interface PolicyListProps {
  loading?: boolean;
  onViewPolicy?: (policy: Policy) => void;
  onEditPolicy?: (policy: Policy) => void;
  onDeletePolicy?: (id: string) => Promise<void>;
  onCreatePolicy?: () => void;
}

const PolicyList: React.FC<PolicyListProps> = ({ 
  loading: externalLoading, 
  onViewPolicy, 
  onEditPolicy, 
  onDeletePolicy,
  onCreatePolicy 
}) => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  // Use React Query hook for instant cached data
  const policyGroupsQuery = usePolicyGroups();
  const policyGroups = policyGroupsQuery.data || [];
  const [policyGroupFilter, setPolicyGroupFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<PolicyStatus>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [policiesPerPage, setPoliciesPerPage] = useState(10000); // Set to high number for infinite
  // Date filter state (must be before useMemo that references it)
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | null, to: Date | null }>({ from: null, to: null });
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  // Calculate from/to based on filter
  const getDateRange = () => {
    const today = new Date();
    let from: Date | null = null;
    let to: Date | null = null;
    if (dateFilter === "last_month") {
      from = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      to = today;
    } else if (dateFilter === "3_months") {
      from = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
      to = today;
    } else if (dateFilter === "6_months") {
      from = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
      to = today;
    } else if (customDateRange.from && customDateRange.to) {
      from = customDateRange.from;
      to = customDateRange.to;
    }
    return { from, to };
  };

  // Build params for the policies query

  const policyParams = React.useMemo(() => {
    const params: Record<string, string | number> = {
      page: currentPage,
      limit: policiesPerPage,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (policyGroupFilter && policyGroupFilter !== 'all') {
      params.policy_group_id = policyGroupFilter;
    }
    if (statusFilter !== "all") {
      params.policy_creation_status = statusFilter;
    }
    const { from, to } = getDateRange();
    if (from) params.from = from.toISOString();
    if (to) params.to = to.toISOString();
    return params;
  }, [currentPage, policiesPerPage, debouncedSearch, policyGroupFilter, statusFilter, dateFilter, customDateRange]);

  const policiesQuery = usePolicies(policyParams);
  const policies = policiesQuery.data?.data || [];
  const totalPolicies = policiesQuery.data?.total || 0;
  const totalPages = policiesQuery.data?.pages || 0;
  const loading = policiesQuery.isLoading || policiesQuery.isFetching;
  const isLoading = externalLoading !== undefined ? externalLoading : loading;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<Policy | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showClaimSheet, setShowClaimSheet] = useState(false);
  const [selectedPolicyForClaim, setSelectedPolicyForClaim] = useState<Policy | null>(null);
  
  // Policy transition states
  const [selectedPolicyForTransition, setSelectedPolicyForTransition] = useState<Policy | null>(null);
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [transitionType, setTransitionType] = useState<'RENEWAL' | 'MIGRATION' | 'PORTABILITY'>('RENEWAL');

  // Policy history states
  const [selectedPolicyForHistory, setSelectedPolicyForHistory] = useState<Policy | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [policyHistoryData, setPolicyHistoryData] = useState<Record<string, PolicyTransitionHistory>>({});
  const [loadingHistory, setLoadingHistory] = useState<Record<string, boolean>>({});
  const [historyErrors, setHistoryErrors] = useState<Record<string, boolean>>({});

  // Import dialog state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<null | {
    created: string[];
    failed: { row: number; errors: unknown }[];
    total: number;
  }>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export state
  const [exporting, setExporting] = useState(false);


  // Debounce search input
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 200);
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [searchTerm]);


  // Fetch policy history for a specific policy
  const fetchPolicyHistory = useCallback(async (policyId: string) => {
    if (policyHistoryData[policyId]) return; // Already loaded
    if (historyErrors[policyId]) return; // Already failed, don't retry
    
    setLoadingHistory(prev => ({ ...prev, [policyId]: true }));
    try {
      const history = await PolicyTransitionService.getTransitionHistory(policyId);
      setPolicyHistoryData(prev => ({ ...prev, [policyId]: history }));
    } catch (error) {
      console.error('Failed to fetch policy history:', error);
      // Mark as failed to prevent infinite retries
      if (error instanceof Error && error.message.includes('401')) {
        setHistoryErrors(prev => ({ ...prev, [policyId]: true }));
      }
      // Don't show toast for background loading
    } finally {
      setLoadingHistory(prev => ({ ...prev, [policyId]: false }));
    }
  }, [policyHistoryData, historyErrors]);

  // Fetch policy history for loaded policies (after declaration)
  useEffect(() => {
    if (policies.length > 0) {
      // Process sequentially to avoid ERR_INSUFFICIENT_RESOURCES
      const fetchSequentially = async () => {
        for (const policy of policies) {
          await fetchPolicyHistory(policy.id);
          // Small delay between requests to avoid overwhelming the browser
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      };
      fetchSequentially();
    }
  }, [policies, fetchPolicyHistory]);

  // Use backend pagination - no need for frontend slicing
  const prefetchPolicy = usePrefetchPolicy();

  // Group policies by customer name, showing only latest
  const groupedByCustomer = React.useMemo(() => {
    const groups: Record<string, Policy[]> = {};
    policies.forEach(policy => {
      const customerName = policy.customer_name || 'Unknown';
      if (!groups[customerName]) {
        groups[customerName] = [];
      }
      groups[customerName].push(policy);
    });
    return groups;
  }, [policies]);

  // Get latest policy for each customer
  const customerLatestPolicies = React.useMemo(() => {
    return Object.entries(groupedByCustomer).map(([customerName, customerPolicies]) => ({
      customerName,
      policies: customerPolicies,
      latestPolicy: customerPolicies.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0],
    }));
  }, [groupedByCustomer]);

  // File handling functions
  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    // Update the file input if needed
    if (fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
    }
  }, []);

  const { isDragOver, dragHandlers } = useDragAndDrop(handleFileSelect);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Import Excel
  const handleImportSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select a file to import.");
      return;
    }
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const token = localStorage.getItem("authToken");
      const res = await axios.post(
        `${(import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '')}/api/v1/policies/import`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setImportResult(res.data);
      toast.success(`${res.data.created?.length || 0} policies imported successfully.`);
      if (res.data.failed?.length > 0) {
        toast.error(`${res.data.failed.length} policies failed to import.`);
      }
      policiesQuery.refetch();
      // Reset file selection after successful import
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // Close the import modal after successful import
      setImportDialogOpen(false);
      // Clear import result after a short delay to show success message
      setTimeout(() => {
        setImportResult(null);
      }, 3000);
    } catch (err) {
      console.error("Import failed:", err);
      toast.error("Failed to import policies. Please check the file format and try again.");
    } finally {
      setImporting(false);
    }
  };

  // Download import template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Policy No.": "POL00214",
        "Company Name": "HDFC ERGO",
        "Policy Group": "Health Insurance",
        "Policy Type": "Family",
        "Product Name": "OPTIMA RESTORE",
        "Policy Salutation": "Mr.",
        "Sum Insured": 500000,
        "Start Date": "2024-02-07",
        "End Date": "2025-02-06",
        "Tenure Years": 1,
        "Premium Amount": 37458,
        "GST Status": "true",
        "Deductible Amount": 0,
        "Deductible Amount Status": true,
        "Medical Condition": true,
        "Policy Creation Status": "Fresh",
        "EMI Amount": 3670,
        "Commission Add On Percentage": 2,
        
        "Proposer Full Name": "Proposer 1",
        "Proposer Salutation": "Mr.",
        "Proposer Date of Birth": "2003-12-17",
        "Proposer Gender": "Male",
        "Proposer Marital Status": "Married",
        "Proposer Mobile": "987654320",
        "Proposer Alternate Mobile": "876543210",
        "Proposer Email": "proposer1@example.com",
        "Proposer KYC ID": "KYCID001",
        "Proposer Occupation": "Self-Employed",
        "Proposer Nationality": "Indian",
        "Proposer Address": "1 Proposer Address Lane",
        
        "Nominee Name": "Nominee 1",
        "Nominee Salutation": "Ms.",
        "Nominee Relation": "Child",
        "Nominee Date of Birth": "2015-10-09",
        
        "Payment Mode": "Cheque",
        "Payment Reference": "PAYREF001",
        "Bank Name": "HDFC Bank",
        "Bank Account Number": "1234567890",
        "Bank IFSC Code": "HDFC0001234",
        "Bank Branch Name": "Main Branch",
      
        "Family Member 0 Full Name": "Member 1",
        "Family Member 0 Salutation": "Ms.",
        "Family Member 0 Relation": "Child",
        "Family Member 0 DOB": "2014-04-10",
        "Family Member 0 Gender": "Female",
        "Family Member 0 Medical Condition": true,
        "Family Member 0 Medical Remarks": "None",
      
        "Family Member 1 Full Name": "Member 3",
        "Family Member 1 Salutation": "Mr.",
        "Family Member 1 Relation": "Child",
        "Family Member 1 DOB": "2014-04-10",
        "Family Member 1 Gender": "Female",
        "Family Member 1 Medical Condition": true,
        "Family Member 1 Medical Remarks": "None"
      },
      {
        "Policy No.": "POL00215",
        "Company Name": "STAR HEALTH",
        "Policy Group": "Health Insurance",
        "Policy Type": "Individual",
        "Product Name": "COMPREHENSIVE",
        "Policy Salutation": "Ms.",
        "Sum Insured": 300000,
        "Start Date": "2024-03-01",
        "End Date": "2025-02-28",
        "Tenure Years": 1,
        "Premium Amount": 15000,
        "GST Status": "false",
        "Deductible Amount": 0,
        "Deductible Amount Status": false,
        "Medical Condition": false,
        "Policy Creation Status": "Fresh",
        "EMI Amount": 1500,
        "Commission Add On Percentage": 1.5,
        
        "Proposer Full Name": "Proposer 2",
        "Proposer Salutation": "Ms.",
        "Proposer Date of Birth": "1990-05-15",
        "Proposer Gender": "Female",
        "Proposer Marital Status": "Single",
        "Proposer Mobile": "987654321",
        "Proposer Alternate Mobile": "876543210",
        "Proposer Email": "proposer2@example.com",
        "Proposer KYC ID": "KYCID002",
        "Proposer Occupation": "Employee",
        "Proposer Nationality": "Indian",
        "Proposer Address": "2 Proposer Address Lane",
        
        "Nominee Name": "Nominee 2",
        "Nominee Salutation": "Mr.",
        "Nominee Relation": "Brother",
        "Nominee Date of Birth": "1985-08-20",
        
        "Payment Mode": "Online Transfer",
        "Payment Reference": "PAYREF002",
        "Bank Name": "ICICI Bank",
        "Bank Account Number": "0987654321",
        "Bank IFSC Code": "ICIC0000987",
        "Bank Branch Name": "Main Branch",
      
        "Family Member 0 Full Name": "Member 2",
        "Family Member 0 Salutation": "Ms.",
        "Family Member 0 Relation": "Self",
        "Family Member 0 DOB": "1990-05-15",
        "Family Member 0 Gender": "Female",
        "Family Member 0 Medical Condition": false,
        "Family Member 0 Medical Remarks": "None"
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    ws["!cols"] = Array(Object.keys(templateData[0]).length).fill({ wch: 24 });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "policy_import_template.xlsx");
  };

  // Export policies to Excel
  const handleExportPolicies = async () => {
    setExporting(true);
    try {
      const params: Record<string, string | number> = {
        limit: 10000, // Export all policies (adjust as needed)
        page: 1,
      };
      
      // Apply current filters
      if (debouncedSearch) params.search = debouncedSearch;
      if (policyGroupFilter && policyGroupFilter !== 'all') {
        params.policy_group_id = policyGroupFilter;
      }
      if (statusFilter !== "all") {
        params.policy_creation_status = statusFilter;
      }
      
      // Apply date filter based on policy start date
      const { from, to } = getDateRange();
      if (from) params.from = from.toISOString();
      if (to) params.to = to.toISOString();
      
      const token = localStorage.getItem("authToken");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${(import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '')}/api/v1/policies`, { params, headers });
      
      if (res.data && res.data.success && res.data.data) {
        const policiesToExport = res.data.data;
        
        // Format data for Excel export
        const exportData = policiesToExport.map((policy: Policy) => ({
          "Policy Number": policy.policy_number,
          "Customer Name": policy.customer_name,
          "Company": getCompanyName(policy.company),
          "Product Name": typeof policy.policyName === 'object' && policy.policyName?.name
            ? policy.policyName.name
            : typeof policy.policyName === 'string' && policy.policyName
            ? policy.policyName
            : 'N/A',
          "Policy Group": typeof policy.policyGroup === 'object' && policy.policyGroup?.name
            ? policy.policyGroup.name
            : typeof policy.policyGroup === 'string' && policy.policyGroup
            ? policy.policyGroup
            : 'N/A',
          "Start Date": formatDateForExport(policy.start_date),
          "End Date": formatDateForExport(policy.end_date),
          "Premium Amount": policy.premium_amount,
          "Commission Amount": policy.calculated_commission_amount || 0,
          "Policy Status": policy.policy_creation_status === 'Migration' ? 'Internal Portability' : (policy.policy_creation_status || "Fresh"),
          "Sum Insured": policy.sum_insured || 0,
          "Tenure Years": policy.tenure_years || 0,
          "EMI Amount": (policy as unknown as Record<string, unknown>).emi_amount as number || 0,
          "Deductible Amount": policy.deductible_amount || 0,
          "Medical Condition": policy.medical_condition ? "Yes" : "No",
          "Created At": formatDateForExport(policy.created_at),
          "Updated At": formatDateForExport(policy.updated_at)
        }));

        // Create Excel file
        const ws = XLSX.utils.json_to_sheet(exportData);
        
        // Set column widths
        ws["!cols"] = [
          { wch: 15 }, // Policy Number
          { wch: 20 }, // Customer Name
          { wch: 15 }, // Company
          { wch: 20 }, // Product Name
          { wch: 15 }, // Policy Group
          { wch: 12 }, // Start Date
          { wch: 12 }, // End Date
          { wch: 15 }, // Premium Amount
          { wch: 15 }, // Commission Amount
          { wch: 12 }, // Policy Status
          { wch: 12 }, // Sum Insured
          { wch: 10 }, // Tenure Years
          { wch: 12 }, // EMI Amount
          { wch: 15 }, // Deductible Amount
          { wch: 12 }, // Medical Condition
          { wch: 15 }, // Created At
          { wch: 15 }  // Updated At
        ];
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Policies");
        
        // Generate filename based on date filter
        let filename = "policies_export";
        if (dateFilter === "last_month") {
          filename += "_last_month";
        } else if (dateFilter === "3_months") {
          filename += "_last_3_months";
        } else if (dateFilter === "6_months") {
          filename += "_last_6_months";
        } else if (dateFilter === "custom" && from && to) {
          const fromStr = from.toISOString().split('T')[0];
          const toStr = to.toISOString().split('T')[0];
          filename += `_${fromStr}_to_${toStr}`;
        } else {
          filename += "_all_dates";
        }
        
        filename += `_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        XLSX.writeFile(wb, filename);
        toast.success(`Successfully exported ${policiesToExport.length} policies to Excel`);
      } else {
        toast.error("No policies found to export");
      }
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export policies. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteClick = (policy: Policy) => {
    setOpenDropdownId(null);
    setPolicyToDelete(policy);
    setDeleteDialogOpen(true);
  };


  const handleViewPolicy = (policy: Policy) => {
    if (onViewPolicy) {
      onViewPolicy(policy);
    } else {
      navigate(`/admin/policies/${policy.id}/view`);
    }
  };

  const handleEditPolicy = (policy: Policy) => {
    if (onEditPolicy) {
      onEditPolicy(policy);
    } else {
      navigate(`/admin/policies/${policy.id}/edit`);
    }
  };

  const handleClaimPolicy = (policy: Policy) => {
    setSelectedPolicyForClaim(policy);
    setShowClaimSheet(true);
  };

  // Policy transition handlers
  const handleRenewPolicy = (policy: Policy) => {
    setSelectedPolicyForTransition(policy);
    setTransitionType('RENEWAL');
    setShowTransitionModal(true);
  };

  const handleMigratePolicy = (policy: Policy) => {
    setSelectedPolicyForTransition(policy);
    setTransitionType('MIGRATION');
    setShowTransitionModal(true);
  };

  const handlePortPolicy = (policy: Policy) => {
    setSelectedPolicyForTransition(policy);
    setTransitionType('PORTABILITY');
    setShowTransitionModal(true);
  };

  const handleViewHistory = (policy: Policy) => {
    setSelectedPolicyForHistory(policy);
    setShowHistoryModal(true);
  };

  // Get linked policy numbers for display
  const getLinkedPolicyNumbers = (policy: Policy) => {
    const history = policyHistoryData[policy.id];
    if (!history || !history.completeHierarchy || history.completeHierarchy.length <= 1) {
      return null;
    }

    // Filter out the current policy and get other policy numbers
    const linkedPolicies = history.completeHierarchy
      .filter(item => item.relationship !== 'CURRENT')
      .map(item => item.policy.policy_number);

    return linkedPolicies.length > 0 ? linkedPolicies : null;
  };

  // Copy text to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Policy number copied to clipboard');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy policy number');
    }
  };

  const handleTransitionSuccess = (result: { message: string }) => {
    toast.success(result.message || `Policy ${transitionType.toLowerCase()} created successfully`);
    policiesQuery.refetch(); // Refresh the list
  };

  const handleConfirmDelete = async () => {
    if (!policyToDelete) return;
    setIsDeleting(true);
    console.log("Attempting to delete policy:", policyToDelete.id);
    
    try {
      if (onDeletePolicy) {
        await onDeletePolicy(policyToDelete.id);
      } else {
        const token = localStorage.getItem("authToken");
        await axios.delete(
          `${(import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '')}/api/v1/policies/${policyToDelete.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      toast.success("Policy deleted successfully");
      setDeleteDialogOpen(false);
      setPolicyToDelete(null);
      policiesQuery.refetch();
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 404) {
        toast.error("Policy no longer exists. Refreshing list...");
        policiesQuery.refetch();
        setDeleteDialogOpen(false);
        setPolicyToDelete(null);
      } else if (status === 500) {
        toast.error("Failed to delete policy. Please try again.");
      } else {
        toast.error("Failed to delete policy");
        setDeleteDialogOpen(false);
        setPolicyToDelete(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Pagination helpers
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Helper functions to safely extract nested data
  const getCompanyName = (company: Company | string | undefined): string => {
    if (!company) return 'N/A';
    if (typeof company === 'string') return company;
    if (company && typeof company === 'object' && company.name) return company.name;
    return 'N/A';
  };


  // const getPolicyGroupName = (type: string | PolicyType): string => {
  //   if (typeof type === 'string') {
  //     switch (type) {
  //       case 'HEALTH_INSURANCE': return 'Health';
  //       case 'MOTOR_INSURANCE': return 'Motor';
  //       case 'LIFE_INSURANCE': return 'Life';
  //       default: return type;
  //     }
  //   }
  //   if (type && typeof type === 'object' && type.name) {
  //     return type.name;
  //   }
  //   return 'N/A';
  // };

  return (
    <div>
        <>
          {/* Top Bar */}
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold hidden sm:block">Policies</h1>
            <div className="flex items-center gap-2 w-full justify-end">
              <Button
                onClick={() => policiesQuery.refetch()}
                variant="outline"
                className="bg-white border border-gray-200 hover:bg-gray-100"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4 text-gray-500" />
              </Button>
              <Button
                onClick={() => setImportDialogOpen(true)}
                className="bg-white border border-gray-200 hover:bg-gray-100 flex items-center"
                variant="outline"
              >
                <Upload className="w-4 h-4 text-green-500" />
                <span className="ml-2 hidden sm:inline">Import</span>
              </Button>
              <Button
                onClick={handleExportPolicies}
                disabled={exporting}
                className="bg-white border border-gray-200 hover:bg-gray-100 flex items-center disabled:opacity-50"
                variant="outline"
              >
                {exporting ? (
                  <>
                      <span className="animate-spin">...</span>
                    <span className="ml-2 hidden sm:inline">Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-blue-500" />
                    <span className="ml-2 hidden sm:inline">Export</span>
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  if (onCreatePolicy) {
                    onCreatePolicy();
                  } else {
                    navigate("/admin/policies/new");
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center "
              >
                <Plus className="w-4 h-4" /><span className="hidden sm:inline ml-0">New</span>
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by policy number, customer name, company, or mobile number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 rounded-lg"
              />
            </div>
            <Select
              value={policyGroupFilter}
              onValueChange={(v: string) => setPolicyGroupFilter(v)}
            >
              <SelectTrigger className="w-full sm:w-[140px] bg-white border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 rounded-lg">
                <SelectValue placeholder="Policy Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {policyGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v: PolicyStatus) => setStatusFilter(v)}
            >
              <SelectTrigger className="w-full sm:w-[140px] bg-white border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Fresh">Fresh</SelectItem>
                <SelectItem value="Migration">Internal Portability</SelectItem>
                <SelectItem value="Renewal">Renewal</SelectItem>
                <SelectItem value="Portablity">Portablity</SelectItem>
              </SelectContent>
            </Select>
            {/* Date Filter Dropdown */}
            <div className={`w-full relative transition-all duration-200 ${dateFilter === "custom" && customDateRange.from && customDateRange.to ? 'sm:w-[160px]' : 'sm:w-[110px]'}`}>
              {dateFilter === "custom" ? (
                <Popover open={showCustomDatePicker} onOpenChange={(open) => {
                  setShowCustomDatePicker(open);
                  if (!open && (!customDateRange.from || !customDateRange.to)) {
                    setDateFilter("all");
                  }
                }}>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
                      className="w-full justify-between bg-gray-50 border border-gray-200 hover:bg-gray-100"
                      onClick={() => setShowCustomDatePicker(!showCustomDatePicker)}
                    >
                      <span className={`font-medium truncate transition-all duration-200 ${customDateRange.from && customDateRange.to ? 'text-xs max-w-[140px]' : 'text-sm max-w-[80px]'}`}>
                        {customDateRange.from && customDateRange.to
                          ? `${customDateRange.from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${customDateRange.to.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                          : "Custom"
                        }
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>
    </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50 border border-gray-200 shadow-xl rounded-xl bg-white" align="start">
                    <div>
              <Calendar
          mode="range"
          selected={customDateRange}
          onSelect={(range: { from: Date | null; to: Date | null } | null) => {
                          const newRange = {
              from: range?.from ?? null,
              to: range?.to ?? null
                          };
                          setCustomDateRange(newRange);
                          if (newRange.from && newRange.to) {
                            setShowCustomDatePicker(false);
                          }
                        }}
                      />
                    </div>
    </PopoverContent>
  </Popover>
              ) : (
                <Select
                  value={dateFilter}
                  onValueChange={(value: string) => {
                    setDateFilter(value);
                    if (value === "custom") {
                      setShowCustomDatePicker(true);
                    } else {
                      setShowCustomDatePicker(false);
                      setCustomDateRange({ from: null, to: null });
                    }
                  }}
                >
                  <SelectTrigger className="w-full bg-gray-50 border border-gray-200">
                    <SelectValue placeholder="Date Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="last_month">Last Month</SelectItem>
                    <SelectItem value="3_months">Last 3 Months</SelectItem>
                    <SelectItem value="6_months">Last 6 Months</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              )}
</div>
            {(searchTerm || policyGroupFilter !== "all" || statusFilter !== "all" || dateFilter !== "all" || (customDateRange.from && customDateRange.to)) && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("");
                        setPolicyGroupFilter("all");
                        setStatusFilter("all");
                        setDateFilter("all");
                        setCustomDateRange({ from: null, to: null });
                        setShowCustomDatePicker(false);
                        setCurrentPage(1);
                      }}
                      className="bg-white border border-gray-200 hover:bg-gray-100"
                    >
                      <FilterXIcon />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Clear filters
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Optimized Table with Dropdown Actions */}
          <div className="mt-6">
            <div className="rounded-xl border border-gray-200 bg-white shadow-lg shadow-gray-200/50 overflow-hidden">
              <Table className="w-full table-fixed">
                <TableHeader>
                  <TableRow className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100/50">
                    <TableHead className="h-12 px-4 text-left font-bold text-gray-800 text-xs uppercase tracking-wide w-[12%]">
                      Policy No.
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left font-bold text-gray-800 text-xs uppercase tracking-wide w-[10%]">
                      Policy History
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left font-bold text-gray-800 text-xs uppercase tracking-wide w-[14%]">
                      Customer Details
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left font-bold text-gray-800 text-xs uppercase tracking-wide w-[14%]">
                      Company & Product
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left font-bold text-gray-800 text-xs uppercase tracking-wide w-[9%]">
                      Policy Group
                    </TableHead>
                    <TableHead className="h-12 px-4 text-center font-bold text-gray-800 text-xs uppercase tracking-wide w-[9%]">
                      Premium
                    </TableHead>
                    {role?.role_name === 'ADMIN' && (
                      <TableHead className="h-12 px-4 text-left font-bold text-gray-800 text-xs uppercase tracking-wide w-[9%]">
                        Commission
                      </TableHead>
                    )}
                    <TableHead className="h-12 px-4 text-left font-bold text-gray-800 text-xs uppercase tracking-wide w-[8%]">
                      Period
                    </TableHead>
                    <TableHead className="h-12 px-4 text-center font-bold text-gray-800 text-xs uppercase tracking-wide w-[6%]">
                      Status
                    </TableHead>
                    <TableHead className="h-12 px-4 text-center font-bold text-gray-800 text-xs uppercase tracking-wide w-[10%]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-32 text-center">
                        <div className="flex items-center justify-center">
                          <div className="text-gray-500 font-medium">Loading...</div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : customerLatestPolicies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-32 text-center">
                        <div className="flex items-center justify-center">
                          <div className="text-gray-500 font-medium">No policies found.</div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    customerLatestPolicies.map((group, index) => (
                      <TableRow
                        key={group.customerName}
                        className={`border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/30 transition-all duration-200 cursor-pointer transform hover:scale-[1.01] ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                        }`}
                        onClick={() => handleViewPolicy(group.latestPolicy)}
                        onMouseEnter={() => prefetchPolicy(group.latestPolicy.id)}
                      >

                        {/* Policy Number */}
                        <TableCell className="h-14 px-4 align-middle">
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-blue-600 block truncate hover:text-blue-700 transition-colors">
                              {group.latestPolicy.policy_number}
                            </span>
                          </div>
                        </TableCell>

                        {/* Policy History */}
                        <TableCell 
                          className="h-14 px-1 align-middle cursor-pointer hover:bg-blue-50/50 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewHistory(group.latestPolicy);
                          }}
                        >
                          <div className="space-y-1">
                            {loadingHistory[group.latestPolicy.id] ? (
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-xs text-gray-500">Loading...</span>
                              </div>
                            ) : (
                              (() => {
                                const linkedPolicies = getLinkedPolicyNumbers(group.latestPolicy);
                                if (!linkedPolicies || linkedPolicies.length === 0) {
                                  return (
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-gray-400 hover:text-gray-500">No linked policies</span>
                                    </div>
                                  );
                                }
                                
                                return (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex items-center gap-1 cursor-pointer hover:bg-blue-50 rounded py-1 transition-colors">
                                          <Link className="w-3 h-3 text-blue-500" />
                                          <span className="text-xs font-medium text-blue-700 hover:text-blue-800">
                                            {linkedPolicies.length} linked
                                          </span>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        <div className="space-y-2">
                                          <p className="text-xs font-medium text-gray-700">Linked Policy Numbers:</p>
                                          <div className="space-y-1">
                                            {linkedPolicies.map((policyNumber, index) => (
                                              <div
                                                key={index}
                                                className="group flex items-center justify-between gap-2 p-1 hover:bg-blue-50 rounded cursor-pointer transition-colors"
                                            onClick={(e) => {
                                                  e.stopPropagation();
                                                  copyToClipboard(policyNumber);
                                                }}
                                              >
                                                <span className="text-xs text-blue-800 font-medium">
                                                  {policyNumber}
                                                </span>
                                                <Copy className="w-3 h-3 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                );
                              })()
                            )}
                          </div>
                        </TableCell>

                        {/* Customer Details */}
                        <TableCell className="h-14 px-3 align-middle">
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-900 truncate">
                              {group.customerName}
                            </p>
                            {/* <p className="text-xs text-gray-600 truncate">
                              {group.latestPolicy.proposer?.mobile || 'No mobile'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {group.latestPolicy.proposer?.email || 'No email'}
                            </p> */}
                          </div>
                        </TableCell>

                        {/* Company & Product */}
                        <TableCell className="h-14 px-3 align-middle">
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-900 truncate">
                              {getCompanyName(group.latestPolicy.company)}
                            </p>
                            <p className="text-xs text-gray-600 truncate">
                              {/* Show policy_name as product */}
                              {typeof group.latestPolicy.policyName === 'object' && group.latestPolicy.policyName?.name
                                ? group.latestPolicy.policyName.name
                                : typeof group.latestPolicy.policyName === 'string' && group.latestPolicy.policyName
                                ? group.latestPolicy.policyName
                                : 'No product'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="h-14 px-3 align-middle ">
                          <div className="space-y-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <p className="text-xs font-medium text-gray-900 truncate ">
                                    {/* Show policy_name as product */}
                                    {typeof group.latestPolicy.policyGroup === 'object' && group.latestPolicy.policyGroup?.name
                                      ? group.latestPolicy.policyGroup.name
                                      : typeof group.latestPolicy.policyGroup === 'string' && group.latestPolicy.policyGroup
                                      ? group.latestPolicy.policyGroup
                                      : 'No policy group'}
                                  </p>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {typeof group.latestPolicy.policyGroup === 'object' && group.latestPolicy.policyGroup?.name
                                      ? group.latestPolicy.policyGroup.name
                                      : typeof group.latestPolicy.policyGroup === 'string' && group.latestPolicy.policyGroup
                                      ? group.latestPolicy.policyGroup
                                      : 'No policy group'}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>

                        {/* Type */}
                        {/* <TableCell className="h-14 px-3 align-middle text-center">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {getPolicyTypeName(group.latestPolicy.type)}
                          </span>
                        </TableCell> */}

                        {/* Premium */}
                        <TableCell className="h-14 px-3 align-middle text-center">
                          <span className="text-xs font-semibold text-gray-900">
                            {formatCurrency(group.latestPolicy.premium_amount)}
                          </span>
                        </TableCell>
                        {/* Commission - admin only */}
                        {role?.role_name === 'ADMIN' && (
                          <TableCell className="h-14 px-3 align-middle text-center">
                            <span className="text-xs font-semibold text-green-700">
                              {group.latestPolicy.calculated_commission_amount !== undefined && group.latestPolicy.calculated_commission_amount !== null ? formatCurrency(group.latestPolicy.calculated_commission_amount) : '-'}
                            </span>
                          </TableCell>
                        )}

                        {/* Period */}
                        <TableCell className="h-14 px-3 align-middle text-left">
                          <div className="space-y-1">
                            <p className="text-xs text-gray-700">
                              {formatDate(group.latestPolicy.start_date)}
                            </p>
                            <p className="text-xs text-gray-500">
                              to {formatDate(group.latestPolicy.end_date)}
                            </p>
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell className="h-14 px-3 align-middle text-center">
                          <StatusBadge status={group.latestPolicy.policy_creation_status || "Fresh"} />
                        </TableCell>

                        {/* Actions - Three Dot Menu */}
                        <TableCell className="h-14 px-3 align-middle" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center">
                            <DropdownMenu open={openDropdownId === group.latestPolicy.id} onOpenChange={(open) => setOpenDropdownId(open ? group.latestPolicy.id : null)}>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-6 p-0 text-gray-500 rounded hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical size={16} />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent 
                                className="w-27 bg-white border border-gray-200 shadow-lg rounded-md"
                                align="end"
                                side="bottom"
                                sideOffset={4}
                              >
                                {/* <DropdownMenuItem
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewPolicy(group.latestPolicy);
                                  }}
                                >
                                  <Eye size={14} />
                                  View
                                </DropdownMenuItem> */}
                                <DropdownMenuItem
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDropdownId(null);
                                    handleEditPolicy(group.latestPolicy);
                                  }}
                                >
                                  <Pencil size={14} />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDropdownId(null);
                                    handleClaimPolicy(group.latestPolicy);
                                  }}
                                >
                                  <FileText size={14} />
                                  Claim
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator className="my-0 border-gray-200" />
                                
                                {/* Policy Transition Actions */}
                                <DropdownMenuItem
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDropdownId(null);
                                    handleRenewPolicy(group.latestPolicy);
                                  }}
                                >
                                  <RefreshCw size={14} />
                                  Renew
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDropdownId(null);
                                    handleMigratePolicy(group.latestPolicy);
                                  }}
                                >
                                  <Building2 size={14} />
                                  Internal Portability
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDropdownId(null);
                                    handlePortPolicy(group.latestPolicy);
                                  }}
                                >
                                  <ArrowRight size={14} />
                                  Port
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator className="my-0 border-gray-200" />
                                
                                {/* Policy History Action */}
                                <DropdownMenuItem
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDropdownId(null);
                                    handleViewHistory(group.latestPolicy);
                                  }}
                                >
                                  <History size={14} />
                                  History
                                </DropdownMenuItem>

                                <DropdownMenuSeparator className="my-0 border-gray-200" />
                                {role?.role_name === 'ADMIN' && (
                                  <DropdownMenuItem
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenDropdownId(null);
                                      handleDeleteClick(group.latestPolicy);
                                    }}
                                  >
                                    <Trash2 size={14} />
                                    Delete Policy
                                  </DropdownMenuItem>
                                )}

                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination - hidden for infinite scroll */}
          {false && totalPolicies > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 px-4 py-4 bg-gray-50/50 border-t border-gray-200 gap-4 sm:gap-0">
              <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-start">
                <span className="text-sm font-medium text-gray-700">Rows per page:</span>
                <Select
                  value={policiesPerPage.toString()}
                  onValueChange={(value) => {
                    setPoliciesPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-20 h-9 border-gray-300 bg-white text-sm font-medium">
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
              <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                <span className="text-sm font-medium text-gray-700">
                  Page {currentPage} of {totalPages || 1}
                </span>
                <span className="text-xs text-gray-500">
                  ({totalPolicies} total policies)
                </span>
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-auto justify-center sm:justify-end">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(1)}
                  className="h-9 w-9 border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  title="First page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="h-9 w-9 border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  title="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage >= totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="h-9 w-9 border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  title="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage >= totalPages}
                  onClick={() => handlePageChange(totalPages)}
                  className="h-9 w-9 border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  title="Last page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Delete Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent className="sm:max-w-[425px] bg-white">
              <DialogHeader>
                <DialogTitle className="text-left">Confirm Deletion</DialogTitle>
                <DialogDescription>
                  Please confirm that you want to delete this policy. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <span className="text-red-500 font-extrabold">* </span>
                Are you sure you want to delete this policy? This action cannot be undone.
                {policyToDelete && (
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <p className="text-sm font-medium text-gray-800">
                      Policy: {policyToDelete.policy_number}
                    </p>
                    <p className="text-sm text-gray-600">
                      Customer: {policyToDelete.customer_name}
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmDelete}
                  className="bg-red-600 hover:bg-red-700 text-white relative"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">...</span>
                      Deleting...
                    </span>
                  ) : (
                    "Delete"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Import Dialog */}
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogContent className="w-[95vw] max-w-2xl mx-auto bg-white border border-gray-100 rounded-lg">
              <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
                <DialogTitle className="flex items-center gap-2 text-gray-800 text-lg sm:text-xl">
                  <span className="truncate">Import Policies (CSV/XLSX)</span>
                </DialogTitle>
                <DialogDescription>
                  Upload a CSV or XLSX file to import policies in bulk.
                </DialogDescription>
              </DialogHeader>
              
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
                <div
                  {...dragHandlers}
                  className={`
                    relative border-2 border-dashed rounded-lg p-4 sm:p-6 md:p-8 text-center transition-all duration-200 cursor-pointer min-h-[120px] sm:min-h-[140px] flex items-center justify-center
                    ${isDragOver 
                      ? 'border-blue-400 bg-blue-50' 
                      : selectedFile 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                    }
                  `}
                  onClick={!selectedFile ? handleBrowseClick : undefined}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    name="file"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    className="hidden"
                    onChange={handleFileInputChange}
                    required
                  />
                  
                  {selectedFile ? (
                    // Selected File Display
                    <div className="w-full max-w-sm mx-auto">
                      <div className="flex items-center gap-3 bg-white rounded-lg px-3 sm:px-4 py-3 border border-green-200 shadow-sm">
                        <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 flex-shrink-0" />
                        <div className="text-left flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate text-sm sm:text-base">
                            {selectedFile.name}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500">
                            {formatFileSize(selectedFile.size)}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile();
                          }}
                          className="p-1 hover:bg-red-100 rounded-full transition-colors flex-shrink-0"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Drop Zone Display
                    <div className="space-y-3 sm:space-y-4 w-full">
                      <div className="flex justify-center">
                        <Upload className={`w-8 h-8 sm:w-12 sm:h-12 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                      </div>
                      <div className="space-y-2">
                        <p className={`text-base sm:text-lg font-medium ${isDragOver ? 'text-blue-700' : 'text-gray-700'}`}>
                          {isDragOver ? 'Drop your file here' : 'Drag and drop your file here'}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          or{' '}
                          <span className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer">
                            browse to choose a file
                          </span>
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          Supports CSV and Excel files (.csv, .xlsx, .xls)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex items-center justify-center gap-2 bg-white border border-gray-200 py-2 sm:py-2.5 text-sm sm:text-base"
                    onClick={handleDownloadTemplate}
                  >
                    <Download className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Download Template</span>
                  </Button>
                  
                  <form onSubmit={handleImportSubmit} className="flex-1">
                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed py-2 sm:py-2.5 text-sm sm:text-base"
                      disabled={importing || !selectedFile}
                    >
                      {importing ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span className="truncate">Importing...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Upload className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">Import Policies</span>
                        </div>
                      )}
                    </Button>
                  </form>
                </div>

                {/* Import Results */}
                {importResult && (
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                      <span className="text-green-700 font-medium text-sm sm:text-base">
                        Successfully imported {importResult.created?.length || 0} of {importResult.total} policies
                      </span>
                    </div>
                    
                    {importResult.failed?.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                          <span className="text-red-700 font-medium text-xs sm:text-sm">
                            Failed to import {importResult.failed.length} rows:
                          </span>
                        </div>
                        <div className="max-h-24 sm:max-h-32 overflow-y-auto">
                          <ul className="space-y-1">
                            {importResult.failed.map((fail, idx) => (
                              <li key={idx} className="text-xs text-red-600 bg-white rounded px-2 py-1 break-words">
                                <span className="font-medium">Row {fail.row}:</span>{' '}
                                {Array.isArray(fail.errors) 
                                  ? (fail.errors as { message: string }[]).map((e) => e.message).join(", ") 
                                  : String(fail.errors)
                                }
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Claim Sheet */}
          {selectedPolicyForClaim && (
            <ClaimSheet
              policyId={selectedPolicyForClaim.id}
              insuredMembers={
                selectedPolicyForClaim.members || 
                []
              }
              onClose={() => {
                setShowClaimSheet(false);
                setSelectedPolicyForClaim(null);
              }}
              open={showClaimSheet}
            />
          )}

          {/* Policy Transition Sheet */}
          <PolicyTransitionSheet
            open={showTransitionModal}
            onClose={() => {
              setShowTransitionModal(false);
              setSelectedPolicyForTransition(null);
            }}
            policy={selectedPolicyForTransition}
            transitionType={transitionType}
            onSuccess={handleTransitionSuccess}
          />

          {/* Policy History Sheet */}
          <PolicyHistorySheet
            open={showHistoryModal}
            onClose={() => {
              setShowHistoryModal(false);
              setSelectedPolicyForHistory(null);
            }}
            policy={selectedPolicyForHistory}
          />
        </>
      </div>
    );
  };
  
  export default PolicyList;
