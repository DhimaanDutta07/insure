import React, { useState, useEffect } from "react";
import axios from "axios";
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

interface Client {
  id: string;
  name: string;
  phone: number | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  status: "Active" | "Inactive";
}

interface ClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client;
  onSave: (client: Client) => void;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  open,
  onOpenChange,
  client,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<Client>>({
    name: "",
    phone: 0,
    description: "",
    status: "Active",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        phone: client.phone || null,
        description: client.description || "",
        status: client.status,
      });
    } else {
      setFormData({ name: "", phone: 0, description: "", status: "Active" });
    }
  }, [client]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (value: "Active" | "Inactive") => {
    setFormData(prev => ({ ...prev, status: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const url = client?.id
        ? `${import.meta.env.VITE_BASE_URL}/api/v1/clients/${client.id}`
        : `${import.meta.env.VITE_BASE_URL}/api/v1/clients`;
      const method = client?.id ? "patch" : "post";
      const res = await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      onSave(res.data); // Backend should return full Client object
      onOpenChange(false);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("An error occurred");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white rounded-lg border border-gray-200 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-left">{client?.id ? "Update Client" : "Create Client"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="number"
              value={formData.phone || ''}
              onChange={(e) => {
                if (e.target.value.length <= 10) {
                  handleInputChange(e);
                }
              }}
              placeholder="Enter 10 digit phone number"
              className="w-full p-2 border rounded"
              pattern="[0-9]{10}"
              title="Please enter a valid 10 digit phone number"
              maxLength={10}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              value={formData.description || ""}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
            <Select value={formData.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-gray-300 text-gray-700 hover:bg-gray-100">
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
              {client?.id ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};