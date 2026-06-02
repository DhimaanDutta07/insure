import React, { useState } from "react";
import { useForm, useFieldArray, SubmitHandler, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Plus, X, Eye } from "lucide-react";
import { updateClaim } from "../../services/claim.service";
import { InsuredMember, Claim } from "../../types/claim";
import { toast } from "sonner";
import { z } from "zod";
import DocumentPreviewModal from "../ui/DocumentPreviewModal";
import { documentService } from "../../services/documentService";

// Schema for form validation (same as ClaimForm)
const claimFormSchema = z.object({
  policy_id: z.string(),
  claimant_type: z.enum(['SELF', 'INSURED_MEMBER']),
  claim_amount: z.number().positive(),
  claim_remarks: z.string().optional(),
  claim_type: z.enum(['HOSPITALIZATION', 'DAYCARE', 'PREPOST', 'CASHLESS', 'HEALTH_CHECKUP', 'OTHER']),
  claim_date: z.date().optional(),
  is_full_claim: z.boolean(),
  // Approval workflow fields
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
  // For INSURED_MEMBER, require at least one member with valid insured_member_id
  if (data.claimant_type === 'INSURED_MEMBER') {
    return data.members && data.members.length > 0 && 
           data.members.every(member => member.insured_member_id && member.insured_member_id.trim() !== '');
  }
  // For SELF, members are optional
  return true;
}, {
  message: "At least one member must be selected for insured member claims",
  path: ["members"],
}).refine((data) => {
  // If status is Rejected, rejection_reason is required
  if (data.claim_status === 'Rejected' && !data.rejection_reason) {
    return false;
  }
  return true;
}, {
  message: "Rejection reason is required when status is Rejected",
  path: ["rejection_reason"],
}).refine((data) => {
  // If status is Approved or Rejected, approved_by is required
  if ((data.claim_status === 'Approved' || data.claim_status === 'Rejected') && !data.approved_by) {
    return false;
  }
  return true;
}, {
  message: "Approver name is required when status is Approved or Rejected",
  path: ["approved_by"],
});

type ClaimFormData = z.infer<typeof claimFormSchema>;

interface EditClaimFormProps {
  claim: Claim;
  insuredMembers: InsuredMember[];
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditClaimForm: React.FC<EditClaimFormProps> = ({ 
  claim, 
  insuredMembers, 
  onSuccess, 
  onCancel 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewDocument, setPreviewDocument] = useState<{ url: string; name: string; type?: string } | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const form = useForm<ClaimFormData>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      policy_id: claim.policy_id,
      claimant_type: claim.claimant_type,
      claim_amount: claim.claim_amount,
      claim_remarks: claim.claim_remarks || '',
      claim_type: claim.claim_type,
      is_full_claim: claim.is_full_claim,
      claim_date: claim.claim_date ? new Date(claim.claim_date) : undefined,
      claim_status: claim.claim_status,
      approved_by: claim.approved_by || '',
      approved_at: claim.approved_at ? new Date(claim.approved_at) : undefined,
      rejection_reason: claim.rejection_reason || '',
      members: claim.claim_members.map(member => ({
        insured_member_id: member.insured_member_id,
        member_claim_amount: member.member_claim_amount || 0,
        member_remarks: member.member_remarks || '',
      })) || [],
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "members",
  });

  // Watch the claimant_type field for reactive updates
  const claimantType = useWatch({
    control: form.control,
    name: "claimant_type",
  });

  // Handle member fields based on claimant type
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

  // Handle document preview - uses only documentService (no fallbacks)
  const handleDocumentPreview = async (doc: { id?: string; relative_path: string; original_name: string; file_type?: string }) => {
    if (!doc.id) {
      console.error("Document ID is missing:", doc);
      return;
    }

    try {
      console.log("Fetching document URL for:", doc.id);
      
      const url = await documentService.getCachedDocumentUrl(doc.id);
      
      if (url) {
        setPreviewDocument({
          url,
          name: doc.original_name || 'Document',
          type: doc.file_type
        });
        setIsPreviewModalOpen(true);
      } else {
        console.error("Could not get document URL for:", doc);
        // No fallbacks - rely entirely on backend service
      }
    } catch (error) {
      console.error("Error fetching document URL:", error);
      // No fallbacks - rely entirely on backend service
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
      await updateClaim(claim.id, submitData, selectedFiles);
      onSuccess();
      toast.success("Claim updated successfully");
    } catch (error) {
      console.error('Error updating claim:', error);
      toast.error("Failed to update claim");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="border border-gray-100 shadow-sm bg-white">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-base font-semibold">Edit Claim</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-2">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Claimant Type Selection */}
            <div>
              <label className="block text-xs font-medium mb-1">Claimant Type</label>
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

            {/* Basic Claim Details */}
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

            {/* Multiple Members Selection - Only show for INSURED_MEMBER */}
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
            {/* <div className="border-t border-gray-300 pt-2">
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
              
              {/* Existing Files */}
              {claim.documents && claim.documents.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Existing Documents</h4>
                  <div className="space-y-2">
                    {claim.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600">
                              {doc.original_name?.split('.').pop()?.toUpperCase() || 'DOC'}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-900">{doc.original_name}</p>
                            <p className="text-xs text-gray-500">
                              Uploaded on {new Date(doc.uploaded_at || '').toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDocumentPreview(doc)}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 border-blue-200 hover:border-blue-300"
                          >
                            <Eye className="w-3 h-3" />
                            Preview
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload New Files */}
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">Upload Additional Documents</h4>
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
              <Button type="submit" disabled={isSubmitting} size="sm" className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 text-sm font-semibold">
                {isSubmitting ? "Updating..." : "Update Claim"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={onCancel} className="hover:bg-gray-100 border-gray-300 text-gray-700 px-4 py-2 text-sm">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        open={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        document={previewDocument}
      />
    </>
  );
}; 