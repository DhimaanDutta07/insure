import React, { useEffect, useState, useCallback } from "react";
import {
  getAllCommissionRules,
  upsertCommissionByProduct,
} from "../../services/commissionRule.service";
import {
  getAllPolicyNames,
  PolicyName,
} from "../../services/policyName.service";
import { getAllCompanies } from "../../services/company.service";
import type { CommissionRule } from "../../types/index";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Save,
  Building2,
  Package,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import CommissionDashboard from "../CommissionDashboard";

const CommissionRulePage: React.FC = () => {
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>([]);
  const [policyNames, setPolicyNames] = useState<PolicyName[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [rules, names, companyData] = await Promise.all([
        getAllCommissionRules(),
        getAllPolicyNames(),
        getAllCompanies(),
      ]);
      setCommissionRules(Array.isArray(rules) ? rules : (rules as any).data || []);
      setPolicyNames(names);
      setCompanies(companyData);
    } catch {
      toast.error("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Build product -> commissionPercent map
  const commissionMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    commissionRules.forEach((rule) => {
      if (rule.is_active) {
        // Use the first active rule's percentage per product
        if (map[rule.policy_name_id] === undefined) {
          map[rule.policy_name_id] = rule.commissionPercent;
        }
      }
    });
    return map;
  }, [commissionRules]);

  const handlePercentChange = (productId: string, value: string) => {
    setEditValues((prev) => ({ ...prev, [productId]: value }));
  };

  const handleSavePercent = async (productId: string) => {
    const raw = editValues[productId];
    if (raw === undefined) return;
    const percent = parseFloat(raw);
    if (isNaN(percent) || percent < 0 || percent > 100) {
      toast.error("Enter a valid percentage between 0 and 100");
      return;
    }
    setSavingId(productId);
    try {
      await upsertCommissionByProduct(productId, percent);
      toast.success("Commission percentage updated");
      // Update local state
      setCommissionRules((prev) => {
        // Update all rules for this product
        const updated = prev.map((r) =>
          r.policy_name_id === productId ? { ...r, commissionPercent: percent } : r
        );
        return updated;
      });
      setEditValues((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
    } catch {
      toast.error("Failed to update commission percentage");
    } finally {
      setSavingId(null);
    }
  };

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
                    const currentPercent = commissionMap[product.id] ?? 0;
                    const hasEdit = editValues[product.id] !== undefined;
                    const displayValue = hasEdit
                      ? editValues[product.id]
                      : currentPercent.toString();
                    const isSaving = savingId === product.id;

                    return (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow"
                      >
                        <Package className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-800 truncate">
                            {product.name}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step={0.1}
                              value={displayValue}
                              onChange={(e) =>
                                handlePercentChange(product.id, e.target.value)
                              }
                              className="w-20 h-9 text-sm text-center"
                            />
                            <span className="text-sm text-gray-500">%</span>
                          </div>
                          {hasEdit && (
                            <Button
                              size="sm"
                              onClick={() => handleSavePercent(product.id)}
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
