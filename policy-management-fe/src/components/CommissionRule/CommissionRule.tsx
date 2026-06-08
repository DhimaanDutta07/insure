import React, { useEffect, useState, useCallback } from "react";
import {
  upsertCommissionByProduct,
  getAllCommissionRules,
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
} from "lucide-react";
import { toast } from "sonner";
import CommissionDashboard from "../CommissionDashboard";

const DEFAULT_COMMISSION = 12.0;

const CommissionRulePage: React.FC = () => {
  const [policyNames, setPolicyNames] = useState<PolicyName[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [commissionRules, setCommissionRules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});
  const [renewalCommission, setRenewalCommission] = useState<string>('15');
  const [isSavingRenewal, setIsSavingRenewal] = useState(false);

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
                    const productName = product.name.toUpperCase();
                    const isOptimaSecure = productName.includes('OPTIMA SECURE');
                    const isOtherRetailHealth = company.name === 'HDFC ERGO' && productName === 'OTHERS';
                    const isSTU = company.name === 'HDFC ERGO' && productName === 'STU';
                    const isPA = company.name === 'HDFC ERGO' && productName === 'PA';
                    const isSME = company.name === 'HDFC ERGO' && productName === 'SME';
                    const isTravel = company.name === 'HDFC ERGO' && productName === 'TRAVEL';

                    const hasClassification = isOptimaSecure || isOtherRetailHealth || isSTU || isPA || isSME || isTravel;
                    const hasSI = isOptimaSecure || isOtherRetailHealth;

                    let statuses: string[] = [];
                    if (isOptimaSecure || isOtherRetailHealth) statuses = ['Fresh', 'Portablity'];
                    else if (isSTU) statuses = ['Fresh', 'Portablity'];
                    else if (isPA || isSME) statuses = ['Fresh', 'Renewal'];
                    else if (isTravel) statuses = ['Fresh'];

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
                            <div className="space-y-3">
                              {statuses.map((status) => {
                                const siConditions = hasSI
                                  ? ['LESS_THAN_10_LAKHS', 'GREATER_EQUAL_10_LAKHS']
                                  : ['DEFAULT'];

                                return (
                                  <div key={status} className="border border-gray-200 rounded p-3">
                                    <div className="text-xs font-semibold text-gray-700 mb-2">
                                      {status}
                                    </div>
                                    {siConditions.map((si) => {
                                      const rowKey = `${product.id}-${status}-${si}`;
                                      const rowHasEdit = editValues[rowKey] !== undefined;

                                      // Find matching commission rule
                                      const matchingRule = commissionRules.find(
                                        (rule) =>
                                          rule.policy_name_id === product.id &&
                                          rule.policyStatus === status &&
                                          (si === 'DEFAULT' ? !rule.siCondition : rule.siCondition === si)
                                      );

                                      const rowDisplayValue = rowHasEdit
                                        ? editValues[rowKey]
                                        : (matchingRule?.commissionPercent ?? DEFAULT_COMMISSION).toString();
                                      const rowIsSaving = savingId === rowKey;
                                      const siLabel = si === 'DEFAULT'
                                        ? 'Default'
                                        : si === 'LESS_THAN_10_LAKHS'
                                        ? 'SI < ₹10L'
                                        : 'SI ≥ ₹10L';

                                      return (
                                        <div
                                          key={si}
                                          className="flex items-center gap-2 mb-2 last:mb-0"
                                        >
                                          {hasSI && (
                                            <span className="text-xs text-gray-500 w-20">
                                              {siLabel}
                                            </span>
                                          )}
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
    </div>
  );
};

export default CommissionRulePage;
