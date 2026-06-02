import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface Revenue {
  id: string;
  reimbursementId: string;
  commissionId: string;
  area: number;
  month: string;
  agentId: string;
  amount: number;
  camCharge: number;
  gst: number;
  lessTds: number;
  receivable: number;
  receivedInBank: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  commission: { name: string };
  agent: { name: string };
  reimbursement: { name: string };
}

interface Reimbursement {
  id: string;
  name: string;
}

interface Commission {
  id: string;
  name: string;
  description?: string;
}

interface Agent {
  id: string;
  name: string;
  phone?: string;
  status: string;
}

interface RevenueFormProps {
  revenue?: Revenue;
  reimbursements: Reimbursement[];
  commissions: Commission[];
  agents: Agent[];
  onSave: (revenue: Revenue) => void;
  onCancel?: () => void; // Add onCancel prop
}

export const RevenueForm: React.FC<RevenueFormProps> = ({
  revenue,
  reimbursements,
  commissions,
  agents,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<Partial<Revenue>>({
    reimbursementId: "",
    commissionId: "",
    area: 0,
    month: new Date().toISOString().slice(0, 10) + "T00:00:00Z",
    agentId: "",
    amount: 0,
    camCharge: 0,
    gst: 0,
    lessTds: 0,
    receivable: 0,
    receivedInBank: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
  const initializeForm = async () => {
    await new Promise(resolve => setTimeout(resolve, 1));
    if (revenue) {
      setFormData({
        reimbursementId: revenue.reimbursementId,
        commissionId: revenue.commissionId,
        area: revenue.area,
        month: revenue.month,
        agentId: revenue.agentId,
        amount: revenue.amount,
        camCharge: revenue.camCharge,
        gst: revenue.gst,
        lessTds: revenue.lessTds,
        receivable: revenue.receivable,
        receivedInBank: revenue.receivedInBank,
      });
    } else {
      setFormData({
        reimbursementId: "",
        commissionId: "",
        area: 0,
        month: new Date().toISOString().slice(0, 10) + "T00:00:00Z",
        agentId: "",
        amount: 0,
        camCharge: 0,
        gst: 0,
        lessTds: 0,
        receivable: 0,
        receivedInBank: 0,
      });
    }
  };
  
  initializeForm();
}, [revenue]);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "area" || name === "amount" || name === "camCharge" || 
             name === "gst" || name === "lessTds" || name === "receivable" || 
             name === "receivedInBank"
        ? parseInt(value) || 0
        : value,
    }));
  };

  const handleSelectChange = (name: string) => (value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      formData.receivable = 
      (formData.amount ?? 0) + 
      (formData.camCharge ?? 0) + 
      (formData.gst ?? 0) - 
      (formData.lessTds ?? 0);
      const url = revenue?.id
        ? `${import.meta.env.VITE_BASE_URL}/api/v1/revenues/${revenue.id}`
        : `${import.meta.env.VITE_BASE_URL}/api/v1/revenues`;
      const method = revenue?.id ? "patch" : "post";
      const res = await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      onSave(res.data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        // setError(err.response.data.error);
        setError("Please fill in all required fields and try again.");
        setError("An error occurred while submitting. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto bg-white rounded-lg border border-gray-300 shadow-lg p-5">
      <h2 className="text-xl font-semibold text-gray-800 mb-6 text-left">
        {revenue?.id ? "Edit Revenue" : "New Revenue"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="reimbursementId" className="block text-sm font-medium text-gray-700 mb-1">
              Reimbursement <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={formData.reimbursementId} 
              onValueChange={handleSelectChange("reimbursementId")}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select reimbursement" />
              </SelectTrigger>
              <SelectContent>
                {reimbursements.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="commissionId" className="block text-sm font-medium text-gray-700 mb-1">
              Commission <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={formData.commissionId} 
              onValueChange={handleSelectChange("commissionId")}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select commission" />
              </SelectTrigger>
              <SelectContent>
                {commissions.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">
              Area (sq. ft.) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="area"
              name="area"
              type="number"
              min={0}
              value={formData.area || ""}
              placeholder="Enter area"
              onChange={handleInputChange}
              required
              className="w-full p-2 border rounded-md focus:ring-2 border-gray-300"
            />
          </div>
          <div>
            <Label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
              Month <span className="text-red-500">*</span>
            </Label>
            <Input
              id="month"
              name="month"
              type="date"
              value={formData.month?.slice(0, 10)}
              onChange={(e) => setFormData(prev => ({ ...prev, month: `${e.target.value}T00:00:00Z` }))}
              required
              className="w-full p-2 border rounded-md focus:ring-2 border-gray-300"
            />
          </div>
          <div>
            <Label htmlFor="agentId" className="block text-sm font-medium text-gray-700 mb-1">
              Agent <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={formData.agentId} 
              onValueChange={handleSelectChange("agentId")}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount <span className="text-red-500">*</span>
            </Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min={0}
              value={formData.amount || ""}
              placeholder="Enter amount"
              onChange={handleInputChange}
              required
              className="w-full p-2 border rounded-md focus:ring-2 border-gray-300"
            />
          </div>
          <div>
            <Label htmlFor="camCharge" className="block text-sm font-medium text-gray-700 mb-1">
              CAM Charge <span className="text-red-500">*</span>
            </Label>
            <Input
              id="camCharge"
              name="camCharge"
              type="number"
              min={0}
              value={formData.camCharge || ""}
              placeholder="Enter CAM charge"
              onChange={handleInputChange}
              required
              className="w-full p-2 border rounded-md focus:ring-2 border-gray-300"
            />
          </div>
          <div>
            <Label htmlFor="gst" className="block text-sm font-medium text-gray-700 mb-1">
              GST <span className="text-red-500">*</span>
            </Label>
            <Input
              id="gst"
              name="gst"
              type="number"
              min={0}
              value={formData.gst || ""}
              placeholder="Enter GST"
              onChange={handleInputChange}
              required
              className="w-full p-2 border rounded-md focus:ring-2 border-gray-300"
            />
          </div>
          <div>
            <Label htmlFor="lessTds" className="block text-sm font-medium text-gray-700 mb-1">
              Less TDS <span className="text-red-500">*</span>
            </Label>
            <Input
              id="lessTds"
              name="lessTds"
              type="number"
              min={0}
              value={formData.lessTds || ""}
              placeholder="Enter TDS"
              onChange={handleInputChange}
              required
              className="w-full p-2 border rounded-md focus:ring-2 border-gray-300"
            />
          </div>
          <div>
            <Label htmlFor="receivedInBank" className="block text-sm font-medium text-gray-700 mb-1">
              Received in Bank <span className="text-red-500">*</span>
            </Label>
            <Input
              id="receivedInBank"
              name="receivedInBank"
              type="number"
              min={0}
              value={formData.receivedInBank || ""}
              placeholder="Enter received amount"
              onChange={handleInputChange}
              required
              className="w-full p-2 border rounded-md focus:ring-2 border-gray-300"
            />
          </div>
        </div>
        
        {error && (
          <div className="text-red-500 text-sm mt-2">{error}</div>
        )}
        
        <div className="flex justify-end space-x-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : (revenue?.id ? "Update" : "Create")}
          </Button>
        </div>
      </form>
    </div>
  );
};