import React, { useState } from "react";
import { useForm, useFieldArray, SubmitHandler, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Plus, X } from "lucide-react";
import { createClaim } from "../../services/claim.service";
import { InsuredMember } from "../../types/claim";
import { toast } from "sonner";
import { z } from "zod";

// Schema for form validation (same as before)
const claimFormSchema = z.object({
  policy_id: z.string(),
  claimant_type: z.enum(['SELF', 'INSURED_MEMBER']),
  claim_amount: z.number().positive(),
  claim_remarks: z.string().optional(),
  claim_type: z.enum(['HOSPITALIZATION', 'DAYCARE', 'PREPOST', 'CASHLESS', 'HEALTH_CHECKUP', 'OTHER']),
  claim_date: z.date().optional(),
  is_full_claim: z.boolean(),
  claim_status: z.enum(['Pending', 'Approved', 'Rejected', 'Paid']).optional(),
  approved_by: z.string().optional(),
  approved_at: z.date().optional(),
  rejection_reason: z.string().optional(),
  members: z.array(z.object({
    insured_member_id: z.string().min(1, "Member is required"),
    member_claim_amount: z.number().positive().optional(),
    member_remarks: z.string().optional(),
  })).optional(),
}).refine((data) => {
  if (data.claim_status === 'Rejected' && !data.rejection_reason) {
    return false;
  }
  return true;
}, {
  message: "Rejection reason is required when status is Rejected",
  path: ["rejection_reason"],
}).refine((data) => {
  if ((data.claim_status === 'Approved' || data.claim_status === 'Rejected') && !data.approved_by) {
    return false;
  }
  return true;
}, {
  message: "Approver name is required when status is Approved or Rejected",
  path: ["approved_by"],
}).refine((data) => {
  // If claimant type is INSURED_MEMBER, members array must have at least one valid member
  if (data.claimant_type === 'INSURED_MEMBER') {
    return data.members && data.members.length > 0 && data.members.every(member => member.insured_member_id && member.insured_member_id.trim() !== '');
  }
  return true;
}, {
  message: "At least one insured member must be selected",
  path: ["members"],
});

type ClaimFormData = z.infer<typeof claimFormSchema>;

interface ClaimFormProps {
  policyId: string;
  insuredMembers: InsuredMember[];
  onSuccess: () => void;
  onCancel: () => void;
}

export const ClaimForm: React.FC<ClaimFormProps> = ({ 
  policyId, 
  insuredMembers, 
  onSuccess, 
  onCancel 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Debug logging for insured members
  console.log('🔍 [ClaimForm] Received insured members:', {
    policyId,
    insuredMembersCount: insuredMembers?.length || 0,
    insuredMembers: insuredMembers
  });

  // Log when insured members change
  React.useEffect(() => {
    console.log('🔍 [ClaimForm] Insured members updated:', {
      policyId,
      insuredMembersCount: insuredMembers?.length || 0,
      insuredMembers: insuredMembers
    });
  }, [insuredMembers, policyId]);

  const form = useForm<ClaimFormData>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      policy_id: policyId,
      claimant_type: 'SELF',
      claim_amount: 0,
      claim_type: 'HOSPITALIZATION',
      is_full_claim: false,
      claim_date: undefined,
      claim_status: undefined,
      approved_by: '',
      approved_at: undefined,
      rejection_reason: '',
      members: [],
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "members",
  });

  const claimantType = useWatch({
    control: form.control,
    name: "claimant_type",
  });

  React.useEffect(() => {
    if (claimantType === 'INSURED_MEMBER' && fields.length === 0) {
      append({ insured_member_id: '', member_claim_amount: 0, member_remarks: '' });
    } else if (claimantType === 'SELF' && fields.length > 0) {
      // Clear all member fields when switching back to SELF
      fields.forEach((_, index) => remove(index));
    }
  }, [claimantType, fields.length, append, remove, fields]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
    }
  };

  const onSubmit: SubmitHandler<ClaimFormData> = async (data) => {
    try {
      setIsSubmitting(true);
      const submitData = {
        ...data,
        claim_date: data.claim_date ? data.claim_date.toISOString() : undefined,
        approved_at: data.approved_at ? data.approved_at.toISOString() : undefined,
        claim_status: data.claim_status || undefined,
        approved_by: data.approved_by || undefined,
        rejection_reason: data.rejection_reason || undefined,
        members: data.claimant_type === 'SELF' ? undefined : data.members,
      };
      await createClaim(policyId, submitData, selectedFiles);
      onSuccess();
      toast.success("Claim created successfully");
    } catch (error) {
      console.error('Error creating claim:', error);
      toast.error("Failed to create claim");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border border-gray-100 shadow-sm bg-white">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-base font-semibold">Create New Claim</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-2">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                     {/* Claimant Type Selection */}
           <div>
            <label className="block text-xs font-medium mb-1">Applicant</label>
             <Controller
               name="claimant_type"
               control={form.control}
               render={({ field }) => (
                 <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-8 text-xs">
                     <SelectValue placeholder="Select claimant type" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="SELF">Self (Proposer)</SelectItem>
                     <SelectItem value="INSURED_MEMBER">Insured Member</SelectItem>
                   </SelectContent>
                 </Select>
               )}
             />
           </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
             <div>
              <label className="block text-xs font-medium mb-1">Claim Type</label>
               <Controller
                 name="claim_type"
                 control={form.control}
                 render={({ field }) => (
                   <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-8 text-xs">
                       <SelectValue placeholder="Select claim type" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="HOSPITALIZATION">Hospitalization</SelectItem>
                       <SelectItem value="DAYCARE">Daycare</SelectItem>
                       <SelectItem value="PREPOST">Prepost</SelectItem>
                       <SelectItem value="CASHLESS">Cashless</SelectItem>
                       <SelectItem value="HEALTH_CHECKUP">Health Checkup</SelectItem>
                       <SelectItem value="OTHER">Other</SelectItem>
                     </SelectContent>
                   </Select>
                 )}
               />
             </div>
            <div>
              <label className="block text-xs font-medium mb-1">Total Amount</label>
              <Input 
                type="number" 
                {...form.register("claim_amount", { valueAsNumber: true })} 
                placeholder="Enter amount"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Claim Date</label>
              <Input 
                type="date"
                min={new Date(1900, 0, 1).toISOString().split('T')[0]}
                max={new Date().toISOString().split('T')[0]}
                {...form.register("claim_date", {
                  setValueAs: (value) => value ? new Date(value) : undefined
                })}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Full Claim Toggle */}
          <div>
            <label className="flex items-center space-x-2 text-xs">
              <input
                type="checkbox"
                {...form.register("is_full_claim")}
                className="rounded border-gray-300 h-4 w-4"
              />
              <span>This is a full claim</span>
            </label>
          </div>

          {/* Members Selection */}
          {claimantType === "INSURED_MEMBER" && (
            <div>
              <label className="block text-xs font-medium mb-1">Insured Members</label>
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 mb-2 p-2 border rounded">
                  <div className="flex-1 min-w-0">
                    <label className="block text-[10px] text-gray-500 mb-0.5">Member</label>
                   <Controller
                     name={`members.${index}.insured_member_id`}
                     control={form.control}
                     render={({ field }) => (
                       <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="h-8 text-xs">
                           <SelectValue placeholder="Select member" />
                         </SelectTrigger>
                         <SelectContent>
                           {insuredMembers.map((member) => (
                             <SelectItem key={member.id} value={member.id}>
                               {member.name} ({member.relation_to_proposer})
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     )}
                   />
                 </div>
                  <div className="w-28">
                    <label className="block text-[10px] text-gray-500 mb-0.5">Amount</label>
                  <Input 
                    type="number"
                    placeholder="Amount"
                    {...form.register(`members.${index}.member_claim_amount`, { valueAsNumber: true })}
                      className="h-8 text-xs"
                  />
                </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-[10px] text-gray-500 mb-0.5">Remarks</label>
                  <Input 
                      placeholder="Remarks"
                    {...form.register(`members.${index}.member_remarks`)}
                      className="h-8 text-xs"
                  />
                </div>
                {fields.length > 1 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                      size="icon"
                    onClick={() => remove(index)}
                      className="mt-5 h-6 w-6 p-0"
                  >
                      <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
            <Button 
              type="button" 
                variant="ghost"
                size="sm"
              onClick={() => append({ insured_member_id: '', member_claim_amount: 0, member_remarks: '' })}
                className="text-xs mt-1"
            >
                <Plus className="w-3 h-3 mr-1" />
                Add Member
            </Button>
          </div>
          )}

          {/* Claim Remarks */}
          <div>
            <label className="block text-xs font-medium mb-1">Claim Remarks</label>
            <Textarea {...form.register("claim_remarks")} placeholder="Remarks" className="text-xs min-h-[36px]" />
          </div>

          {/* Approval Workflow */}
          {/* <div className=" pt-2 border-t border-gray-300">
            <h3 className="text-xs font-semibold mb-2">Approval Workflow</h3>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="block text-xs font-medium mb-1">Status</label>
                <Controller
                  name="claim_status"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                        <SelectItem value="Paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Approver</label>
                <Input 
                  {...form.register("approved_by")}
                  placeholder="Approver name"
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium mb-1">Approval Date</label>
                <Input 
                  type="date"
                  min={new Date(1900, 0, 1).toISOString().split('T')[0]}
                  max={new Date().toISOString().split('T')[0]}
                  {...form.register("approved_at", {
                    setValueAs: (value) => value ? new Date(value) : undefined
                  })}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Rejection Reason</label>
                <Input
                  {...form.register("rejection_reason")}
                  placeholder="If rejected"
                  className="h-8 text-xs "
                />
              </div>
            </div>
          </div> */}

          {/* File Upload */}
          <div>
            <label className="block text-xs font-medium mb-1">Upload Documents</label>
            <div className="border border-gray-300 rounded p-1 flex items-center gap-2 hover:cursor-pointer w-[400px] h-[50px] align-middle">
              <Input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileChange}
                className="text-xs cursor-pointer file:cursor-pointer w-[200px] h-[30px] p-1 pl-3 text-center"
              />
              <p className="text-xs text-gray-500 mt-1">
                PDF, JPG, PNG, DOC (max 5 files)
              </p>
            </div>
            
            {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedFiles.map((file, index) => (
                  <div key={file.name} className="flex items-center gap-1 p-1 border border-blue-200 rounded bg-blue-50 text-xs">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Add preview functionality if needed
                        console.log('Preview file:', file.name);
                      }}
                      className="text-blue-600 hover:bg-blue-100 flex-1 justify-start text-xs p-1"
                    >
                      {file.name}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newFiles = selectedFiles.filter((_, i) => i !== index);
                        setSelectedFiles(newFiles);
                      }}
                      className="text-red-600 hover:bg-red-100 px-1 text-xs"
                      title="Remove file"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Errors */}
          {Object.keys(form.formState.errors).length > 0 && (
            <div className="p-2 bg-red-50 border border-red-200 rounded">
              <ul className="text-xs text-red-700 space-y-0.5">
                {Object.entries(form.formState.errors).map(([field, error]) => (
                  <li key={field}>• {error?.message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              {isSubmitting ? "Creating..." : "Create Claim"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onCancel} className="hover:bg-gray-100 border-gray-300 text-gray-700 px-4 py-2 text-sm">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}; 

