import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import axios from "axios";
import PolicyEditForm from "../components/policy/PolicyEditForm";
import { Policy } from "../types/index";

export const PolicyEditPage: React.FC = () => {
  const { policyId } = useParams<{ policyId: string }>();
  const navigate = useNavigate();
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!policyId) {
      setError("Policy ID is required");
      setLoading(false);
      return;
    }

    const fetchPolicy = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem("authToken");
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/v1/policies/${policyId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data && response.data.success) {
          setPolicy(response.data.data);
        } else {
          setError("Failed to load policy");
        }
      } catch (err: unknown) {
        console.error("Error fetching policy:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to load policy";
        setError(errorMessage);
        toast.error("Failed to load policy");
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, [policyId]);

  const handleBack = () => {
    // if (policyId) {
    //   navigate(`/admin/policies/${policyId}`);
    // } else {
      navigate("/admin/all-policies");
    // }
  };

  const handleSubmit = () => {
    toast.success("Policy updated successfully");
    if (policyId) {
      navigate("/admin/all-policies");
    }
  };

  const handleCancel = () => {
    if (policyId) {
      navigate("/admin/all-policies");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg font-medium">Loading policy...</span>
        </div>
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || "Policy not found"}
          </h2>
          <p className="text-gray-600 mb-4">
            The policy you're looking for doesn't exist or you don't have permission to edit it.
          </p>
        </div>
        <Button
  variant="outline"
  onClick={handleBack}
  className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 hover:text-black shadow-sm transition-transform duration-200 hover:scale-105"
>
  <ArrowLeft className="h-4 w-4" />
</Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-6 pr-1 pt-5">
        <div className="flex items-center gap-4">

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Edit Policy
            </h1>
            {/* <p className="text-sm text-gray-600 ">
              {policy.policy_number}
            </p> */}
          </div>
 
        </div>
        <Button
  variant="outline"
  onClick={handleBack}
  className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 hover:text-black shadow-sm transition-transform duration-200 hover:scale-105"
>
  <ArrowLeft className="h-4 w-4" />
</Button>
      </div>

      {/* Policy Edit Form */}
      <PolicyEditForm
        policyId={policyId!}
        onSubmit={handleSubmit}
        onClose={handleCancel}
      />
    </div>
  );
}; 