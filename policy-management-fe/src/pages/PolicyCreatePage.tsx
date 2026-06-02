import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import PolicyForm from "../components/policy/PolicyForm";

export const PolicyCreatePage: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/admin/all-policies");
  };

  const handleSubmit = () => {
    toast.success("Policy created successfully");
    navigate("/admin/all-policies");
  };

  const handleCancel = () => {
    navigate("/admin/all-policies");
  };

  return (
    <div>
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-6 pr-1 pt-5">
        <div className="flex items-center gap-4">

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Create New Policy
            </h1>
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

      {/* Policy Create Form */}
      <PolicyForm
        onSubmit={handleSubmit}
        onClose={handleCancel}
      />
    </div>
  );
}; 