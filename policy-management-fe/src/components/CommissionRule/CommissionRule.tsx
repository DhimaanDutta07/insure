import React, { useEffect, useState, useCallback } from "react";
import {
  upsertCommissionByProduct,
  getAllCommissionRules,
  createCommissionRule,
  deleteCommissionRule,
  updateCommissionRule,
} from "../../services/commissionRule.service";
import {
  getAllPolicyNames,
  PolicyName,
} from "../../services/policyName.service";
import { getAllCompanies } from "../../services/company.service";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Save,
  Building2,
  Package,
  Loader2,
  ChevronDown,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import CommissionDashboard from "../CommissionDashboard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const CommissionRulePage: React.FC = () => {
  const [policyNames, setPolicyNames] = useState<PolicyName[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [commissionRules, setCommissionRules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // editValues keyed by rule.id for classified rules, or productId for flat rules
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});

  // Add filter modal state
  const [addFilterModalOpen, setAddFilterModalOpen] = useState(false);
  const [selectedProductForFilter, setSelectedProductForFilter] = useState<PolicyName | null>(null);
  const [newRulePolicyStatus, setNewRulePolicyStatus] = useState<string>("Fresh");
  const [newRuleSICondition, setNewRuleSICondition] = useState<string>("ALL_SI");
  const [customSIThreshold, setCustomSIThreshold] = useState<string>("1000000");
  const [customSIOperator, setCustomSIOperator] = useState<string>("LESS_THAN");
  const [newRuleCommission, setNewRuleCommission] = useState<string>("12");
  const [isSavingNewRule, setIsSavingNewRule] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [names, companyData, rules] = await Promise.all([
        getAllPolicyNames(),
        getAllCompanies(),
        getAllCommissionRules({ isActive: true }),
      ]);
      setPolicyNames(names);
      setCompanies(companyData);

      const rulesArray = Array.isArray(rules) ? rules : (rules as any).data;
      const uniqueRules = Array.from(
        new Map(rulesArray.map((rule: any) => [rule.id, rule])).values()
      );

      setCommissionRules(uniqueRules as any[]);
      // Clear edit state after refresh so inputs reflect DB values
      setEditValues({});
    } catch {
      toast.error("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── FLAT (non-classified) product handlers ───────────────────────────────

  const handleFlatChange = (productId: string, value: string) => {
    setEditValues((prev) => ({ ...prev, [productId]: value }));
  };

  const handleFlatSave = async (productId: string, ruleId: string | null) => {
    const raw = editValues[productId];
    if (raw === undefined) return;
    const percent = parseFloat(raw);
    if (isNaN(percent) || percent < 0 || percent > 100) {
      toast.error("Enter a valid percentage between 0 and 100");
      return;
    }
    setSavingId(productId);
    try {
      if (ruleId) {
        await updateCommissionRule(ruleId, { commissionPercent: percent });
      } else {
        await upsertCommissionByProduct(productId, percent);
      }
      toast.success("Commission percentage updated");
      fetchData();
    } catch {
      toast.error("Failed to update commission percentage");
    } finally {
      setSavingId(null);
    }
  };

  // ─── CLASSIFIED rule handlers ─────────────────────────────────────────────

  const handleRuleChange = (ruleId: string, value: string) => {
    setEditValues((prev) => ({ ...prev, [ruleId]: value }));
  };

  const handleRuleSave = async (ruleId: string) => {
    const raw = editValues[ruleId];
    if (raw === undefined) return;
    const percent = parseFloat(raw);
    if (isNaN(percent) || percent < 0 || percent > 100) {
      toast.error("Enter a valid percentage between 0 and 100");
      return;
    }
    setSavingId(ruleId);
    try {
      await updateCommissionRule(ruleId, { commissionPercent: percent });
      toast.success("Commission percentage updated");
      fetchData();
    } catch {
      toast.error("Failed to update commission percentage");
    } finally {
      setSavingId(null);
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────

  const toggleExpand = (productId: string) => {
    setExpandedProducts((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this commission rule?")) return;
    setDeletingId(ruleId);
    try {
      await deleteCommissionRule(ruleId);
      toast.success("Commission rule deleted successfully");
      await fetchData();
    } catch (error: any) {
      const msg = error.response?.data?.error || error.message || "Failed to delete commission rule";
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  // ─── Add filter modal ─────────────────────────────────────────────────────

  const openAddFilterModal = (product: PolicyName) => {
    setSelectedProductForFilter(product);
    setNewRulePolicyStatus("Fresh");
    setNewRuleSICondition("ALL_SI");
    setCustomSIThreshold("1000000");
    setCustomSIOperator("LESS_THAN");
    setNewRuleCommission("12");
    setAddFilterModalOpen(true);
  };

  const closeAddFilterModal = () => {
    setAddFilterModalOpen(false);
    setSelectedProductForFilter(null);
  };

  const handleSaveNewRule = async () => {
    if (!selectedProductForFilter) return;

    const percent = parseFloat(newRuleCommission);
    if (isNaN(percent) || percent < 0 || percent > 100) {
      toast.error("Enter a valid percentage between 0 and 100");
      return;
    }
    if (newRuleSICondition === "CUSTOM") {
      const threshold = parseInt(customSIThreshold);
      if (isNaN(threshold) || threshold < 0) {
        toast.error("Enter a valid custom SI threshold");
        return;
      }
    }

    setIsSavingNewRule(true);
    try {
      const ruleData: any = {
        policy_name_id: selectedProductForFilter.id,
        commissionPercent: percent,
        policyStatus: newRulePolicyStatus as any,
        deductibleType: "ALL_SI" as any,
        ageCondition: "LESS_THAN_60" as any,
        productType: "OTHER",
        is_active: true,
      };

      if (newRuleSICondition === "DEDUCTIBLE_ON") {
        ruleData.deductibleStatus = true;
        ruleData.siCondition = null;
        ruleData.customSIThreshold = null;
        ruleData.customSIOperator = null;
      } else if (newRuleSICondition === "CUSTOM") {
        ruleData.siCondition = null;
        ruleData.customSIThreshold = parseInt(customSIThreshold);
        ruleData.customSIOperator = customSIOperator;
        ruleData.deductibleStatus = null;
      } else {
        ruleData.siCondition = newRuleSICondition === "ALL_SI" ? null : newRuleSICondition;
        ruleData.customSIThreshold = null;
        ruleData.customSIOperator = null;
        ruleData.deductibleStatus = null;
      }

      await createCommissionRule(ruleData);
      toast.success("Commission rule added successfully");
      closeAddFilterModal();
      fetchData();
    } catch (error: any) {
      let msg = "Failed to add commission rule";
      if (error.response?.data?.error) {
        if (Array.isArray(error.response.data.error)) {
          msg = error.response.data.error.map((e: any) => e.message).join(", ");
        } else if (typeof error.response.data.error === "string") {
          msg = error.response.data.error;
        } else if (error.response.data.error.message) {
          msg = error.response.data.error.message;
        }
      } else if (error.message) {
        msg = error.message;
      }
      toast.error(msg);
    } finally {
      setIsSavingNewRule(false);
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const statusLabel = (status: string) =>
    status === "Migration" ? "Internal Portability" : status === "Portablity" ? "Portability" : status;

  const formatSILabel = (rule: any): string => {
    if (rule.deductibleStatus === true) return "Deductible ON (ignores SI)";
    if (rule.customSIThreshold && rule.customSIOperator) {
      const op = rule.customSIOperator === "LESS_THAN" ? "<" : ">";
      const val =
        rule.customSIThreshold >= 100000
          ? `₹${(rule.customSIThreshold / 100000).toFixed(0)}L`
          : `₹${rule.customSIThreshold.toLocaleString()}`;
      return `SI (₹) ${op} ${val}`;
    }
    if (!rule.siCondition || rule.siCondition === "ALL_SI") return "All SI";
    if (rule.siCondition === "LESS_THAN_10_LAKHS") return "Sum Insured (₹) < ₹10L";
    if (rule.siCondition === "GREATER_EQUAL_10_LAKHS") return "Sum Insured (₹) ≥ ₹10L";
    return rule.siCondition;
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Commission Rules</h1>
      </div>

      <div className="mb-6">
        <CommissionDashboard />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-6">
          {companies.map((company) => {
            const companyProducts = policyNames.filter((p) => p.company_id === company.id);
            if (companyProducts.length === 0) return null;

            return (
              <div key={company.id} className="border border-gray-200 rounded-lg bg-white shadow-sm">
                {/* Company Header */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-6 h-6 text-purple-600" />
                    <h2 className="text-xl font-bold text-gray-800">{company.name}</h2>
                    <span className="text-sm text-gray-500">({companyProducts.length} products)</span>
                  </div>
                </div>

                {/* Products Grid */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {companyProducts.map((product) => {
                    const productRules = commissionRules.filter(
                      (r) => r.policy_name_id === product.id
                    );

                    // A product is "classified" if any rule has a policyStatus set
                    const hasClassification = productRules.some((r) => r.policyStatus);

                    const isExpanded = expandedProducts[product.id];

                    if (hasClassification) {
                      // ── CLASSIFIED PRODUCT ──────────────────────────────
                      return (
                        <div
                          key={product.id}
                          className="border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow"
                        >
                          {/* Header row — click to expand */}
                          <div
                            className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50"
                            onClick={() => toggleExpand(product.id)}
                          >
                            <Package className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-800 truncate">
                                {product.name}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {productRules.length} rule{productRules.length !== 1 ? "s" : ""}
                              </div>
                            </div>
                            <ChevronDown
                              className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </div>

                          {isExpanded && (
                            <div className="border-t border-gray-100">
                              {/* Add filter button */}
                              <div className="px-4 pt-3 pb-2 flex justify-end">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openAddFilterModal(product)}
                                  className="text-xs h-7"
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add Filter
                                </Button>
                              </div>

                              {/* Scrollable rule list — max 4 rows visible (~168px), then scroll */}
                              <div
                                className="px-3 pb-3 overflow-y-auto"
                                style={{ maxHeight: "220px" }}
                              >
                                {productRules.length === 0 ? (
                                  <p className="text-xs text-gray-400 text-center py-4">
                                    No rules yet. Add a filter above.
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    {productRules.map((rule) => {
                                      const editKey = rule.id;
                                      const isEditing = editValues[editKey] !== undefined;
                                      const displayVal = isEditing
                                        ? editValues[editKey]
                                        : String(rule.commissionPercent ?? "");
                                      const isSavingThis = savingId === editKey;
                                      const isDeletingThis = deletingId === rule.id;

                                      const label = `${statusLabel(rule.policyStatus)} — ${formatSILabel(rule)}`;

                                      return (
                                        <div
                                          key={rule.id}
                                          className="flex items-center gap-1.5 bg-gray-50 rounded px-2 py-1.5"
                                        >
                                          {/* Label */}
                                          <span
                                            className="text-xs text-gray-600 flex-1 min-w-0 truncate"
                                            title={label}
                                          >
                                            {label}
                                          </span>

                                          {/* Editable % input */}
                                          <Input
                                            type="number"
                                            min={0}
                                            max={100}
                                            step={0.1}
                                            value={displayVal}
                                            onChange={(e) =>
                                              handleRuleChange(editKey, e.target.value)
                                            }
                                            className="h-7 w-16 text-xs text-center shrink-0"
                                          />
                                          <span className="text-xs text-gray-500 shrink-0">%</span>

                                          {/* Save button — visible when value changed */}
                                          {isEditing && (
                                            <Button
                                              size="sm"
                                              onClick={() => handleRuleSave(editKey)}
                                              disabled={isSavingThis}
                                              className="h-7 px-2 bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                                            >
                                              {isSavingThis ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                              ) : (
                                                <Save className="w-3 h-3" />
                                              )}
                                            </Button>
                                          )}

                                          {/* Delete button — always visible */}
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleDeleteRule(rule.id)}
                                            disabled={isDeletingThis}
                                            className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 shrink-0"
                                          >
                                            {isDeletingThis ? (
                                              <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                              <Trash2 className="w-3 h-3" />
                                            )}
                                          </Button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    } else {
                      // ── FLAT (no classification) PRODUCT ────────────────
                      const flatRule = productRules[0] ?? null;
                      const flatEditKey = product.id;
                      const flatIsEditing = editValues[flatEditKey] !== undefined;
                      const flatDisplayVal = flatIsEditing
                        ? editValues[flatEditKey]
                        : String(flatRule?.commissionPercent ?? "");
                      const flatIsSaving = savingId === flatEditKey;
                      const flatIsDeleting = deletingId === flatRule?.id;

                      return (
                        <div
                          key={product.id}
                          className="border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-3 p-4">
                            <Package className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-800 truncate">
                                {product.name}
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5">Flat rate</div>
                            </div>
                          </div>

                          <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                step={0.1}
                                placeholder="e.g. 12"
                                value={flatDisplayVal}
                                onChange={(e) => handleFlatChange(flatEditKey, e.target.value)}
                                className="w-20 h-9 text-sm text-center"
                              />
                              <span className="text-sm text-gray-500">%</span>

                              {flatIsEditing && (
                                <Button
                                  size="sm"
                                  onClick={() => handleFlatSave(flatEditKey, flatRule?.id ?? null)}
                                  disabled={flatIsSaving}
                                  className="h-9 px-3 bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  {flatIsSaving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Save className="w-4 h-4" />
                                  )}
                                </Button>
                              )}

                              {/* Delete flat rule */}
                              {flatRule && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteRule(flatRule.id)}
                                  disabled={flatIsDeleting}
                                  className="h-9 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                >
                                  {flatIsDeleting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              )}

                              {/* Add Filter */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openAddFilterModal(product)}
                                className="h-9 px-3 text-xs"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Add Filter
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            );
          })}

          {companies.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium">No companies found</p>
            </div>
          )}
        </div>
      )}

      {/* Add Filter Modal */}
      <Dialog open={addFilterModalOpen} onOpenChange={setAddFilterModalOpen}>
        <DialogContent className="sm:max-w-[440px] bg-white rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-left text-gray-700">Add Commission Filter</DialogTitle>
            <DialogDescription className="text-left text-gray-600">
              Add a new commission rule for <b>{selectedProductForFilter?.name}</b>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Policy Status</label>
              <Select value={newRulePolicyStatus} onValueChange={setNewRulePolicyStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fresh">Fresh</SelectItem>
                  <SelectItem value="Portablity">Portability</SelectItem>
                  <SelectItem value="Renewal">Renewal</SelectItem>
                  <SelectItem value="Migration">Internal Portability</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Sum Insured (₹) Condition</label>
              <Select value={newRuleSICondition} onValueChange={setNewRuleSICondition}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select SI condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_SI">None — applies to all Sum Insured</SelectItem>
                  <SelectItem value="LESS_THAN_10_LAKHS">Sum Insured (₹) &lt; ₹10L</SelectItem>
                  <SelectItem value="GREATER_EQUAL_10_LAKHS">Sum Insured (₹) ≥ ₹10L</SelectItem>
                  <SelectItem value="DEDUCTIBLE_ON">Deductible Status ON — ignores Sum Insured (₹)</SelectItem>
                  <SelectItem value="CUSTOM">Custom Sum Insured (₹) Threshold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newRuleSICondition === "CUSTOM" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Custom Sum Insured (₹) Threshold</label>
                <div className="flex gap-2">
                  <Select value={customSIOperator} onValueChange={setCustomSIOperator}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LESS_THAN">Less than</SelectItem>
                      <SelectItem value="GREATER_THAN">Greater than</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={0}
                    step={10000}
                    value={customSIThreshold}
                    onChange={(e) => setCustomSIThreshold(e.target.value)}
                    className="flex-1"
                    placeholder="Amount in ₹"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Commission Percentage (%)</label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={newRuleCommission}
                onChange={(e) => setNewRuleCommission(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeAddFilterModal}
              disabled={isSavingNewRule}
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveNewRule}
              disabled={isSavingNewRule}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {isSavingNewRule ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommissionRulePage;
