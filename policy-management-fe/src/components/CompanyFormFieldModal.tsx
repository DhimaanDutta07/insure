import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Company } from "../services/company.service";

interface CompanyFormField {
  id: string;
  company_id: string;
  label: string;
  field_type: string;
  is_required: boolean;
  order: number;
  company?: Company;
}

interface CreateCompanyFormFieldRequest {
  company_id: string;
  label: string;
  field_type: string;
  is_required: boolean;
  order: number;
}

interface CompanyFormFieldModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateCompanyFormFieldRequest) => void;
  formField?: CompanyFormField;
  companies: Company[];
  isSaving: boolean;
}

const fieldTypes = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" },
  { value: "date", label: "Date" },
  { value: "select", label: "Select" },
  { value: "textarea", label: "Textarea" },
  { value: "checkbox", label: "Checkbox" },
  { value: "radio", label: "Radio" },
];

export const CompanyFormFieldModal: React.FC<CompanyFormFieldModalProps> = ({
  open,
  onClose,
  onSave,
  formField,
  companies,
  isSaving,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateCompanyFormFieldRequest>();

  useEffect(() => {
    if (formField) {
      reset({
        company_id: formField.company_id,
        label: formField.label,
        field_type: formField.field_type,
        is_required: formField.is_required,
        order: formField.order,
      });
    } else {
      reset({
        company_id: "",
        label: "",
        field_type: "text",
        is_required: false,
        order: 1,
      });
    }
  }, [formField, reset]);

  const onSubmit = (data: CreateCompanyFormFieldRequest) => {
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
            {formField ? "Update Form Field" : "Create Form Field"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="company_id">Company <span className="text-red-500">*</span></Label>
            <Select
              value={watch("company_id")}
              onValueChange={(value) => setValue("company_id", value)}
              disabled={isSaving}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.company_id && (
              <p className="text-red-600 text-sm mt-1">{errors.company_id.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="label">Label <span className="text-red-500">*</span></Label>
            <Input
              id="label"
              {...register("label", { required: "Label is required" })}
              placeholder="Enter field label"
              disabled={isSaving}
              className="w-full p-2 border rounded"
            />
            {errors.label && (
              <p className="text-red-600 text-sm mt-1">{errors.label.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="field_type">Field Type <span className="text-red-500">*</span></Label>
            <Select
              value={watch("field_type")}
              onValueChange={(value) => setValue("field_type", value)}
              disabled={isSaving}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select field type" />
              </SelectTrigger>
              <SelectContent>
                {fieldTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.field_type && (
              <p className="text-red-600 text-sm mt-1">{errors.field_type.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="order">Order <span className="text-red-500">*</span></Label>
            <Input
              id="order"
              type="number"
              {...register("order", { 
                required: "Order is required",
                valueAsNumber: true,
                min: { value: 1, message: "Order must be at least 1" }
              })}
              placeholder="Enter display order"
              disabled={isSaving}
              className="w-full p-2 border rounded"
            />
            {errors.order && (
              <p className="text-red-600 text-sm mt-1">{errors.order.message}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_required"
              checked={watch("is_required")}
              onCheckedChange={(checked) => setValue("is_required", !!checked)}
              disabled={isSaving}
            />
            <Label htmlFor="is_required">Required</Label>
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
              {isSaving ? (formField ? "Updating..." : "Creating...") : formField ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 