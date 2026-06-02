import React, { useEffect, useState, useCallback } from "react";
import {
  getAllCommissionRules,
  createCommissionRule,
  updateCommissionRule,
  deleteCommissionRule,
  updateCommissionRuleStatus,
  searchCommissionRules,
  type CommissionRuleSearchParams,
  updateCommissionRulesStatusByPolicy,
} from "../../services/commissionRule.service";
import {
  getAllPolicyNames,
  PolicyName,
} from "../../services/policyName.service";
import type { CommissionRule } from "../../types/index";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import {
  Trash2,
  Edit,
  Save,
  X,
  // Filter,
  Plus,
  Search,
  Check,
  ChevronDown,
  Copy,
  Loader2,
  // FilterIcon,
  FilterXIcon,
} from "lucide-react";
import { Switch } from "../ui/switch";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

const POLICY_CREATION_STATUS_OPTIONS = [
  { value: "Fresh", label: "Fresh" },
  { value: "Renewal", label: "Renewal" },
  { value: "Migration", label: "Internal Portability" },
  { value: "Portablity", label: "Portablity" },
];
const DEDUCTIBLE_TYPE_OPTIONS = [
  { value: "ALL_SI", label: "All SI" },
  { value: "DEDUCTABLE_ALL_SI", label: "Deductable All SI" },
  { value: "LESS_THAN_10_LAKHS", label: "Less than 10 Lakhs" },
  { value: "GREATER_EQUAL_10_LAKHS", label: "Greater or Equal 10 Lakhs" },
];
const AGE_CONDITION_OPTIONS = [
  { value: "LESS_THAN_60", label: "Less than 60" },
  { value: "GREATER_THAN_60", label: "Greater than 60" },
];

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

const CommissionRulePage: React.FC = () => {
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>([]);
  const [policyNames, setPolicyNames] = useState<PolicyName[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRule, setEditRule] = useState<CommissionRule | null>(null);
  const [form, setForm] = useState<Partial<CommissionRule>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<CommissionRule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    product: "all",
    status: "all",
    search: "",
  });
  const [expandedPolicies, setExpandedPolicies] = useState<Set<string>>(
    new Set()
  );
  // --- Copy/Paste state ---

  // Backend pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Product search states
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [selectedProductName, setSelectedProductName] = useState("");

  // --- New: Product filter search states for filter bar ---
  const [productFilterSearchTerm, setProductFilterSearchTerm] = useState("");
  const [showProductFilterDropdown, setShowProductFilterDropdown] = useState(false);

  // Debouncing for search
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  // Ref to trigger instant debounce update
  const instantUpdateRef = React.useRef(false);

  // Debounce effect for search
  useEffect(() => {
    if (instantUpdateRef.current) {
      setDebouncedFilters(filters);
      instantUpdateRef.current = false;
    } else {
      const timer = setTimeout(() => {
        setDebouncedFilters(filters);
      }, 1000); // 1 second delay
      return () => clearTimeout(timer);
    }
  }, [filters]);

  // Add tab state for active/inactive
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>("active");

  // Bulk selection state
  const [selectedPolicies, setSelectedPolicies] = useState<Set<string>>(new Set());

  // Bulk action modal state
  const [bulkActionModalOpen, setBulkActionModalOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'activate' | 'deactivate' | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Individual policy select handler
//   const handlePolicySelection = (policyId: string, checked: boolean) => {
//     setSelectedPolicies(prev => {
//       const next = new Set(prev);
//       if (checked) next.add(policyId);
//       else next.delete(policyId);
//       return next;
//     });
//   };

  // Handle bulk action button click
  const handleBulkActionClick = (type: 'activate' | 'deactivate') => {
    setBulkActionType(type);
    setBulkActionModalOpen(true);
  };

  // Handle bulk action confirm
  const handleBulkActionConfirm = async () => {
    if (!bulkActionType) return;
    setBulkLoading(true);
    try {
      const promises = Array.from(selectedPolicies).map(policyId =>
        updateCommissionRulesStatusByPolicy(policyId, bulkActionType === 'activate')
      );
      await Promise.all(promises);
      toast.success(`All selected policies ${bulkActionType === 'activate' ? 'activated' : 'deactivated'} successfully!`);
      setBulkActionModalOpen(false);
      setSelectedPolicies(new Set());
      fetchData();
    } catch {
      toast.error('Failed to update some or all selected policies.');
    } finally {
      setBulkLoading(false);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Check if we have search filters
      const hasSearchFilters =
        debouncedFilters.search ||
        debouncedFilters.status !== "all" ||
        debouncedFilters.product !== "all";

      // Add isActive filter for tab
      const isActive = activeTab === 'active';

      if (hasSearchFilters) {
        // Use backend search only when there are actual search filters
        const searchParams: CommissionRuleSearchParams = {
          page: 1, // Always get all results for frontend pagination
          limit: 1000, // Get a large number to ensure we get all results
          // Add isActive to params
          isActive,
        };

        if (debouncedFilters.search)
          searchParams.search = debouncedFilters.search;
        if (debouncedFilters.status !== "all")
          searchParams.policyStatus = debouncedFilters.status;

        const result = await searchCommissionRules(searchParams);

        // Set the commission rules from search results
        setCommissionRules(result.data);
      } else {
        // Always get all rules for frontend pagination based on policy names
        const rules = await getAllCommissionRules();
        if (Array.isArray(rules)) {
          setCommissionRules(rules);
        } else {
          // Handle paginated response
          setCommissionRules(rules.data);
        }
      }

      // Always fetch policy names
      const names = await getAllPolicyNames();
      setPolicyNames(names);
    } catch {
      toast.error("Failed to fetch commission rules or policy names");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedFilters, activeTab]);

  // Use debounced filters for data fetching
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedFilters, activeTab]);

  // Filter products based on search term
  const filteredProducts = policyNames.filter((policy) =>
    policy.name.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  // --- New: Filter products for filter bar ---
  const filteredProductFilterOptions = policyNames.filter((policy) =>
    policy.name.toLowerCase().includes(productFilterSearchTerm.toLowerCase())
  );

  // Update selected product name when form changes
  useEffect(() => {
    const selectedPolicy = policyNames.find(
      (p) => p.id === form.policy_name_id
    );
    if (selectedPolicy) {
      setSelectedProductName(selectedPolicy.name);
      setProductSearchTerm(selectedPolicy.name);
    } else {
      setSelectedProductName("");
      setProductSearchTerm("");
    }
  }, [form.policy_name_id, policyNames]);

  // --- New: Update selected product filter name when filter changes ---
  useEffect(() => {
    if (filters.product === "all") {
      setProductFilterSearchTerm("");
    } else {
      setProductFilterSearchTerm(filters.product);
    }
  }, [filters.product]);

  // Filter rules by activeTab
  const filteredCommissionRules = React.useMemo(() => {
    return commissionRules.filter(rule =>
      activeTab === 'active' ? rule.is_active : !rule.is_active
    );
  }, [commissionRules, activeTab]);

  // Group filtered rules by policy name (filtered)
  const groupedRules = React.useMemo(() => {
    const grouped: Record<string, CommissionRule[]> = {};
    // Get unique policy IDs from filtered commission rules
    const policyIds = [
      ...new Set(filteredCommissionRules.map((rule) => rule.policy_name_id)),
    ];
    // Find policy names for these IDs
    const relevantPolicies = policyNames.filter((policy) =>
      policyIds.includes(policy.id)
    );
    relevantPolicies.forEach((policy) => {
      grouped[policy.id] = filteredCommissionRules.filter(
        (rule) => rule.policy_name_id === policy.id
      );
    });
    return grouped;
  }, [filteredCommissionRules, policyNames]);

  // Get policies that have rules and paginate them (filtered)
  const policiesWithRules = React.useMemo(() => {
    let filtered = policyNames.filter((policy) => groupedRules[policy.id]?.length > 0);
    if (filters.product !== "all") {
      filtered = filtered.filter((policy) => policy.name === filters.product);
    }
    return filtered;
  }, [policyNames, groupedRules, filters.product]);

  // Update total items based on policy names count
  React.useEffect(() => {
    setTotalItems(policiesWithRules.length);
  }, [policiesWithRules]);

  // Paginate the policies that have rules
  const paginatedPolicies = React.useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return policiesWithRules.slice(startIndex, endIndex);
  }, [policiesWithRules, currentPage, rowsPerPage]);

  // Calculate total pages for policies
  const totalPolicyPages = React.useMemo(() => {
    return Math.ceil(policiesWithRules.length / rowsPerPage);
  }, [policiesWithRules, rowsPerPage]);

  const togglePolicyExpansion = (policyId: string) => {
    const newExpanded = new Set(expandedPolicies);
    if (newExpanded.has(policyId)) {
      newExpanded.delete(policyId);
    } else {
      newExpanded.add(policyId);
    }
    setExpandedPolicies(newExpanded);
  };

  // CRUD Handlers
  const handleCreate = () => {
    setEditRule(null);
    setForm({});
    setError(null);
    setProductSearchTerm("");
    setSelectedProductName("");
    setShowProductDropdown(false);
    setModalOpen(true);
  };

  const handleEdit = (rule: CommissionRule) => {
    setEditRule(rule);
    setForm(rule);
    setError(null);
    const selectedPolicy = policyNames.find(
      (p) => p.id === rule.policy_name_id
    );
    if (selectedPolicy) {
      setSelectedProductName(selectedPolicy.name);
      setProductSearchTerm(selectedPolicy.name);
    }
    setShowProductDropdown(false);
    setModalOpen(true);
  };

  const handleDelete = (rule: CommissionRule) => {
    setRuleToDelete(rule);
    setDeleteDialogOpen(true);
    setError(null);
  };

  const confirmDelete = async () => {
    if (!ruleToDelete) return;
    try {
      await deleteCommissionRule(ruleToDelete.id);
      toast.success("Commission rule deleted successfully.");
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
      fetchData();
    } catch {
      toast.error("Failed to delete commission rule.");
    }
  };

  const handleModalSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    try {
      if (
        !form.policy_name_id ||
        !form.policyStatus ||
        !form.deductibleType ||
        !form.ageCondition ||
        form.commissionPercent === undefined
      ) {
        setError("All fields are required.");
        return;
      }
      if (editRule) {
        await updateCommissionRule(editRule.id, form);
        toast.success("Commission rule updated successfully.");
      } else {
        await createCommissionRule(
          form as Omit<CommissionRule, "id" | "createdAt" | "updatedAt">
        );
        toast.success("Commission rule created successfully.");
      }
      setModalOpen(false);
      fetchData();
    } catch {
      toast.error("Failed to save Duplicate commission rule.");
    }
  };

  // Product selection handlers
  const handleProductSelect = (policy: PolicyName) => {
    setForm((f) => ({ ...f, policy_name_id: policy.id }));
    setSelectedProductName(policy.name);
    setProductSearchTerm(policy.name);
    setShowProductDropdown(false);
  };

  const handleProductSearchChange = (value: string) => {
    setProductSearchTerm(value);
    setShowProductDropdown(true);
    // If the search term exactly matches a product name, select it
    const exactMatch = policyNames.find(
      (p) => p.name.toLowerCase() === value.toLowerCase()
    );
    if (exactMatch) {
      setForm((f) => ({ ...f, policy_name_id: exactMatch.id }));
      setSelectedProductName(exactMatch.name);
    } else if (value === "") {
      setForm((f) => ({ ...f, policy_name_id: undefined }));
      setSelectedProductName("");
    }
  };

  // Inline edit
//   const handleInlineEdit = (rule: CommissionRule) => {
//     setEditingId(rule.id);
//     setEditValue(rule.commissionPercent);
//   };

  const handleInlineSave = async () => {
    if (editingId) {
      try {
        await updateCommissionRule(editingId, { commissionPercent: editValue });
        toast.success("Commission rate updated successfully.");
        setEditingId(null);
        fetchData();
      } catch {
        toast.error("Failed to update commission.");
      }
    }
  };

  const handleInlineCancel = () => {
    setEditingId(null);
    setEditValue(0);
  };

  const handleStatusToggle = async (rule: CommissionRule) => {
    try {
      await updateCommissionRuleStatus(rule.id, !rule.is_active);
      // Update only the toggled rule in the local state
      setCommissionRules(prevRules =>
        prevRules.map(r =>
          r.id === rule.id ? { ...r, is_active: !r.is_active } : r
        )
      );
      // Show message based on the action performed (opposite of original state)
      const action = rule.is_active ? 'deactivated' : 'activated';
      toast.success(`Commission rule ${action} successfully`);
    } catch (error) {
      console.error('Error updating commission rule status:', error);
      toast.error('Failed to update commission rule status');
    }
  };

  // Export CSV
  //   const exportData = () => {
  //     const csvRows: string[][] = [
  //       ['Product Name', 'Policy Status', 'Deductible Type', 'Age Condition', 'Commission %'],
  //     ];
  //     paginatedPolicyNames.forEach(policy => {
  //       const rulesForPolicy = commissionRules.filter(rule => rule.policy_name_id === policy.id);
  //       rulesForPolicy.forEach(rule => {
  //         csvRows.push([
  //           policy.name,
  //           rule.policyStatus,
  //           rule.deductibleType,
  //           rule.ageCondition,
  //           rule.commissionPercent.toString(),
  //         ]);
  //       });
  //     });
  //     const csvContent = csvRows.map(row => row.join(",")).join("\n");
  //     const blob = new Blob([csvContent], { type: 'text/csv' });
  //     const url = window.URL.createObjectURL(blob);
  //     const a = document.createElement('a');
  //     a.href = url;
  //     a.download = 'commission-rules.csv';
  //     a.click();
  //     window.URL.revokeObjectURL(url);
  //     toast.success('Commission rules exported to CSV successfully.');
  //   };

  // Table badge helpers
  const getStatusBadgeVariant = (status: string) =>
    status === "Fresh" ? "default" : "secondary";
  const getDeductibleColor = (deductible: string) => {
    if (deductible.includes("ALL_SI")) return "text-blue-600";
    if (deductible.includes("LESS_THAN")) return "text-blue-600";
    if (deductible.includes("GREATER")) return "text-blue-600";
    return "text-gray-600";
  };
  const getAgeConditionColor = (ageCondition: string) => {
    return ageCondition.includes("LESS_THAN")
      ? "text-blue-600"
      : "text-blue-600";
  };

  // Add this helper inside CommissionRulePage
  const getAllRulesActive = (policyId: string) => {
    const rules = groupedRules[policyId] || [];
    return rules.length > 0 && rules.every(rule => rule.is_active);
  };

  const handleBulkToggle = async (policyId: string) => {
    const currentState = getAllRulesActive(policyId);
    const newState = !currentState;
    try {
      await updateCommissionRulesStatusByPolicy(policyId, newState);
      // Update all rules for this policyId in the local state
      setCommissionRules(prevRules =>
        prevRules.map(rule =>
          rule.policy_name_id === policyId ? { ...rule, is_active: newState } : rule
        )
      );
      toast.success(`All rules ${newState ? 'activated' : 'deactivated'} successfully for this product`);
    } catch {
      toast.error('Failed to update rules status');
    }
  };

  // Copy rule handler
  const handleCopyRule = (rule: CommissionRule) => {
    // Remove id, createdAt, updatedAt to ensure it's treated as a new rule
    const rest = Object.fromEntries(
      Object.entries(rule).filter(
        ([key]) => !["id", "createdAt", "updatedAt"].includes(key)
      )
    );
    setEditRule(null); // Ensure modal is in create mode
    setForm({ ...rest });
    setError(null);
    // Set product name for modal
    const selectedPolicy = policyNames.find((p) => p.id === rule.policy_name_id);
    if (selectedPolicy) {
      setSelectedProductName(selectedPolicy.name);
      setProductSearchTerm(selectedPolicy.name);
    }
    setShowProductDropdown(false);
    setModalOpen(true);
    toast.success("Rule copied! You can now edit and save as a new rule.");
  };

  // Tab counts
  const activeRulesCount = commissionRules.filter(r => r.is_active).length;
  const inactiveRulesCount = commissionRules.filter(r => !r.is_active).length;

  return (
    <div className="p-2 ">

      <div className="flex justify-between items-center ">
        <h1 className="text-2xl font-bold text-gray-800 mb-3">Commission Rules</h1>
      </div>
            {/* Tab Navigation */}
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'active' | 'inactive')} className="w-[350px] max-w-md mb-4">
                <TabsList className="bg-gray-100 p-1 rounded-md w-full">
                <TabsTrigger
                    value="active"
                    className="flex-1 px-3 py-1.5 rounded-md text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-black cursor-pointer"
                    >
                    Active ({activeRulesCount})
                    </TabsTrigger>
                    <TabsTrigger
                    value="inactive"
                    className="flex-1 px-3 py-1.5 rounded-md text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-black cursor-pointer"
                    >
                    Inactive ({inactiveRulesCount})
                    </TabsTrigger>
                </TabsList>
            </Tabs>


      {/* Filters */}
      <div className="mb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full">
          {/* Filters Section */}
          <div className="flex flex-wrap gap-4 flex-1 min-w-0">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[150px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search rules..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="pl-10 w-full border-gray-300 focus:border-blue-500 text-sm"
              />
            </div>

            {/* Product Filter */}
            <div className="min-w-[160px] relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Filter by product..."
                  value={productFilterSearchTerm}
                  onChange={e => {
                    setProductFilterSearchTerm(e.target.value);
                    setShowProductFilterDropdown(true);
                  }}
                  onFocus={() => setShowProductFilterDropdown(true)}
                  onClick={() => setShowProductFilterDropdown(true)}
                  onBlur={() => {
                    setTimeout(() => setShowProductFilterDropdown(false), 200);
                  }}
                  className="pl-10 pr-10 border-gray-300 focus:border-blue-500 text-sm w-full"
                />
                <ChevronDown
                  className={cn(
                    "absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 transition-transform",
                    showProductFilterDropdown && "rotate-180"
                  )}
                />
              </div>
              {/* Dropdown List */}
              {showProductFilterDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredProductFilterOptions.length === 0 ? (
                    <div className="px-4 py-6 text-center text-gray-500">
                      <Search className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                      <div className="text-sm">No products found</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Try adjusting your search
                      </div>
                    </div>
                  ) : (
                    <div className="py-1">
                      {/* All Products option */}
                      <div
                        onMouseDown={() => {
                          instantUpdateRef.current = true;
                          setFilters({ ...filters, product: "all" });
                          setProductFilterSearchTerm("");
                          setShowProductFilterDropdown(false);
                        }}
                        className={cn(
                          "flex items-center px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 transition-colors",
                          filters.product === "all" && "bg-blue-100 text-blue-700"
                        )}
                      >
                        <span>All Products</span>
                        {filters.product === "all" && (
                          <Check className="h-4 w-4 text-blue-600 ml-auto" />
                        )}
                      </div>
                      {filteredProductFilterOptions.map((policy) => (
                        <div
                          key={policy.id}
                          onMouseDown={() => {
                            instantUpdateRef.current = true;
                            setFilters({ ...filters, product: policy.name });
                            setProductFilterSearchTerm(policy.name);
                            setShowProductFilterDropdown(false);
                          }}
                          className={cn(
                            "flex items-center justify-between px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 transition-colors",
                            filters.product === policy.name && "bg-blue-100 text-blue-700"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full",
                                filters.product === policy.name
                                  ? "bg-blue-500"
                                  : "bg-gray-300"
                              )}
                            />
                            <span className="truncate">{policy.name}</span>
                          </div>
                          {filters.product === policy.name && (
                            <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Status Filter */}
            <div className="min-w-[160px]">
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters({ ...filters, status: value })
                }
              >
                <SelectTrigger className="w-full border-gray-300 focus:border-blue-500 text-sm">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {POLICY_CREATION_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters Button */}
            {(filters.product !== "all" ||
              filters.status !== "all" ||
              filters.search !== "") && (
              <Button
                variant="outline"
                onClick={() =>
                  setFilters({ product: "all", status: "all", search: "" })
                }
                className="h-9 px-3 text-sm border-gray-300 hover:bg-gray-50"
              >
                {/* <Filter className="w-4 h-4 mr-1" /> */}
                <FilterXIcon/>
              </Button>
            )}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3 justify-end flex-shrink-0">
            <Button
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Actions UI */}
      <div className="flex items-center gap-4 mb-2">
        {/*
        <input
          type="checkbox"
          checked={selectedPolicies.size === paginatedPolicies.length && paginatedPolicies.length > 0}
          onChange={e => handleSelectAll(e.target.checked)}
          className="rounded border-gray-300"
        />
        <span className="text-sm">Select All</span>
        */}
        {selectedPolicies.size > 0 && (
          <>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleBulkActionClick('activate')}
            >
              Activate All
            </Button>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => handleBulkActionClick('deactivate')}
            >
              Deactivate All
            </Button>
            <span className="text-xs text-gray-500 ml-2">{selectedPolicies.size} selected</span>
          </>
        )}
      </div>

      {/* Bulk Action Modal */}
      <Dialog open={bulkActionModalOpen} onOpenChange={setBulkActionModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle>
              {bulkActionType === 'activate' ? 'Activate' : 'Deactivate'} Selected Policies
            </DialogTitle>
            <DialogDescription>
              This will {bulkActionType === 'activate' ? 'activate' : 'deactivate'} all commission rules for {selectedPolicies.size} selected policies.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-40 overflow-y-auto">
            {Array.from(selectedPolicies).map(policyId => {
              const policy = policyNames.find(p => p.id === policyId);
              return (
                <div key={policyId} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm">{policy?.name}</span>
                </div>
              );
            })}
          </div>
          {bulkLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="animate-spin w-6 h-6 text-blue-600" />
              <span className="ml-2 text-blue-600 font-medium">Processing...</span>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkActionModalOpen(false)} disabled={bulkLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkActionConfirm}
              className={bulkActionType === 'activate' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
              disabled={bulkLoading}
            >
              {bulkLoading ? <Loader2 className="animate-spin w-4 h-4 inline-block mr-2" /> : null}
              {bulkActionType === 'activate' ? 'Activate All' : 'Deactivate All'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Accordion Policy Groups */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="border-dashed border-2 border-gray-300 rounded-lg p-8 text-center text-gray-500 text-sm">
            Loading rules...
          </div>
        ) : policiesWithRules.length === 0 ? (
          <div className="border-dashed border-2 border-gray-300 rounded-lg p-8 text-center text-gray-500 text-sm">
            {totalItems === 0
              ? "No commission rules created yet."
              : "No policies with rules match your filters."}
          </div>
        ) : (
          paginatedPolicies.map((policy) => {
            const rules = groupedRules[policy.id] || [];
            const isExpanded = expandedPolicies.has(policy.id);
            return (
              <div
                key={policy.id}
                className="border border-gray-200 rounded-lg shadow-sm"
              >
                <Collapsible
                  open={isExpanded}
                  onOpenChange={() => togglePolicyExpansion(policy.id)}
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        {/* <input
                          type="checkbox"
                          checked={selectedPolicies.has(policy.id)}
                          onChange={e => handlePolicySelection(policy.id, e.target.checked)}
                          onClick={e => e.stopPropagation()}
                          className="rounded border-gray-300"
                        /> */}
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                        <span className="text-lg font-semibold text-gray-800">
                          {policy.name}{" "}
                          <span className="ml-2 text-xs text-gray-500 font-normal">
                            ({rules.length} rule{rules.length !== 1 ? "s" : ""})
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Bulk toggle switch */}
                        <Switch
                          checked={getAllRulesActive(policy.id)}
                          onCheckedChange={() => handleBulkToggle(policy.id)}
                          aria-label="Toggle all rules for this product"
                          disabled={rules.length === 0}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={e => {
                            e.stopPropagation();
                            setForm({ policy_name_id: policy.id });
                            setEditRule(null);
                            setError(null);
                            setSelectedProductName(policy.name);
                            setProductSearchTerm(policy.name);
                            setShowProductDropdown(false);
                            setModalOpen(true);
                          }}
                          className="w-7 h-7 rounded-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                  <div className="p-0 md:p-4">
  <div className="overflow-x-auto rounded-lg border border-gray-200">
    <Table
      className="border-collapse w-full"
      style={{ tableLayout: "fixed", minWidth: "800px" }}
    >
      <TableHeader className="bg-gray-50">
        <TableRow>
          <TableHead className="font-semibold text-gray-700 text-sm py-3 px-4 w-[150px]">
            Policy Status
          </TableHead>
          <TableHead className="font-semibold text-gray-700 text-sm py-3 px-4 w-[200px]">
            Deductible Type
          </TableHead>
          <TableHead className="font-semibold text-gray-700 text-sm py-3 px-4 w-[160px]">
            Age Condition
          </TableHead>
          <TableHead className="font-semibold text-gray-700 text-sm py-3 px-4 text-center w-[130px]">
            Commission %
          </TableHead>
          <TableHead className="font-semibold text-gray-700 text-sm py-3 px-4 text-center w-[80px]">
            Active
          </TableHead>
          <TableHead className="font-semibold text-gray-700 text-sm py-3 px-4 text-center w-[130px]">
            Actions
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rules.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={6}
              className="text-center py-8 text-gray-400 text-sm"
            >
              No rules for this policy.
            </TableCell>
          </TableRow>
        ) : (
          rules.map((rule, index) => (
            <TableRow 
              key={rule.id}
              className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                index % 2 === 0
                  ? "bg-white"
                  : "bg-gray-50/30"
              }`}
            >
              <TableCell className="py-3 px-4 text-sm w-[120px]">
                <Badge
                  variant={getStatusBadgeVariant(
                    rule.policyStatus
                  )}
                  className="font-medium text-sm px-2 py-1"
                >
                  {rule.policyStatus}
                </Badge>
              </TableCell>
              <TableCell
                className={`font-medium text-sm py-3 px-4 w-[220px] ${getDeductibleColor(
                  rule.deductibleType
                )}`}
              >
                <div className="truncate" title={DEDUCTIBLE_TYPE_OPTIONS.find(
                  (opt) => opt.value === rule.deductibleType
                )?.label || rule.deductibleType}>
                  {DEDUCTIBLE_TYPE_OPTIONS.find(
                    (opt) => opt.value === rule.deductibleType
                  )?.label || rule.deductibleType}
                </div>
              </TableCell>
              <TableCell className="font-medium text-sm py-3 px-2 w-[140px] ">
                <Badge
                //   variant="outline"
                  className={`font-medium text-sm px-2 py-1 ${getAgeConditionColor(
                    rule.ageCondition
                  )}`}
                >
                  {AGE_CONDITION_OPTIONS.find(
                    (opt) => opt.value === rule.ageCondition
                  )?.label || rule.ageCondition}
                </Badge>
              </TableCell>
              <TableCell className="font-medium text-center text-sm py-3 px-4 w-[110px]">
                {editingId === rule.id ? (
                  <div className="flex items-center justify-center gap-1">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={editValue}
                      onChange={(e) =>
                        setEditValue(
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-16 text-center text-sm h-8"
                    />
                    <span className="text-xs font-bold">%</span>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <span className="text-base font-medium text-blue-600  px-2 py-1 rounded-md">
                      {rule.commissionPercent.toFixed(1)}%
                    </span>
                  </div>
                )}
              </TableCell>
              <TableCell className="text-center text-sm py-3 px-4 w-[80px]">
                <div className="flex items-center justify-center">
                  <Switch
                    checked={rule.is_active}
                    onCheckedChange={() => handleStatusToggle(rule)}
                    aria-label="Toggle commission rule active status"
                    className="scale-75"
                  />
                </div>
              </TableCell>
              <TableCell className="text-right text-sm py-3 px-4 w-[130px]">
                <div className="flex items-center justify-end gap-1">
                  {editingId === rule.id ? (
                    <>
                      <Button
                        size="sm"
                        onClick={handleInlineSave}
                        className="h-7 w-7 p-0 hover:bg-green-50 hover:border-green-300 bg-green-100 border border-green-200"
                      >
                        <Save className="w-3 h-3 text-green-600" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleInlineCancel}
                        className="h-7 w-7 p-0 hover:bg-red-50 hover:border-red-300 bg-red-100 border border-red-200"
                      >
                        <X className="w-3 h-3 text-red-400" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleCopyRule(rule)}
                        className="h-7 w-7 p-0 hover:bg-blue-50 hover:border-blue-300 bg-blue-100 border border-blue-200"
                        title="Copy rule"
                      >
                        <Copy className="w-3 h-3 text-blue-600" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleEdit(rule)}
                        className="h-7 w-7 p-0 hover:bg-indigo-50 hover:border-indigo-300 bg-indigo-100 border border-indigo-200"
                        title="Edit all details"
                      >
                        <Edit className="w-3 h-3 text-indigo-600" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDelete(rule)}
                        className="h-7 w-7 p-0 hover:bg-red-50 hover:border-red-300 bg-red-100 border border-red-200"
                        title="Delete rule"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
</div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination for policy names */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-6 px-2 gap-4 sm:gap-0 sticky bottom-0 bg-white z-10 border-t border-gray-200 pt-4">
        <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
          <span className="text-sm text-gray-600">Rows per page:</span>
          <Select
            value={rowsPerPage.toString()}
            onValueChange={(value) => {
              setRowsPerPage(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-16 border-gray-300 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROWS_PER_PAGE_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt.toString()}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1 mx-2 w-full sm:w-auto justify-center sm:justify-start">
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPolicyPages} ({totalItems} policies)
          </span>
        </div>
        <div className="flex space-x-1 w-full sm:w-auto justify-center sm:justify-start">
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(1)}
            className="h-8 w-8 sm:h-9 sm:w-9"
          >
            {"<<"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="h-8 w-8 sm:h-9 sm:w-9"
          >
            {"<"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage >= totalPolicyPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="h-8 w-8 sm:h-9 sm:w-9"
          >
            {">"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage >= totalPolicyPages}
            onClick={() => setCurrentPage(totalPolicyPages)}
            className="h-8 w-8 sm:h-9 sm:w-9"
          >
            {">>"}
          </Button>
        </div>
      </div>

      {/* Modal for create/edit commission rule */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[450px] bg-white rounded-lg border border-gray-300 shadow-lg p-5">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800 text-left">
              {editRule ? "Edit Commission Rule" : "New Commission Rule"}
            </DialogTitle>
            {/* <DialogDescription className="text-left text-gray-600 ">
              {editRule
                ? "Update the details for this commission rule."
                : "Fill in the details to create a new commission rule."}
            </DialogDescription> */}
          </DialogHeader>
          <form onSubmit={handleModalSave} className="space-y-4">
            {/* Enhanced Searchable Product Name Field */}
            <div className="space-y-1">
              <Label htmlFor="policy" >
                Product Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search and select a product..."
                    value={productSearchTerm}
                    onChange={(e) => handleProductSearchChange(e.target.value)}
                    onFocus={() => setShowProductDropdown(false)}
                    onClick={() => setShowProductDropdown(true)}
                    onBlur={() => {
                      // Delay hiding to allow for click events
                      setTimeout(() => setShowProductDropdown(false), 200);
                    }}
                    className={cn(
                      "pl-10 pr-10 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
                      !!editRule && "opacity-50 cursor-not-allowed bg-gray-100"
                    )}
                    disabled={!!editRule}
                  />
                  <ChevronDown
                    className={cn(
                      "absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 transition-transform",
                      showProductDropdown && "rotate-180"
                    )}
                  />
                </div>

                {/* Dropdown List */}
                {showProductDropdown && !editRule && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredProducts.length === 0 ? (
                      <div className="px-4 py-6 text-center text-gray-500">
                        <Search className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                        <div className="text-sm">No products found</div>
                        <div className="text-xs text-gray-400 mt-1">
                          Try adjusting your search
                        </div>
                      </div>
                    ) : (
                      <div className="py-1">
                        {filteredProducts.map((policy) => (
                          <div
                            key={policy.id}
                            onMouseDown={() => handleProductSelect(policy)}
                            className={cn(
                              "flex items-center justify-between px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 transition-colors",
                              form.policy_name_id === policy.id &&
                                "bg-blue-100 text-blue-700"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  "w-2 h-2 rounded-full",
                                  form.policy_name_id === policy.id
                                    ? "bg-blue-500"
                                    : "bg-gray-300"
                                )}
                              />
                              <span className="truncate">{policy.name}</span>
                            </div>
                            {form.policy_name_id === policy.id && (
                              <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Success indicator */}
              {form.policy_name_id && selectedProductName && (
                <div className="flex items-center gap-2 text-xs text-green-600 mt-1">
                  <Check className="h-3 w-3" />
                  <span>Selected: {selectedProductName}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="status">
                  Policy Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.policyStatus || ""}
                  onValueChange={(value) =>
                    setForm((f) => ({ ...f, policyStatus: value }))
                  }
                >
                  <SelectTrigger className="w-full border border-gray-300 focus:border-blue-500 mt-1">
                    <SelectValue placeholder="Select policy status" />
                  </SelectTrigger>
                  <SelectContent>
                    {POLICY_CREATION_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="deductible">
                  Deductible Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.deductibleType || ""}
                  onValueChange={(value) =>
                    setForm((f) => ({ ...f, deductibleType: value }))
                  }
                >
                  <SelectTrigger className="w-full border border-gray-300 focus:border-blue-500 mt-1">
                    <SelectValue placeholder="Select deductible type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEDUCTIBLE_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="age">
                  Age Condition <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.ageCondition || ""}
                  onValueChange={(value) =>
                    setForm((f) => ({ ...f, ageCondition: value }))
                  }
                >
                  <SelectTrigger className="w-full border border-gray-300 focus:border-blue-500 mt-1">
                    <SelectValue placeholder="Select age condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_CONDITION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="commission">
                  Commission Percentage <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="commission"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={form.commissionPercent || ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        commissionPercent: Number(e.target.value),
                      }))
                    }
                    placeholder="e.g. 5.5"
                    className="pr-8 text-sm border border-gray-300 focus:border-blue-500"
                    required
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                    %
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm mt-2 p-2 bg-red-50 border border-red-200 rounded">
                {error}
              </div>
            )}

            <DialogFooter className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={
                  !form.policy_name_id ||
                  !form.policyStatus ||
                  !form.deductibleType ||
                  !form.ageCondition ||
                  form.commissionPercent === undefined
                }
              >
                {editRule ? "Update Rule" : "Create Rule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-left text-gray-800">
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-left text-gray-600">
              Are you sure you want to delete this commission rule? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="text-red-600 text-sm mt-2 p-2 bg-red-50 border border-red-200 rounded">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setRuleToDelete(null);
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

export default CommissionRulePage;
