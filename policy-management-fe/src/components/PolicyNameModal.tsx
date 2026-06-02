import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { PolicyName, CreatePolicyNameRequest } from "../services/policyName.service";
import { PolicyGroup } from "../types/index";

interface PolicyNameModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreatePolicyNameRequest & { policy_group_id: string }) => void;
  policyName?: PolicyName;
  policyGroups: PolicyGroup[];
  isSaving: boolean;
}

export const PolicyNameModal: React.FC<PolicyNameModalProps> = ({
  open,
  onClose,
  onSave,
  policyName,
  policyGroups,
  isSaving,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreatePolicyNameRequest & { policy_group_id: string }>();

  useEffect(() => {
    if (policyName) {
      reset({
        name: policyName.name || "",
        description: policyName.description || "",
        policy_group_id: policyName.policy_group_id || "",
      });
    } else {
      reset({
        name: "",
        description: "",
        policy_group_id: "",
      });
    }
  }, [policyName, reset]);

  const onSubmit = (data: CreatePolicyNameRequest & { policy_group_id: string }) => {
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
            {policyName ? "Update Policy Name" : "Create Policy Name"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              {...register("name", { required: "Policy name is required" })}
              placeholder="Enter policy name"
              disabled={isSaving}
              className="w-full p-2 border rounded"
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="policy_group_id">Policy Group <span className="text-red-500">*</span></Label>
            <Select
              value={watch("policy_group_id")}
              onValueChange={(value) => setValue("policy_group_id", value)}
              disabled={isSaving}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select policy group" />
              </SelectTrigger>
              <SelectContent>
                {policyGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.policy_group_id && (
              <p className="text-red-600 text-sm mt-1">{errors.policy_group_id.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Enter description (optional)"
              disabled={isSaving}
              className="w-full p-2 border rounded resize-none"
            />
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
              {isSaving ? (policyName ? "Updating..." : "Creating...") : policyName ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 