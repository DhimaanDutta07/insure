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
  Edit2,
  X,
  Save,
  Plus,
  Download,
  File,
  RotateCcw,
} from "lucide-react";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  PolicyTransitionService,
  PolicyTransitionHistory,
} from "../../services/policyTransition.service";
import type { Policy } from "../../types/index";
import { useAuth } from "../../Context/AuthContext";
import axios from 'axios';

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
  const { role } = useAuth();
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<PolicyTransitionHistory | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin or operations
  const isAdmin = role?.role_name?.toUpperCase() === 'ADMIN';
  const isOperations = role?.role_name?.toUpperCase() === 'OPERATIONS';
  const canEdit = isAdmin || isOperations;

  // Edit mode state
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{
    policy_creation_status: string;
    premium_amount: number;
    sum_insured: number;
    deductible_amount: number | null;
    start_date: string;
    end_date: string;
    insured_members?: any[];
  } | null>(null);
  const [saving, setSaving] = useState(false);

  // Document upload state for edit mode
  const [editUploadedFiles, setEditUploadedFiles] = useState<File[]>([]);

  // Deletion loading state
  const [deletingPolicyId, setDeletingPolicyId] = useState<string | null>(null);

  const API_BASE_URL = (import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '');

  const handleEdit = (item: any) => {
    setEditingPolicyId(item.policy.id);
    setEditFormData({
      policy_creation_status: item.policy.policy_creation_status || 'Fresh',
      premium_amount: item.policy.premium_amount,
      sum_insured: item.policy.sum_insured,
      deductible_amount: item.policy.deductible_amount || null,
      start_date: item.policy.start_date ? new Date(item.policy.start_date).toISOString().split('T')[0] : '',
      end_date: item.policy.end_date ? new Date(item.policy.end_date).toISOString().split('T')[0] : '',
      insured_members: item.policy.proposer?.insured_members || [],
    });
    setEditUploadedFiles([]);
  };

  const handleCancelEdit = () => {
    setEditingPolicyId(null);
    setEditFormData(null);
    setEditUploadedFiles([]);
  };

  const handleSaveEdit = async () => {
    if (!editFormData || !editingPolicyId) return;

    setSaving(true);
    try {
      // Filter out incomplete members (only include members with at least a name)
      const validMembers = editFormData.insured_members?.filter(
        (member: any) => member.name && member.name.trim() !== ''
      ) || [];

      // Create FormData if there are files to upload
      let payload: any = { ...editFormData, insured_members: validMembers };
      let headers: any = {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      };

      if (editUploadedFiles.length > 0) {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (key === 'insured_members') {
            formData.append(key, JSON.stringify(value));
          } else if (value !== undefined && value !== null && value !== '') {
            formData.append(key, String(value));
          }
        });
        editUploadedFiles.forEach((file) => {
          formData.append('documents', file);
        });
        payload = formData;
      } else {
        headers['Content-Type'] = 'application/json';
      }

      const response = await axios.patch(
        `${API_BASE_URL}/api/v1/policies/${editingPolicyId}`,
        payload,
        { headers }
      );

      if (response.status === 200) {
        toast.success('Policy updated successfully. Commission recalculated automatically.');
        handleCancelEdit();
        fetchHistory(); // Refresh history to show updated commission
      } else {
        toast.error('Failed to update policy');
      }
    } catch (error: any) {
      console.error('Error updating policy:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error response:', error.response?.data);
        console.error('Axios error status:', error.response?.status);
        console.error('Axios error config:', error.config);
      }
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.response?.data?.details || 'Failed to update policy';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`Are you sure you want to delete this policy term ${item.policy.policy_number}? This will only delete this term, not the entire policy chain.`)) {
      return;
    }

    setDeletingPolicyId(item.policy.id);
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/v1/policies/${item.policy.id}/term`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );

      if (response.status === 200) {
        toast.success('Policy term deleted successfully.');
        fetchHistory(); // Refresh history
      } else {
        toast.error('Failed to delete policy');
      }
    } catch (error: any) {
      console.error('Error deleting policy:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to delete policy';
      toast.error(errorMessage);
    } finally {
      setDeletingPolicyId(null);
    }
  };

  const handleRollback = async (item: any) => {
    const hasParent = item.policy.parent_policy_id || item.relationship === 'CHILD';
    const message = hasParent
      ? `Are you sure you want to rollback to the previous policy term? This will delete the current term ${item.policy.policy_number} and restore the previous term.`
      : `Are you sure you want to delete this policy? This will remove the entire policy as there is no previous term to rollback to.`;

    if (!confirm(message)) {
      return;
    }

    setDeletingPolicyId(item.policy.id);
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/v1/policies/${item.policy.id}/term`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );

      if (response.status === 200) {
        toast.success(hasParent ? 'Rolled back to previous policy term successfully.' : 'Policy deleted successfully.');
        fetchHistory(); // Refresh history
      } else {
        toast.error('Failed to rollback');
      }
    } catch (error: any) {
      console.error('Error rolling back:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to rollback';
      toast.error(errorMessage);
    } finally {
      setDeletingPolicyId(null);
    }
  };

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
                                  {canEdit && (
                                    <Button
                                      onClick={() => handleEdit(item)}
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </Button>
                                  )}
                                  {isAdmin && item.relationship === 'CURRENT' && (
                                    <Button
                                      onClick={() => handleRollback(item)}
                                      disabled={deletingPolicyId === item.policy.id}
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                      title="Rollback to previous term"
                                    >
                                      {deletingPolicyId === item.policy.id ? (
                                        <div className="w-3 h-3 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                                      ) : (
                                        <RotateCcw className="w-3 h-3" />
                                      )}
                                    </Button>
                                  )}
                                  {isAdmin && item.relationship !== 'CURRENT' && (
                                    <Button
                                      onClick={() => handleDelete(item)}
                                      disabled={deletingPolicyId === item.policy.id}
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      {deletingPolicyId === item.policy.id ? (
                                        <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                      ) : (
                                        <X className="w-3 h-3" />
                                      )}
                                    </Button>
                                  )}
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
                                {editingPolicyId === item.policy.id && editFormData ? (
                                  <>
                                    <div className="col-span-2">
                                      <Label className="text-xs font-medium text-gray-600">Status</Label>
                                      <select
                                        value={editFormData.policy_creation_status}
                                        onChange={(e) => setEditFormData({...editFormData, policy_creation_status: e.target.value})}
                                        className="w-full mt-1 px-2 py-1 text-xs border rounded"
                                      >
                                        <option value="Fresh">Fresh</option>
                                        <option value="Renewal">Renewal</option>
                                        <option value="Migration">Migration</option>
                                        <option value="Portablity">Portability</option>
                                      </select>
                                    </div>
                                    <div>
                                      <Label className="text-xs font-medium text-gray-600">Premium</Label>
                                      <Input
                                        type="number"
                                        value={editFormData.premium_amount || ''}
                                        onChange={(e) => setEditFormData({...editFormData, premium_amount: Number(e.target.value)})}
                                        className="mt-1 h-7 text-xs"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs font-medium text-gray-600">Sum Insured</Label>
                                      <Input
                                        type="number"
                                        value={editFormData.sum_insured || ''}
                                        onChange={(e) => setEditFormData({...editFormData, sum_insured: Number(e.target.value)})}
                                        className="mt-1 h-7 text-xs"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs font-medium text-gray-600">Deductible Amount</Label>
                                      <Input
                                        type="number"
                                        value={editFormData.deductible_amount || ''}
                                        onChange={(e) => setEditFormData({...editFormData, deductible_amount: e.target.value ? Number(e.target.value) : null})}
                                        className="mt-1 h-7 text-xs"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs font-medium text-gray-600">Start Date</Label>
                                      <Input
                                        type="date"
                                        value={editFormData.start_date}
                                        onChange={(e) => setEditFormData({...editFormData, start_date: e.target.value})}
                                        className="mt-1 h-7 text-xs"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs font-medium text-gray-600">End Date</Label>
                                      <Input
                                        type="date"
                                        value={editFormData.end_date}
                                        onChange={(e) => setEditFormData({...editFormData, end_date: e.target.value})}
                                        className="mt-1 h-7 text-xs"
                                      />
                                    </div>
                                    <div className="col-span-2 flex gap-2 mt-2">
                                      <Button
                                        onClick={handleSaveEdit}
                                        disabled={saving}
                                        size="sm"
                                        className="text-xs h-7"
                                      >
                                        <Save className="w-3 h-3 mr-1" />
                                        {saving ? 'Saving...' : 'Save'}
                                      </Button>
                                      <Button
                                        onClick={handleCancelEdit}
                                        variant="outline"
                                        size="sm"
                                        className="text-xs h-7"
                                      >
                                        <X className="w-3 h-3 mr-1" />
                                        Cancel
                                      </Button>
                                    </div>
                                    <div className="col-span-2 mt-3 pt-3 border-t border-gray-200">
                                      <Label className="text-xs font-medium text-gray-600">Upload Documents</Label>
                                      <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-3 bg-gray-50">
                                        <input
                                          type="file"
                                          id="edit-document-upload"
                                          multiple
                                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx,.xls,.csv"
                                          onChange={(e) => {
                                            const files = Array.from(e.target.files || []);
                                            setEditUploadedFiles([...editUploadedFiles, ...files]);
                                          }}
                                          className="hidden"
                                        />
                                        <label
                                          htmlFor="edit-document-upload"
                                          className="flex flex-col items-center justify-center cursor-pointer"
                                        >
                                          <Plus className="w-6 h-6 text-gray-400 mb-1" />
                                          <p className="text-xs text-gray-600">Click to upload documents</p>
                                        </label>
                                      </div>
                                      {editUploadedFiles.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                          {editUploadedFiles.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between p-1 bg-white border border-gray-200 rounded text-xs">
                                              <span className="text-gray-700">{file.name}</span>
                                              <Button
                                                type="button"
                                                onClick={() => {
                                                  setEditUploadedFiles(editUploadedFiles.filter((_, i) => i !== index));
                                                }}
                                                size="sm"
                                                variant="ghost"
                                                className="h-5 w-5 p-0 text-red-600"
                                              >
                                                <X className="w-2 h-2" />
                                              </Button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <div className="col-span-2 mt-3 pt-3 border-t border-gray-200">
                                      <div className="flex justify-between items-center mb-2">
                                        <Label className="text-xs font-medium text-gray-600">Members ({editFormData.insured_members?.length || 0})</Label>
                                        <Button
                                          type="button"
                                          onClick={() => {
                                            setEditFormData({
                                              ...editFormData,
                                              insured_members: [...(editFormData.insured_members || []), {
                                                name: '',
                                                relation_to_proposer: 'Self',
                                                date_of_birth: '',
                                                gender: 'Male',
                                              }]
                                            });
                                          }}
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 text-xs"
                                        >
                                          <Plus className="w-3 h-3 mr-1" />
                                          Add Member
                                        </Button>
                                      </div>
                                      {editFormData.insured_members && editFormData.insured_members.length > 0 && (
                                        <div className="space-y-3 max-h-60 overflow-y-auto">
                                          {editFormData.insured_members.map((member: any, mIndex: number) => (
                                            <div key={mIndex} className="p-3 bg-gray-50 rounded border border-gray-200">
                                              <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-medium text-gray-700">Member {mIndex + 1}</span>
                                                <Button
                                                  type="button"
                                                  onClick={() => {
                                                    setEditFormData({
                                                      ...editFormData,
                                                      insured_members: editFormData.insured_members!.filter((_, i) => i !== mIndex)
                                                    });
                                                  }}
                                                  size="sm"
                                                  variant="ghost"
                                                  className="h-6 w-6 p-0 text-red-600"
                                                >
                                                  <X className="w-3 h-3" />
                                                </Button>
                                              </div>
                                              <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                  <Label className="text-[10px] font-medium text-gray-600">Name *</Label>
                                                  <Input
                                                    value={member.name || ''}
                                                    onChange={(e) => {
                                                      const updated = [...editFormData.insured_members!];
                                                      updated[mIndex].name = e.target.value;
                                                      setEditFormData({ ...editFormData, insured_members: updated });
                                                    }}
                                                    placeholder="Full Name"
                                                    className="h-6 text-xs mt-1"
                                                  />
                                                </div>
                                                <div>
                                                  <Label className="text-[10px] font-medium text-gray-600">Relation *</Label>
                                                  <select
                                                    value={member.relation_to_proposer || 'Self'}
                                                    onChange={(e) => {
                                                      const updated = [...editFormData.insured_members!];
                                                      updated[mIndex].relation_to_proposer = e.target.value;
                                                      setEditFormData({ ...editFormData, insured_members: updated });
                                                    }}
                                                    className="w-full mt-1 px-2 py-1 text-xs border rounded h-6"
                                                  >
                                                    <option value="Self">Self</option>
                                                    <option value="Spouse">Spouse</option>
                                                    <option value="Child">Child</option>
                                                    <option value="Parent">Parent</option>
                                                    <option value="Sibling">Sibling</option>
                                                    <option value="Other">Other</option>
                                                  </select>
                                                </div>
                                                <div>
                                                  <Label className="text-[10px] font-medium text-gray-600">Date of Birth</Label>
                                                  <Input
                                                    type="date"
                                                    value={member.date_of_birth ? new Date(member.date_of_birth).toISOString().split('T')[0] : ''}
                                                    onChange={(e) => {
                                                      const updated = [...editFormData.insured_members!];
                                                      updated[mIndex].date_of_birth = e.target.value;
                                                      setEditFormData({ ...editFormData, insured_members: updated });
                                                    }}
                                                    className="h-6 text-xs mt-1"
                                                  />
                                                </div>
                                                <div>
                                                  <Label className="text-[10px] font-medium text-gray-600">Gender</Label>
                                                  <select
                                                    value={member.gender || 'Male'}
                                                    onChange={(e) => {
                                                      const updated = [...editFormData.insured_members!];
                                                      updated[mIndex].gender = e.target.value;
                                                      setEditFormData({ ...editFormData, insured_members: updated });
                                                    }}
                                                    className="w-full mt-1 px-2 py-1 text-xs border rounded h-6"
                                                  >
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                    <option value="Other">Other</option>
                                                  </select>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <>
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
                                  </>
                                )}

                                {/* Documents Section */}
                                {item.policy.documents && item.policy.documents.length > 0 && (
                                  <div className="col-span-2 mt-3 pt-3 border-t border-gray-200">
                                    <div className="flex items-center gap-2 mb-2">
                                      <File className="w-3 h-3 text-gray-600" />
                                      <span className="text-xs font-medium text-gray-600">
                                        Documents ({item.policy.documents.length})
                                      </span>
                                    </div>
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                      {item.policy.documents.map((doc: any) => (
                                        <div
                                          key={doc.id}
                                          className="flex items-center justify-between p-1.5 bg-white border border-gray-200 rounded text-xs hover:bg-gray-50"
                                        >
                                          <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <FileText className="w-3 h-3 text-gray-500 flex-shrink-0" />
                                            <span className="text-gray-700 truncate">
                                              {doc.original_name || doc.file_name}
                                            </span>
                                          </div>
                                          <Button
                                            onClick={() => {
                                              const API_BASE_URL = (import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '');
                                              const docUrl = `${API_BASE_URL}/api/v1/uploads/policy-documents/${doc.file_name}`;
                                              window.open(docUrl, '_blank');
                                            }}
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 w-5 p-0 text-blue-600 hover:text-blue-700"
                                            title="Download document"
                                          >
                                            <Download className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {isAdmin && item.commission && (
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
