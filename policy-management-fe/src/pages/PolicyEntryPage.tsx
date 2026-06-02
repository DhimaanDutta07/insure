import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import PolicyForm from "../components/policy/PolicyForm";

export const PolicyEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);

  const handleBack = () => navigate("/admin/all-policies");

  const handleSubmit = async () => {
    // PolicyForm already handles submission.
    // Keep this handler for compatibility with PolicyForm's onSubmit prop.
    toast.success("Policy created successfully");
    navigate("/admin/all-policies");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    // Bulk import API wiring is not present in this frontend yet.
    // Avoid calling a missing service and clearly inform the user.
    toast.error("Bulk import not configured yet.");
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Add Policy (Manual / Bulk)</h1>
        <Button variant="outline" onClick={handleBack} className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 hover:text-black shadow-sm transition-transform duration-200 hover:scale-105">
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Manual entry form */}
      <PolicyForm onSubmit={handleSubmit} onClose={handleBack} />

      <hr className="my-6" />

      {/* Bulk upload */}
      <div className="mt-4">
        <label className="block font-medium mb-2">Upload Excel / CSV file</label>
        <input type="file" accept=".xlsx,.csv" onChange={handleFileChange} className="border rounded p-2 w-full" />
        <Button className="mt-2" onClick={handleUpload}>Import Policies</Button>
      </div>
    </div>
  );
};
