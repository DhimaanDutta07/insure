import React, { useState, useEffect } from "react";
import { createRevenue, updateRevenue } from "../services/revenue.service";
import { Revenue } from "../types/index";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
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

interface Reimbursement {
  id: string;
  name: string;
}

interface Site {
  id: string;
  name: string;
}

interface Client {
  id: string;
  name: string;
}

interface RevenueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revenue?: Revenue;
  reimbursements: Reimbursement[];
  sites: Site[];
  clients: Client[];
  onSave: (revenue: Revenue) => void;
}

export const RevenueModal: React.FC<RevenueModalProps> = ({
  open,
  onOpenChange,
  revenue,
  reimbursements,
  sites,
  clients,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<Revenue>>({
    reimbursementId: "",
    siteId: "",
    area: 0,
    month: "",
    clientId: "",
    amount: 0,
    camCharge: 0,
    gst: 0,
    lessTds: 0,
    receivable: 0,
    receivedInBank: 0,
    policyId: "",
    agentId: "",
    commissionId: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (revenue) {
      setFormData({
        reimbursementId: revenue.reimbursementId || "",
        siteId: revenue.siteId || "",
        area: revenue.area || 0,
        month: revenue.month || "",
        clientId: revenue.clientId || "",
        amount: revenue.amount || 0,
        camCharge: revenue.camCharge || 0,
        gst: revenue.gst || 0,
        lessTds: revenue.lessTds || 0,
        receivable: revenue.receivable || 0,
        receivedInBank: revenue.receivedInBank || 0,
        policyId: revenue.policyId || "",
        agentId: revenue.agentId || "",
        commissionId: revenue.commissionId || "",
      });
    } else {
      setFormData({
        reimbursementId: "",
        siteId: "",
        area: 0,
        month: "",
        clientId: "",
        amount: 0,
        camCharge: 0,
        gst: 0,
        lessTds: 0,
        receivable: 0,
        receivedInBank: 0,
        policyId: "",
        agentId: "",
        commissionId: "",
      });
    }
  }, [revenue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['area', 'amount', 'camCharge', 'gst', 'lessTds', 'receivable', 'receivedInBank'].includes(name) 
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
      // Ensure all required fields are present for the service
      const submitData = {
        reimbursementId: formData.reimbursementId || "",
        siteId: formData.siteId || "",
        area: formData.area || 0,
        month: formData.month || "",
        clientId: formData.clientId || "",
        amount: formData.amount || 0,
        camCharge: formData.camCharge || 0,
        gst: formData.gst || 0,
        lessTds: formData.lessTds || 0,
        receivable: formData.receivable || 0,
        receivedInBank: formData.receivedInBank || 0,
        policyId: formData.policyId || "",
        agentId: formData.agentId || "",
        commissionId: formData.commissionId || "",
      };
      
      let result: Revenue;
      if (revenue?.id) {
        result = await updateRevenue(revenue.id, submitData);
      } else {
        result = await createRevenue(submitData);
      }
      onSave(result);
      onOpenChange(false);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white rounded-lg border border-gray-300 shadow-lg p-5">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800 mb-6 text-left">
            {revenue?.id ? "Edit Revenue" : "New Revenue"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Reimbursement */}
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

            {/* Site */}
            <div>
              <Label htmlFor="siteId" className="block text-sm font-medium text-gray-700 mb-1">
                Site <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.siteId} 
                onValueChange={handleSelectChange("siteId")}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Area */}
            <div>
              <Label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">
                Area (sq. ft.) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="area"
                name="area"
                type="number"
                value={formData.area}
                onChange={handleInputChange}
                required
                className="w-full p-2 border rounded-md focus:ring-2 border-gray-300"
              />
            </div>

            {/* Month */}
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

            {/* Client */}
            <div>
              <Label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
                Client <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.clientId} 
                onValueChange={handleSelectChange("clientId")}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div>
              <Label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleInputChange}
                required
                className="w-full p-2 border rounded-md focus:ring-2 border-gray-300"
              />
            </div>

            {/* CAM Charge */}
            <div>
              <Label htmlFor="camCharge" className="block text-sm font-medium text-gray-700 mb-1">
                CAM Charge <span className="text-red-500">*</span>
              </Label>
              <Input
                id="camCharge"
                name="camCharge"
                type="number"
                value={formData.camCharge}
                onChange={handleInputChange}
                required
                className="w-full p-2 border rounded-md focus:ring-2 border-gray-300"
              />
            </div>

            {/* GST */}
            <div>
              <Label htmlFor="gst" className="block text-sm font-medium text-gray-700 mb-1">
                GST <span className="text-red-500">*</span>
              </Label>
              <Input
                id="gst"
                name="gst"
                type="number"
                value={formData.gst}
                onChange={handleInputChange}
                required
                className="w-full p-2 border rounded-md focus:ring-2 border-gray-300"
              />
            </div>

            {/* Less TDS */}
            <div>
              <Label htmlFor="lessTds" className="block text-sm font-medium text-gray-700 mb-1">
                Less TDS (10%) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lessTds"
                name="lessTds"
                type="number"
                value={formData.lessTds}
                onChange={handleInputChange}
                required
                className="w-full p-2 border rounded-md focus:ring-2 border-gray-300"
              />
            </div>

            {/* Receivable */}
            <div>
              <Label htmlFor="receivable" className="block text-sm font-medium text-gray-700 mb-1">
                Receivable <span className="text-red-500">*</span>
              </Label>
              <Input
                id="receivable"
                name="receivable"
                type="number"
                value={formData.receivable}
                onChange={handleInputChange}
                required
                className="w-full p-2 border rounded-md focus:ring-2 border-gray-300"
              />
            </div>

            {/* Received in Bank */}
            <div>
              <Label htmlFor="receivedInBank" className="block text-sm font-medium text-gray-700 mb-1">
                Recd in Bank <span className="text-red-500">*</span>
              </Label>
              <Input
                id="receivedInBank"
                name="receivedInBank"
                type="number"
                value={formData.receivedInBank}
                onChange={handleInputChange}
                required
                className="w-full p-2 border rounded-md focus:ring-2 border-gray-300"
              />
            </div>
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="hover:bg-gray-100 border-gray-300"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 text-white hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Submitting..."
                : revenue?.id
                ? "Update Revenue"
                : "Create Revenue"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};