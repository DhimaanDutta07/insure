import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Company, CreateCompanyRequest } from "../services/company.service";

interface CompanyModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateCompanyRequest) => void;
  company?: Company;
  isSaving: boolean;
}

export const CompanyModal: React.FC<CompanyModalProps> = ({
  open,
  onClose,
  onSave,
  company,
  isSaving,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateCompanyRequest>();

  useEffect(() => {
    if (company) {
      reset({
        name: company.name,
        category: company.category,
      });
    } else {
      reset({
        name: "",
        category: "HEALTH",
      });
    }
  }, [company, reset]);

  const onSubmit = (data: CreateCompanyRequest) => {
    onSave(data);
  };

  const handleClose = () => {
    if (!isSaving) {
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-white rounded-lg border border-gray-200 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-left">
            {company ? "Update Company" : "Create Company"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              {...register("name", { required: "Company name is required" })}
              placeholder="Enter company name"
              disabled={isSaving}
              className="w-full p-2 border rounded"
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
            <Select
              value={watch("category")}
              onValueChange={(value: "HEALTH" | "LIFE") => setValue("category", value)}
              disabled={isSaving}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HEALTH">Health</SelectItem>
                <SelectItem value="LIFE">Life</SelectItem>
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-red-600 text-sm mt-1">{errors.category.message}</p>
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose} 
              className="border-gray-300 text-gray-700 hover:bg-gray-100" 
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 text-white hover:bg-blue-700" 
              disabled={isSaving}
            >
              {isSaving ? (company ? "Updating..." : "Creating...") : company ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 