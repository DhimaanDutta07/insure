import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  History,
  ArrowRight,
  RefreshCw,
  Building2,
  Shield,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  PolicyTransitionService,
  PolicyTransitionHistory,
} from "../../services/policyTransition.service";
import type { Policy } from "../../types/index";

// Extended Policy interface to include transition_type
interface ExtendedPolicy extends Policy {
  transition_type?: string;
}

interface PolicyHistorySheetProps {
  open: boolean;
  onClose: () => void;
  policy: ExtendedPolicy | null;
}

const PolicyHistorySheet: React.FC<PolicyHistorySheetProps> = ({
  open,
  onClose,
  policy,
}) => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<PolicyTransitionHistory | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!policy) return;

    setLoading(true);
    setError(null);
    try {
      const result = await PolicyTransitionService.getTransitionHistory(
        policy.id
      );
      setHistory(result);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch policy history";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [policy]);

  // Fetch history when sheet opens
  useEffect(() => {
    if (open && policy) {
      fetchHistory();
    }
  }, [open, policy, fetchHistory]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTransitionIcon = (transitionType: string) => {
    switch (transitionType) {
      case "RENEWAL":
        return <RefreshCw className="w-4 h-4 text-blue-600" />;
      case "MIGRATION":
        return <Building2 className="w-4 h-4 text-purple-600" />;
      case "PORTABILITY":
        return <ArrowRight className="w-4 h-4 text-orange-600" />;
      default:
        return <Shield className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTransitionBadgeColor = (transitionType: string) => {
    switch (transitionType) {
      case "RENEWAL":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "MIGRATION":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "PORTABILITY":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTransitionDisplayName = (transitionType: string) => {
    switch (transitionType) {
      case "RENEWAL":
        return "RENEWAL";
      case "MIGRATION":
        return "INTERNAL PORTABILITY";
      case "PORTABILITY":
        return "PORTABILITY";
      default:
        return transitionType;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Fresh":
        return "bg-green-100 text-green-800 border-green-200";
      case "Renewal":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Migration":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Portablity":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case "Migration":
        return "Internal Portability";
      default:
        return status;
    }
  };

  // Helper function to get relationship display name
  const getRelationshipDisplayName = (item: {
    relationship: string;
    generation?: number;
  }): string => {
    if (item.relationship === "CURRENT") return "Latest Policy";
    if (item.relationship === "PARENT") return "Parent Policy";
    if (item.relationship === "CHILD") return "Child Policy";
    if (item.relationship === "ANCESTOR") {
      const generation = item.generation || 0;
      if (generation === 2) return "Grandparent Policy";
      if (generation === 3) return "Great-Grandparent Policy";
      return `${generation}${getOrdinalSuffix(generation)} Generation Ancestor`;
    }
    return "Unknown";
  };

  // Helper function to get ordinal suffix
  const getOrdinalSuffix = (num: number): string => {
    if (num >= 11 && num <= 13) return "th";
    switch (num % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  // Helper function to safely extract company name
  const getCompanyName = (company: unknown): string => {
    if (!company) return "N/A";
    if (typeof company === "string") return company;
    if (
      company &&
      typeof company === "object" &&
      "name" in company &&
      typeof (company as { name: string }).name === "string"
    ) {
      return (company as { name: string }).name;
    }
    return "N/A";
  };

  // Helper function to safely extract policy name
  const getPolicyName = (policyName: unknown): string => {
    if (!policyName) return "N/A";
    if (typeof policyName === "string") return policyName;
    if (
      policyName &&
      typeof policyName === "object" &&
      "name" in policyName &&
      typeof (policyName as { name: string }).name === "string"
    ) {
      return (policyName as { name: string }).name;
    }
    return "N/A";
  };

  if (!policy) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="
          w-full
          max-w-xl
          sm:max-w-2xl
          md:max-w-2xl
          lg:max-w-2xl
          xl:max-w-2xl
          2xl:max-w-2xl
          min-w-[350px]
          h-full
          overflow-y-auto
          bg-white
          px-4
          py-4
          border-l
          border-gray-200
        "
        style={{ boxShadow: "0 6px 32px 0 rgba(0,0,0,0.08)" }}
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-lg font-semibold mb-1">
            <History className="w-4 h-4 text-blue-600" />
            Policy History
          </SheetTitle>
          <p className="text-xs text-gray-600">
            View the complete history and relationships of this policy
          </p>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Current Policy Card */}
          <Card className="border-l-4 border-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Shield className="w-3 h-3" />
                Current Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-xs font-medium text-gray-600">
                    Policy Number
                  </span>
                  <p className="text-xs font-semibold text-blue-600">
                    {policy.policy_number}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-600">
                    Customer Name
                  </span>
                  <p className="text-xs text-gray-900">
                    {policy.customer_name}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-600">
                    Company
                  </span>
                  <p className="text-xs text-gray-900">
                    {getCompanyName(policy.company)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-600">
                    Product Name
                  </span>
                  <p className="text-xs text-gray-900">
                    {getPolicyName(policy.policyName)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-600">
                    Premium Amount
                  </span>
                  <p className="text-xs font-semibold text-green-600">
                    {formatCurrency(policy.premium_amount)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-600">
                    Sum Insured Amount
                  </span>
                  <p className="text-xs font-semibold text-green-600">
                    {formatCurrency(policy.sum_insured)}
                  </p>
                </div>
                {policy.deductible_amount ? (
                  <div>
                    <span className="text-xs font-medium text-gray-600">
                      Deductible Amount
                    </span>
                    <p className="text-xs font-semibold text-green-600">
                      {formatCurrency(policy.deductible_amount)}
                    </p>
                  </div>
                ) : null}

                <div>
                  <span className="text-xs font-medium text-gray-600 pr-1">
                    Status
                  </span>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded-full border ${getStatusBadgeColor(
                      policy.policy_creation_status || "Fresh"
                    )}`}
                  >
                    {getStatusDisplayName(policy.policy_creation_status || "Fresh")}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs font-medium text-gray-600">
                    Policy Period
                  </span>
                  <p className="text-xs text-gray-700">
                    {formatDate(policy.start_date)} -{" "}
                    {formatDate(policy.end_date)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {loading && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-center py-6">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-gray-600">
                      Loading policy history...
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-red-600 p-2">
                  <AlertCircle className="w-3 h-3" />
                  <span className="text-xs">{error}</span>
                </div>
                <Button
                  onClick={fetchHistory}
                  variant="outline"
                  size="sm"
                  className="mt-2 text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {/* History Timeline */}
          {!loading && !error && history && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <History className="w-3 h-3" />
                  Policy Hierarchy Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {history.transitionHistory.length === 0 ? (
                  <div className="text-center py-6">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-xs">
                      No transition history found for this policy.
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* Build the complete hierarchy from earliest ancestor to current policy */}
                    {(() => {
                      // Use the complete hierarchy from the backend
                      const timeline: PolicyTransitionHistory['completeHierarchy'] = history.completeHierarchy || [];

                      return timeline.map((item, index) => {
                        const isLast = index === timeline.length - 1;
                        return (
                          <div key={item.policy.id} className="relative flex">
                            {/* Timeline column: dot + line */}
                            <div className="flex flex-col items-center mr-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center z-10
                                  ${
                                    item.relationship === "CURRENT"
                                      ? "bg-blue-500 text-white"
                                      : item.relationship === "PARENT" ||
                                        item.relationship === "ANCESTOR"
                                      ? "bg-green-100 text-green-600"
                                      : "bg-orange-100 text-orange-600"
                                  }
                                `}
                              >
                                {item.relationship === "CURRENT" ? (
                                  <Shield className="w-4 h-4" />
                                ) : item.transition_type ? (
                                  getTransitionIcon(item.transition_type)
                                ) : (
                                  <Shield className="w-4 h-4" />
                                )}
                              </div>
                              {/* Vertical line */}
                              {!isLast && (
                                <div
                                  className="w-0.25 flex-1 bg-gray-300"
                                  style={{ minHeight: 32 }}
                                />
                              )}
                            </div>

                            {/* Policy details */}
                            <div
                              className={`flex-1 rounded-lg p-3 mb-6
                                ${
                                  item.relationship === "CURRENT"
                                    ? "bg-blue-50 border border-blue-200"
                                    : "bg-gray-50 border border-gray-200"
                                }
                              `}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4
                                    className={`font-medium text-xs ${
                                      item.relationship === "CURRENT"
                                        ? "text-blue-900"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {item.policy.policy_number}
                                    {item.relationship === "CURRENT" && (
                                      <span className="ml-2 text-blue-600 font-bold">
                                        (Latest)
                                      </span>
                                    )}
                                  </h4>
                                  <p className="text-xs text-gray-600">
                                    {item.policy.customer_name}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  {item.transition_type && (
                                    <span
                                      className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded-full border ${getTransitionBadgeColor(
                                        item.transition_type
                                      )}`}
                                    >
                                      {getTransitionDisplayName(item.transition_type)}
                                    </span>
                                  )}
                                  <span
                                    className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded-full border ${getStatusBadgeColor(
                                      item.policy.policy_creation_status ||
                                        "Fresh"
                                    )}`}
                                  >
                                    {getStatusDisplayName(item.policy.policy_creation_status ||
                                      "Fresh")}
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <span className="text-xs font-medium text-gray-600">
                                    Company
                                  </span>
                                  <p className="text-xs text-gray-900">
                                    {getCompanyName(item.policy.company)}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-gray-600">
                                    Product Name
                                  </span>
                                  <p className="text-xs text-gray-900">
                                    {getPolicyName(item.policy.policyName)}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-gray-600">
                                    Premium
                                  </span>
                                  <p className="text-xs font-semibold text-green-600">
                                    {formatCurrency(item.policy.premium_amount)}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-gray-600">
                                    Sum Insured
                                  </span>
                                  <p className="text-xs font-semibold text-green-600">
                                    {formatCurrency(item.policy.sum_insured)}
                                  </p>
                                </div>
                                {item.policy.deductible_amount ? (
                                  <div>
                                    <span className="text-xs font-medium text-gray-600">
                                      Deductible Amount
                                    </span>
                                    <p className="text-xs font-semibold text-green-600">
                                      {formatCurrency(item.policy.deductible_amount)}
                                    </p>
                                  </div>
                                ) : null}
                                <div>
                                  <span className="text-xs font-medium text-gray-600">
                                    Period
                                  </span>
                                  <p className="text-xs text-gray-700">
                                    {formatDate(item.policy.start_date)} -{" "}
                                    {formatDate(item.policy.end_date)}
                                  </p>
                                </div>
                                {item.commission && (
                                  <>
                                    <div>
                                      <span className="text-xs font-medium text-gray-600">
                                        Commission
                                      </span>
                                      <p className="text-xs font-semibold text-blue-600">
                                        {formatCurrency(item.commission.amount)}
                                        {item.commission.percentage > 0 && (
                                          <span className="text-gray-500 ml-1">
                                            ({item.commission.percentage}%)
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-xs font-medium text-gray-600">
                                        GST Status
                                      </span>
                                      <span
                                        className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded-full ${
                                          item.commission.gst_status
                                            ? 'bg-purple-100 text-purple-800 border-purple-200'
                                            : 'bg-gray-100 text-gray-800 border-gray-200'
                                        }`}
                                      >
                                        {item.commission.gst_status ? 'Applied' : 'Not Applied'}
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>

                              {/* Relationship indicator */}
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <div className="flex items-center gap-1">
                                  <span className="text-xs font-medium text-gray-600">
                                    Position:
                                  </span>
                                  <span
                                    className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded-full ${
                                      item.relationship === "CURRENT"
                                        ? "bg-blue-100 text-blue-800 border-blue-200"
                                        : item.relationship === "PARENT" ||
                                          item.relationship === "ANCESTOR"
                                        ? "bg-green-100 text-green-800 border-green-200"
                                        : "bg-orange-100 text-orange-800 border-orange-200"
                                    }`}
                                  >
                                    {getRelationshipDisplayName(item)}
                                  </span>
                                </div>
                                {Array.isArray(item.claimsByYear) && item.claimsByYear.some(c => c.hasClaim) && (
                                  <div className="mt-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-medium text-gray-600 mr-1">Claims (Year-wise):</span>
                                      {item.claimsByYear!
                                        .filter(c => c.hasClaim)
                                        .map((c) => (
                                          <span
                                            key={`${item.policy.id}-${c.year}`}
                                            title={`${c.year}: Claim taken${c.claimCount ? ` | ${c.claimCount} claims` : ''}${c.totalPaid ? ` | Paid ₹${c.totalPaid}` : ''}`}
                                            className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded-full border bg-red-100 text-red-800 border-red-200"
                                          >
                                            <span>{c.year}</span>
                                            <span className="ml-1">Claim</span>
                                          </span>
                                        ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Summary Statistics */}
          {/* {!loading && !error && history && history.transitionHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-medium text-blue-700">Total Policies</span>
                    </div>
                    <p className="text-lg font-semibold text-blue-900">
                      {history.transitionHistory.length + 1}
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <RefreshCw className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-medium text-green-700">Transitions</span>
                    </div>
                    <p className="text-lg font-semibold text-green-900">
                      {history.transitionHistory.length}
                    </p>
                  </div>
                </div>
                
                {/* Transition type breakdown */}
          {/* <div className="mt-4">
                  <h5 className="text-xs font-medium text-gray-700 mb-2">Transition Types:</h5>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(history.transitionHistory.map(item => item.transition_type))).map(type => {
                      const count = history.transitionHistory.filter(item => item.transition_type === type).length;
                      return (
                        <span key={type} className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${getTransitionBadgeColor(type)}`}>
                          {getTransitionIcon(type)}
                          {type} ({count})
                        </span>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card> */}
          {/* )} */}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PolicyHistorySheet;
