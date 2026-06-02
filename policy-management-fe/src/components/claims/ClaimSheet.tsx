import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Plus, FileText, AlertCircle, Eye } from "lucide-react";
import { Claim, InsuredMember } from "../../types/claim";
import { getPolicyClaims } from "../../services/claim.service";
import { ClaimForm } from "./ClaimForm";
import { EditClaimForm } from "./EditClaimForm";
import { toast } from "sonner";
import { Sheet, SheetContent, } from "../ui/sheet";
import DocumentPreviewModal from "../ui/DocumentPreviewModal";
import axios from "axios";
import { documentService } from "../../services/documentService";

interface ClaimSheetProps {
  policyId: string;
  insuredMembers: InsuredMember[];
  onClose: () => void;
  open: boolean;
}

export const ClaimSheet: React.FC<ClaimSheetProps> = ({ 
  policyId, 
  insuredMembers: initialInsuredMembers, 
  onClose,
  open
}) => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClaim, setEditingClaim] = useState<Claim | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<{ url: string; name: string; type?: string } | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [insuredMembers, setInsuredMembers] = useState<InsuredMember[]>(initialInsuredMembers);

  

  const loadPolicyData = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/v1/policies/${policyId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data && response.data.success && response.data.data) {
        const policy = response.data.data;
        // Use members from the fetched policy data - they are in proposer.insured_members
        const members = policy.proposer?.insured_members || initialInsuredMembers || [];
        console.log('🔍 [ClaimSheet] Policy data loaded:', {
          policyId,
          policyMembers: policy.proposer?.insured_members,
          initialMembers: initialInsuredMembers,
          finalMembers: members
        });
        setInsuredMembers(members);
      }
    } catch (error) {
      console.error('Error loading policy data:', error);
      // Keep using the initial insured members if API call fails
      setInsuredMembers(initialInsuredMembers || []);
    }
  }, [policyId, initialInsuredMembers]);

  const loadClaims = useCallback(async () => {
    try {
      setLoading(true);
      const claimsData = await getPolicyClaims(policyId);
      setClaims(claimsData);
    } catch (error) {
      console.error('Error loading claims:', error);
      setError("Failed to load claims");
      toast.error("Failed to load claims");
    } finally {
      setLoading(false);
    }
  }, [policyId]);

  useEffect(() => {
    if (open) {
      loadClaims();
      loadPolicyData();
    }
  }, [open, loadClaims, loadPolicyData]);

  const handleClaimCreated = () => {
    setShowForm(false);
    setEditingClaim(null); // Ensure editing state is also cleared
    loadClaims();
    toast.success("Claim created successfully");
  };

  const handleClaimUpdated = () => {
    setEditingClaim(null);
    setShowForm(false); // Ensure form state is also cleared
    loadClaims();
    toast.success("Claim updated successfully");
  };

  const handleEditClaim = (claim: Claim) => {
    setShowForm(false); // Clear any form state
    setEditingClaim(claim);
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


  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="
          w-full
          max-w-xl
          sm:max-w-2xl
          md:max-w-2xl
          lg:max-w-2xl
          xl:max-w-2xl
          2xl:max-w-2xl
          min-w-[320px]
          h-full
          overflow-y-auto
          bg-white
          px-6

          border-l
          border-gray-200
        "
        style={{ boxShadow: '0 6px 32px 0 rgba(0,0,0,0.08)' }}
      >
        {/* <SheetHeader>
          <SheetTitle className="text-xl font-semibold mb-2">Policy Claims</SheetTitle>
          <p className="text-xs text-gray-500">
                {claims.length} claim{claims.length !== 1 ? 's' : ''} found
              </p>
        </SheetHeader> */}
        
        <div className=" space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h5 className="text-base font-bold mb-0.5">Policy Claims</h5>
              <p className="text-xs text-gray-500">
                {claims.length} claim{claims.length !== 1 ? 's' : ''} found
              </p>
            </div>
            <Button 
              onClick={() => {
                setEditingClaim(null); // Clear any editing state
                setShowForm(true);
              }} 
              size="sm" 
              className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 text-sm font-semibold w-26 mr-5"
            >
              <Plus className="w-4 h-4 " />
              Add Claim
            </Button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 p-3 bg-red-50 rounded-md border border-red-100 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {/* No Claims State */}
          {!loading && !error && claims.length === 0 && !showForm && (
            <Card className="border border-gray-100 bg-gray-50">
              <CardContent className="p-6 text-center">
                <FileText className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                <h3 className="text-base font-medium text-gray-900 mb-1">No claims yet</h3>
                <p className="text-xs text-gray-600 mb-3">
                  Start by creating a new claim for this policy
                </p>
                <Button 
                  onClick={() => {
                    setEditingClaim(null); // Clear any editing state
                    setShowForm(true);
                  }} 
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Your First Claim
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Claim Form */}
          {showForm && (
            <div className="bg-gray-50 rounded-md shadow border border-gray-100 p-5">
              <ClaimForm
                policyId={policyId}
                insuredMembers={insuredMembers}
                onSuccess={handleClaimCreated}
                onCancel={() => setShowForm(false)}
              />
            </div>
          )}

          {/* Edit Claim Form */}
          {editingClaim && (
            <div className="bg-gray-50 rounded-md shadow border border-gray-100 p-5">
              <EditClaimForm
                claim={editingClaim}
                insuredMembers={insuredMembers}
                onSuccess={handleClaimUpdated}
                onCancel={() => setEditingClaim(null)}
              />
            </div>
          )}

          {/* Claims List */}
          {!loading && !error && claims.length > 0 && !showForm && !editingClaim && (
            <div className="space-y-3">
              {claims.map((claim) => (
                <Card 
                  key={claim.id} 
                  className="border-l-4 border-blue-500 hover:shadow-md transition-shadow bg-white cursor-pointer"
                  onClick={() => handleEditClaim(claim)}
                >
                  <CardHeader className="pb-2 px-4 pt-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <CardTitle className="text-base font-semibold">
                          {claim.claim_type.replace('_', ' ')} Claim
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
                          <span>Created: {new Date(claim.created_at).toLocaleDateString()}</span>
                          {claim.claim_date && (
                            <span>• Date: {new Date(claim.claim_date).toLocaleDateString()}</span>
                          )}
                          <span>• ₹{claim.claim_amount.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {/* <div className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          claim.claim_status === 'Approved' ? 'bg-green-100 text-green-800' :
                          claim.claim_status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          claim.claim_status === 'Paid' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {claim.claim_status}
                        </div> */}
                        {claim.is_full_claim && (
                          <div className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-100 text-purple-800">
                            Full Claim
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 pt-0">
                    {/* Basic Claim Information */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mb-2 text-xs">
                      <div>
                        <span className="text-gray-500">Amount:</span>
                        <span className="ml-1 font-semibold">
                          ₹{claim.claim_amount.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Claim Date:</span>
                        <span className="ml-1 font-semibold">
                          {claim.claim_date ? new Date(claim.claim_date).toLocaleDateString() : 'Not set'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Claim Type:</span>
                        <span className="ml-1 font-semibold capitalize">
                          {claim.claim_type.toLowerCase().replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Full Claim:</span>
                        <span className="ml-1 font-semibold">
                          {claim.is_full_claim ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Claimant:</span>
                        <span className="ml-1 font-semibold">
                          {claim.claimant_type === 'SELF' ? 'Self' : 'Insured Member'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Members:</span>
                        <span className="ml-1 font-semibold">
                          {claim.claim_members.length} member{claim.claim_members.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Approval Workflow Information */}
                    {/* <div className="border-t border-gray-300 pt-2 mt-2 mb-1">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Approver:</span>
                          <span className="ml-1 font-semibold">
                            {claim.approved_by || 'Not assigned'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Approval Date:</span>
                          <span className="ml-1 font-semibold">
                            {claim.approved_at ? new Date(claim.approved_at).toLocaleDateString() : 'Not set'}
                          </span>
                        </div>
                      </div>
                      {claim.rejection_reason && (
                        <div className="mt-1">
                          <span className="text-gray-500">Rejection Reason:</span>
                          <span className="text-red-700 ml-1">{claim.rejection_reason}</span>
                        </div>
                      )}
                    </div> */}

                    {/* Claim Members Details */}
                    {claim.claim_members.length > 0 && (
                      <div className="border-t border-gray-300 pt-2 mt-2">
                        <div className="font-medium text-xs text-gray-700 mb-1">Claim Members</div>
                        <div className="space-y-1">
                          {claim.claim_members.map((member) => (
                            <div key={member.id} className="flex justify-between items-center px-2 py-1 bg-gray-50 rounded">
                              <div className="text-xs font-medium">
                                {member.insured_member?.name || 'Unknown Member'}
                                <span className="text-[10px] text-gray-400 ml-1">
                                  ({member.insured_member?.relation_to_proposer || 'Unknown'})
                                </span>
                              </div>
                              <div className="text-xs">
                                <span className="text-gray-500">Amount: </span>
                                <span className="font-semibold">
                                  ₹{member.member_claim_amount?.toLocaleString() || '0'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Claim Remarks */}
                    {claim.claim_remarks && (
                      <div className="border-t border-gray-300 pt-2 mt-2">
                        <span className="text-xs text-gray-500">Remarks:</span>
                        <span className="text-xs text-gray-700 ml-1">{claim.claim_remarks}</span>
                      </div>
                    )}

                    {/* Documents */}
                    {claim.documents && claim.documents.length > 0 && (
                      <div className="border-t border-gray-300 pt-2 mt-2">
                        <div className="font-medium text-xs text-gray-700 mb-1">Documents</div>
                        <div className="space-y-1">
                          {claim.documents.map((doc) => (
                            <div key={doc.id} className="flex justify-between items-center px-2 py-1 bg-gray-50 rounded">
                              <div className="text-xs font-medium truncate flex-1">
                                {doc.original_name}
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDocumentPreview(doc);
                                }}
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 border-blue-200 hover:border-blue-300 ml-2 flex-shrink-0"
                              >
                                <Eye className="w-3 h-3" />
                                Preview
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SheetContent>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        open={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        document={previewDocument}
      />
    </Sheet>
  );
};

