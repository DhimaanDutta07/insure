import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { PolicyType, CreatePolicyTypeRequest } from "../services/policyType.service";

interface PolicyTypeModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreatePolicyTypeRequest) => void;
  policyType?: PolicyType;
  isSaving: boolean;
}

export const PolicyTypeModal: React.FC<PolicyTypeModalProps> = ({
  open,
  onClose,
  onSave,
  policyType,
  isSaving,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePolicyTypeRequest>();

  useEffect(() => {
    if (policyType) {
      reset({
        name: policyType.name,
      });
    } else {
      reset({
        name: "",
      });
    }
  }, [policyType, reset]);

  const onSubmit = (data: CreatePolicyTypeRequest) => {
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
            {policyType ? "Update Policy Type" : "Create Policy Type"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              {...register("name", { required: "Policy type name is required" })}
              placeholder="Enter policy type name"
              disabled={isSaving}
              className="w-full p-2 border rounded"
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
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
              {isSaving ? (policyType ? "Updating..." : "Creating...") : policyType ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 