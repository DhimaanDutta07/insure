import React, { useEffect, useState, useCallback } from "react";
import {
  upsertCommissionByProduct,
  getAllCommissionRules,
  createCommissionRule,
  deleteCommissionRule,
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

const DEFAULT_COMMISSION = 12.0;

const CommissionRulePage: React.FC = () => {
  const [policyNames, setPolicyNames] = useState<PolicyName[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [commissionRules, setCommissionRules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingAllProductId, setDeletingAllProductId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});
  const [renewalCommission, setRenewalCommission] = useState<string>('15');
  const [isSavingRenewal, setIsSavingRenewal] = useState(false);
  
  // Add filter modal state
  const [addFilterModalOpen, setAddFilterModalOpen] = useState(false);
  const [selectedProductForFilter, setSelectedProductForFilter] = useState<PolicyName | null>(null);
  const [newRulePolicyStatus, setNewRulePolicyStatus] = useState<string>('Fresh');
  const [newRuleSICondition, setNewRuleSICondition] = useState<string>('ALL_SI');
  const [customSIThreshold, setCustomSIThreshold] = useState<string>('1000000');
  const [customSIOperator, setCustomSIOperator] = useState<string>('LESS_THAN');
  const [newRuleCommission, setNewRuleCommission] = useState<string>('12');
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
      setCommissionRules(Array.isArray(rules) ? rules : rules.data);
      console.log('[Frontend] Data updated:', { rulesCount: Array.isArray(rules) ? rules.length : rules.data?.length });
    } catch {
      toast.error("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePercentChange = (productId: string, policyStatus: string, siCondition: string, value: string) => {
    const key = policyStatus && siCondition ? `${productId}-${policyStatus}-${siCondition}` : productId;
    setEditValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSavePercent = async (productId: string, productType: string, policyStatus: string, siCondition: string) => {
    const key = policyStatus && siCondition ? `${productId}-${policyStatus}-${siCondition}` : productId;
    const raw = editValues[key];
    if (raw === undefined) return;
    const percent = parseFloat(raw);
    if (isNaN(percent) || percent < 0 || percent > 100) {
      toast.error("Enter a valid percentage between 0 and 100");
      return;
    }
    setSavingId(key);
    try {
      await upsertCommissionByProduct(productId, percent, productType, policyStatus, siCondition);
      toast.success("Commission percentage updated");
      setEditValues((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      fetchData();
    } catch {
      toast.error("Failed to update commission percentage");
    } finally {
      setSavingId(null);
    }
  };

  const toggleExpand = (productId: string) => {
    setExpandedProducts((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  const openAddFilterModal = (product: PolicyName) => {
    setSelectedProductForFilter(product);
    setNewRulePolicyStatus('Fresh');
    setNewRuleSICondition('ALL_SI');
    setCustomSIThreshold('1000000');
    setCustomSIOperator('LESS_THAN');
    setNewRuleCommission('12');
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

    if (newRuleSICondition === 'CUSTOM') {
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
        deductibleType: 'ALL_SI' as any,
        ageCondition: 'LESS_THAN_60' as any,
        productType: 'OTHER',
        is_active: true,
      };

      // Only set siCondition if not CUSTOM
      if (newRuleSICondition !== 'CUSTOM') {
        ruleData.siCondition = newRuleSICondition;
      } else {
        ruleData.siCondition = null;
      }

      // Only add custom SI fields if CUSTOM is selected
      if (newRuleSICondition === 'CUSTOM') {
        ruleData.customSIThreshold = parseInt(customSIThreshold);
        ruleData.customSIOperator = customSIOperator;
      } else {
        ruleData.customSIThreshold = null;
        ruleData.customSIOperator = null;
      }

      // Check if DEDUCTIBLE_ON is selected - this ignores SI and applies when deductible is ON
      if (newRuleSICondition === 'DEDUCTIBLE_ON') {
        ruleData.deductibleStatus = true;
        ruleData.siCondition = null; // Ignore SI for deductible-specific rules
      } else {
        ruleData.deductibleStatus = null;
      }

      console.log('[Frontend] Creating commission rule with data:', ruleData);
      await createCommissionRule(ruleData);
      toast.success("Commission rule added successfully");
      closeAddFilterModal();
      fetchData();
    } catch (error: any) {
      console.error('Error creating commission rule:', error);
      console.error('Error response:', error.response?.data);
      let errorMessage = "Failed to add commission rule";
      
      if (error.response?.data?.error) {
        // Handle Zod validation errors
        if (Array.isArray(error.response.data.error)) {
          errorMessage = error.response.data.error.map((e: any) => e.message).join(', ');
        } else if (typeof error.response.data.error === 'string') {
          errorMessage = error.response.data.error;
        } else if (error.response.data.error.message) {
          errorMessage = error.response.data.error.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSavingNewRule(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this commission rule?')) {
      return;
    }

    setDeletingId(ruleId);
    try {
      console.log('[Frontend] Deleting commission rule with id:', ruleId);
      await deleteCommissionRule(ruleId);
      console.log('[Frontend] Successfully deleted rule, refreshing data');
      toast.success("Commission rule deleted successfully");
      // Force a fresh fetch without cache
      await fetchData();
    } catch (error: any) {
      console.error('[Frontend] Error deleting commission rule:', error);
      const errorMessage = error.response?.data?.error || error.message || "Failed to delete commission rule";
      toast.error(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAllFilters = async (product: PolicyName) => {
    const productRules = commissionRules.filter((rule) => rule.policy_name_id === product.id);
    if (productRules.length === 0) {
      toast.error('No filters to delete for this product');
      return;
    }
    if (!confirm(`Delete all ${productRules.length} commission filter(s) for ${product.name}?`)) {
      return;
    }

    setDeletingAllProductId(product.id);
    try {
      await Promise.all(productRules.map((rule) => deleteCommissionRule(rule.id)));
      toast.success('All commission filters deleted successfully');
      await fetchData();
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      const errorMessage = err.response?.data?.error || err.message || 'Failed to delete commission filters';
      toast.error(errorMessage);
    } finally {
      setDeletingAllProductId(null);
    }
  };

  const handleSaveRenewalCommission = async () => {
    const percent = parseFloat(renewalCommission);
    if (isNaN(percent) || percent < 0 || percent > 100) {
      toast.error("Enter a valid percentage between 0 and 100");
      return;
    }

    setIsSavingRenewal(true);
    try {
      const hdfcCompany = companies.find(c => c.name === 'HDFC ERGO');
      if (!hdfcCompany) {
        toast.error("HDFC ERGO company not found in system");
        return;
      }

      const hdfcProducts = policyNames.filter(p => p.company_id === hdfcCompany.id);

      if (hdfcProducts.length === 0) {
        toast.error("No HDFC ERGO products found");
        return;
      }

      // Update all HDFC ERGO products with Renewal commission
      // For products with SI classification (OPTIMA SECURE, OTHERS), update both SI conditions
      for (const product of hdfcProducts) {
        const productName = product.name.toUpperCase();
        const isOptimaSecure = productName.includes('OPTIMA SECURE');
        const isOtherRetailHealth = productName === 'OTHERS';

        if (isOptimaSecure || isOtherRetailHealth) {
          // Update both SI conditions for products with SI classification
          await upsertCommissionByProduct(product.id, percent, undefined, 'Renewal', 'LESS_THAN_10_LAKHS');
          await upsertCommissionByProduct(product.id, percent, undefined, 'Renewal', 'GREATER_EQUAL_10_LAKHS');
        } else {
          // Update with undefined SI condition for other products (will be set to null in backend)
          await upsertCommissionByProduct(product.id, percent, undefined, 'Renewal', undefined);
        }
      }

      toast.success(`Renewal commission updated for ${hdfcProducts.length} HDFC ERGO products`);
      fetchData();
    } catch {
      toast.error("Failed to update Renewal commission");
    } finally {
      setIsSavingRenewal(false);
    }
  };


  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Commission Rules</h1>
      </div>

      {/* Global Commission Sections for HDFC ERGO */}
      <div className="mb-6">
        {/* Renewal Commission */}
        <div className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg max-w-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Renewal (HDFC ERGO)</h3>
          <p className="text-xs text-gray-600 mb-3">
            Applies when policy status is "Renewal" for HDFC ERGO policies
          </p>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={renewalCommission}
              onChange={(e) => setRenewalCommission(e.target.value)}
              className="w-20 h-9 text-center text-sm"
              disabled={isSavingRenewal}
            />
            <span className="text-xs text-gray-600">%</span>
            <Button
              onClick={handleSaveRenewalCommission}
              disabled={isSavingRenewal}
              className="bg-orange-600 hover:bg-orange-700 text-white h-9 px-3 text-xs"
            >
              {isSavingRenewal ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Save className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>
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
                    // Check actual commission rules instead of hardcoded name patterns
                    const productRules = commissionRules.filter(rule => rule.policy_name_id === product.id);
                    const hasSI = productRules.some(rule => rule.siCondition && rule.siCondition !== 'ALL_SI');
                    const hasStatus = productRules.some(rule => rule.policyStatus);
                    const hasClassification = hasSI || hasStatus;

                    // Get unique statuses from actual rules
                    const statuses = Array.from(new Set(productRules.map(rule => rule.policyStatus).filter(Boolean)));

                    const isExpanded = expandedProducts[product.id];
                    const key = product.id;
                    const hasEdit = editValues[key] !== undefined;

                    // Find matching commission rule for non-classified products
                    const matchingRule = commissionRules.find(
                      (rule) => rule.policy_name_id === product.id && !rule.policyStatus && !rule.siCondition
                    );

                    const displayValue = hasEdit
                      ? editValues[key]
                      : (matchingRule?.commissionPercent ?? DEFAULT_COMMISSION).toString();
                    const isSaving = savingId === key;

                    return (
                      <div
                        key={product.id}
                        className="border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow"
                      >
                        <div
                          className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50"
                          onClick={() => toggleExpand(product.id)}
                        >
                          <Package className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-800 truncate">
                              {product.name}
                            </div>
                            {hasClassification && (
                              <div className="text-xs text-gray-500 mt-1">
                                {statuses.join(', ')}
                                {hasSI && ' + SI'}
                              </div>
                            )}
                          </div>
                          {hasClassification && (
                            <ChevronDown
                              className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          )}
                        </div>

                        {isExpanded && hasClassification && (
                          <div className="p-4 pt-0 border-t border-gray-100">
                            <div className="flex justify-end gap-2 mb-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteAllFilters(product)}
                                disabled={deletingAllProductId === product.id}
                                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              >
                                {deletingAllProductId === product.id ? (
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3 h-3 mr-1" />
                                )}
                                Delete All Filters
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openAddFilterModal(product)}
                                className="text-xs"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Add New Filter
                              </Button>
                            </div>
                            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                              {statuses.map((status) => {
                                const siConditions = hasSI
                                  ? ['LESS_THAN_10_LAKHS', 'GREATER_EQUAL_10_LAKHS']
                                  : ['DEFAULT'];

                                // Also find any custom/deductible rules for this status that don't match standard SI
                                const customRulesForStatus = commissionRules.filter(
                                  (rule) =>
                                    rule.policy_name_id === product.id &&
                                    rule.policyStatus === status &&
                                    !siConditions.includes(rule.siCondition || '')
                                );

                                return (
                                  <div key={status} className="border border-gray-200 rounded p-3">
                                    {siConditions.map((si) => {
                                      const rowKey = `${product.id}-${status}-${si}`;
                                      const rowHasEdit = editValues[rowKey] !== undefined;

                                      // Find matching commission rule
                                      const matchingRule = commissionRules.find(
                                        (rule) =>
                                          rule.policy_name_id === product.id &&
                                          rule.policyStatus === status &&
                                          (si === 'DEFAULT' ? !rule.siCondition : rule.siCondition === si) &&
                                          // Exclude deductible rules from standard SI display
                                          !rule.deductibleStatus
                                      );

                                      const rowDisplayValue = rowHasEdit
                                        ? editValues[rowKey]
                                        : (matchingRule?.commissionPercent ?? DEFAULT_COMMISSION).toString();
                                      const rowIsSaving = savingId === rowKey;
                                      
                                      // Determine SI label - check for custom threshold first
                                      let siLabel = si === 'DEFAULT'
                                        ? 'All SI'
                                        : si === 'LESS_THAN_10_LAKHS'
                                        ? 'SI < ₹10L'
                                        : 'SI ≥ ₹10L';

                                      // If rule has custom SI threshold, display that instead
                                      if (matchingRule?.customSIThreshold && matchingRule?.customSIOperator) {
                                        const threshold = matchingRule.customSIThreshold;
                                        const operator = matchingRule.customSIOperator === 'LESS_THAN' ? '<' : '>';
                                        // Format threshold in lakhs if >= 100000, otherwise show full amount
                                        const formattedThreshold = threshold >= 100000
                                          ? `₹${(threshold / 100000).toFixed(0)}L`
                                          : `₹${threshold.toLocaleString()}`;
                                        siLabel = `SI ${operator} ${formattedThreshold}`;
                                      }

                                      // Add deductible status label if set
                                      if (matchingRule?.deductibleStatus === true) {
                                        siLabel += ' (Deductible On)';
                                      }

                                      // Display as: Policy Status (Sum Insured Condition)
                                      siLabel = `${status} (${siLabel})`;

                                      return (
                                        <div
                                          key={si}
                                          className="flex items-center gap-2 mb-2 last:mb-0"
                                        >
                                          <span className="text-xs text-gray-500 w-72 truncate">
                                            {siLabel}
                                          </span>
                                          <Input
                                            type="number"
                                            min={0}
                                            max={100}
                                            step={0.1}
                                            value={rowDisplayValue}
                                            onChange={(e) =>
                                              handlePercentChange(
                                                product.id,
                                                status,
                                                si === 'DEFAULT' ? '' : si,
                                                e.target.value
                                              )
                                            }
                                            className={`h-7 text-xs text-center ${hasSI ? 'w-16' : 'w-20'}`}
                                          />
                                          <span className="text-xs text-gray-500">%</span>
                                          {rowHasEdit && (
                                            <Button
                                              size="sm"
                                              onClick={() =>
                                                handleSavePercent(
                                                  product.id,
                                                  '',
                                                  status,
                                                  si === 'DEFAULT' ? '' : si
                                                )
                                              }
                                              disabled={rowIsSaving}
                                              className="h-7 px-2 bg-blue-600 hover:bg-blue-700 text-white"
                                            >
                                              {rowIsSaving ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                              ) : (
                                                <Save className="w-3 h-3" />
                                              )}
                                            </Button>
                                          )}
                                          {matchingRule && (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => handleDeleteRule(matchingRule.id)}
                                              disabled={deletingId === matchingRule.id}
                                              className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                            >
                                              {deletingId === matchingRule.id ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                              ) : (
                                                <Trash2 className="w-3 h-3" />
                                              )}
                                            </Button>
                                          )}
                                        </div>
                                      );
                                    })}
                                    {/* Display custom/deductible rules */}
                                    {customRulesForStatus.map((rule) => {
                                      const rowKey = `${product.id}-${status}-custom-${rule.id}`;
                                      const rowHasEdit = editValues[rowKey] !== undefined;
                                      const rowDisplayValue = rowHasEdit
                                        ? editValues[rowKey]
                                        : (rule.commissionPercent ?? DEFAULT_COMMISSION).toString();
                                      const rowIsSaving = savingId === rowKey;

                                      let siLabel = 'All SI';
                                      if (rule.customSIThreshold && rule.customSIOperator) {
                                        const threshold = rule.customSIThreshold;
                                        const operator = rule.customSIOperator === 'LESS_THAN' ? '<' : '>';
                                        const formattedThreshold = threshold >= 100000
                                          ? `₹${(threshold / 100000).toFixed(0)}L`
                                          : `₹${threshold.toLocaleString()}`;
                                        siLabel = `SI ${operator} ${formattedThreshold}`;
                                      }

                                      if (rule.deductibleStatus === true) {
                                        siLabel = 'Deductible On (ignores SI)';
                                      }

                                      siLabel = `${status} (${siLabel})`;

                                      return (
                                        <div
                                          key={rule.id}
                                          className="flex items-center gap-2 mb-2 last:mb-0"
                                        >
                                          <span className="text-xs text-gray-500 w-72 truncate">
                                            {siLabel}
                                          </span>
                                          <Input
                                            type="number"
                                            min={0}
                                            max={100}
                                            step={0.1}
                                            value={rowDisplayValue}
                                            onChange={(e) =>
                                              handlePercentChange(
                                                product.id,
                                                status,
                                                `custom-${rule.id}`,
                                                e.target.value
                                              )
                                            }
                                            className="h-7 text-xs text-center w-16"
                                          />
                                          <span className="text-xs text-gray-500">%</span>
                                          {rowHasEdit && (
                                            <Button
                                              size="sm"
                                              onClick={() =>
                                                handleSavePercent(
                                                  product.id,
                                                  '',
                                                  status,
                                                  `custom-${rule.id}`
                                                )
                                              }
                                              disabled={rowIsSaving}
                                              className="h-7 px-2 bg-blue-600 hover:bg-blue-700 text-white"
                                            >
                                              {rowIsSaving ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                              ) : (
                                                <Save className="w-3 h-3" />
                                              )}
                                            </Button>
                                          )}
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleDeleteRule(rule.id)}
                                            disabled={deletingId === rule.id}
                                            className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                          >
                                            {deletingId === rule.id ? (
                                              <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                              <Trash2 className="w-3 h-3" />
                                            )}
                                          </Button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {!hasClassification && (
                          <div className="p-4 pt-0 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                step={0.1}
                                value={displayValue}
                                onChange={(e) => handlePercentChange(product.id, '', '', e.target.value)}
                                className="w-20 h-9 text-sm text-center"
                              />
                              <span className="text-sm text-gray-500">%</span>
                              {hasEdit && (
                                <Button
                                  size="sm"
                                  onClick={() => handleSavePercent(product.id, '', '', '')}
                                  disabled={isSaving}
                                  className="h-9 px-3 bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  {isSaving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Save className="w-4 h-4" />
                                  )}
                                </Button>
                              )}
                              {matchingRule && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteRule(matchingRule.id)}
                                  disabled={deletingId === matchingRule.id}
                                  className="h-9 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                >
                                  {deletingId === matchingRule.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              )}
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
                        )}
                      </div>
                    );
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
        <DialogContent className="sm:max-w-[425px] bg-white rounded-lg shadow-lg">
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
                  <SelectItem value="Migration">Migration</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Sum Insured Condition</label>
              <Select value={newRuleSICondition} onValueChange={setNewRuleSICondition}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select SI condition (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_SI">None (All SI)</SelectItem>
                  <SelectItem value="LESS_THAN_10_LAKHS">SI &lt; 10L</SelectItem>
                  <SelectItem value="GREATER_EQUAL_10_LAKHS">SI &gt;= 10L</SelectItem>
                  <SelectItem value="DEDUCTIBLE_ON">Deductible Amount Status ON (ignores SI)</SelectItem>
                  <SelectItem value="CUSTOM">Custom Threshold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newRuleSICondition === 'CUSTOM' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Custom SI Threshold (₹)</label>
                <div className="flex gap-2">
                  <Select value={customSIOperator} onValueChange={setCustomSIOperator}>
                    <SelectTrigger className="w-32">
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
                    placeholder="Enter threshold amount"
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Commission Percentage</label>
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
              {isSavingNewRule ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Add Rule'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommissionRulePage;
