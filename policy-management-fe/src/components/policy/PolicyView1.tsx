import React from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
// import { X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { User, FileText, Users, BadgeInfo, File, CreditCardIcon } from "lucide-react";
import DocumentPreviewModal, { DocumentPreview } from "../ui/DocumentPreviewModal";
import { FileImage, FileSpreadsheet, File as LucideFile } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { documentService } from "../../services/documentService";

export interface PolicyDocument {
  id?: string;
  file_name?: string;
  original_name?: string;
  relative_path?: string;
  file_type?: string;
  file_url?: string;
  document_type?: string;
  category?: string;
  member_id?: string;
  insured_member_id?: string;
  is_referenced?: boolean;
  reference_id?: string;
  transition_type?: string;
}

export interface Member {
  id?: string;
  insured_member_salutation?: string;
  name?: string;
  relation_to_proposer?: string;
  date_of_birth?: string;
  gender?: string;
  pre_existing?: boolean;
  insured_member_medical_condition?: boolean;
  insured_member_medical_remarks?: string;
  documents?: PolicyDocument[];
}

export interface Proposer {
  proposer_salutation?: string;
  full_name?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  mobile?: string;
  alternate_mobile?: string;
  email?: string;
  address?: string;
  kyc_id?: string;
  occupation?: string;
  nationality?: string;
  documents?: PolicyDocument[];
  insured_members?: Member[];
}

export interface Nominee {
  nominee_salutation?: string;
  nominee_name?: string;
  nominee_relation?: string;
  nominee_dob?: string;
  payment_mode?: string;
  payment_reference?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_ifsc_code?: string;
  bank_branch_name?: string;
}

export interface Policy {
  id?: string;
  policy_salutation?: string;
  policy_number?: string;
  customer_name?: string;
  company_id?: string;
  policy_type_id?: string;
  policy_name_id?: string;
  policy_group_id?: string;
  insurer_name?: string;
  product_name?: string;
  plan_type?: string;
  sum_insured?: number;
  premium_amount?: number;
  tenure_years?: number;
  start_date?: string;
  end_date?: string;
  issued_date?: string;
  proposer?: Proposer;
  members?: Member[];
  nominee_payment?: Nominee;
  documents?: PolicyDocument[];
  declaration_accepted?: boolean;
  status?: string;
  type?: string | { name: string };
  policyName?: string | { name: string };
  policyGroup?: string | { name: string };
  company?: string | { name: string };
  medical_condition?: boolean;
  medical_remarks?: string;
  policy_creation_status?: 'Fresh' | 'Renewal' | 'Migration' | 'Portablity';
  gst_status?: boolean;
  remarks?: string;
  premium_amount_gst?: number;
  deductible_amount?: number;
  deductible_amount_status?: boolean;
  emi_amount?: number;
  commission_add_on_percentage?: number;
  calculated_commission_amount?: number;
  document_references?: {
    id: string;
    source_document: PolicyDocument;
    transition_type: string;
  }[];
}

interface PolicyViewProps {
  policy: Policy;
  onClose?: () => void;
}

const formatDate = (dateString?: string) => {
  if (!dateString || isNaN(new Date(dateString).getTime())) {
    return "-";
  }
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatCurrency = (amount?: number) => {
  if (typeof amount !== "number" || isNaN(amount)) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper: get icon for file type
const getFileIcon = (ext: string) => {
  switch (ext) {
    case "pdf":
      return <LucideFile className="w-5 h-5 text-red-500" />;
    case "doc":
    case "docx":
      return <LucideFile className="w-5 h-5 text-blue-500" />;
    case "xls":
    case "xlsx":
    case "csv":
      return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
    case "jpg":
    case "jpeg":
    case "png":
    case "webp":
      return <FileImage className="w-5 h-5 text-yellow-500" />;
    default:
      return <LucideFile className="w-5 h-5 text-gray-500" />;
  }
};

const getFileExtension = (filename?: string) => filename?.split(".").pop()?.toLowerCase() || "";

// Helper to truncate document name
const truncateName = (name: string, maxLength = 10) => {
  if (name.length <= maxLength) return name;
  return name.slice(0, maxLength) + "...";
};

// DocumentList subcomponent
const DocumentList: React.FC<{
  documents: PolicyDocument[];
  onView: (doc: PolicyDocument) => void;
}> = ({ documents, onView }) => {
  if (!documents || documents.length === 0) {
    return <div className="p-3 bg-gray-50 rounded text-sm text-gray-500 text-center">No documents uploaded.</div>;
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {documents.map((doc) => {
        const ext = getFileExtension(doc.original_name || doc.file_name);
        const isReferenced = doc.is_referenced;
        
        return (
          <div key={doc.id} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded bg-white hover:bg-gray-50 transition-colors cursor-pointer min-w-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex-1 truncate text-sm font-medium text-gray-900 cursor flex items-center gap-1 min-w-0">
                    {getFileIcon(ext)}
                    <span className="truncate">{truncateName(doc.original_name || doc.file_name || 'Document')}</span>
                    {isReferenced && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded ml-1 flex-shrink-0">
                        Referenced
                      </span>
                    )}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <span className="flex items-center gap-1">
                    {getFileIcon(ext)}
                    {doc.original_name || doc.file_name || 'Document'}
                    {isReferenced && ` (Referenced from parent policy)`}
                  </span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button type="button" variant="outline" size="sm" onClick={() => onView(doc)} className="ml-2 bg-white border-gray-300 flex-shrink-0">View</Button>
          </div>
        );
      })}
    </div>
  );
};

// Helper function to categorize documents
const categorizeDocuments = (docs: PolicyDocument[]) => {
  const getPolicyDocs = (docs: PolicyDocument[]) => 
    docs.filter((doc: PolicyDocument) => 
      doc.category === 'POLICY_DOCUMENT' || 
      doc.document_type === 'POLICY_DOCUMENT' ||
      doc.document_type === 'policy' ||
      doc.category === 'policy'
    );
    
  const getProposerDocs = (docs: PolicyDocument[]) => 
    docs.filter((doc: PolicyDocument) => 
      doc.category === 'PROPOSER_DOCUMENT' || 
      doc.document_type === 'PROPOSER_DOCUMENT' ||
      doc.document_type === 'proposer' ||
      doc.category === 'proposer'
    );
    
  const getMemberDocs = (docs: PolicyDocument[]) => 
    docs.filter((doc: PolicyDocument) => 
      doc.category === 'INSURED_MEMBER_DOCUMENT' || 
      doc.document_type === 'INSURED_MEMBER_DOCUMENT' ||
      doc.document_type === 'member' ||
      doc.category === 'member'
    );
  
  return {
    policyDocs: getPolicyDocs(docs),
    proposerDocs: getProposerDocs(docs),
    memberDocs: getMemberDocs(docs)
  };
};

const PolicyView: React.FC<PolicyViewProps> = ({ policy, onClose }) => {
  // State for document preview modal
  const [previewDoc, setPreviewDoc] = React.useState<DocumentPreview | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  if (!policy) return null;

  // Handle document preview - uses only documentService (no fallbacks)
  const handleViewDocument = async (doc: PolicyDocument) => {
    if (!doc.id) {
      console.error("Document ID is missing:", doc);
      return;
    }

    try {
      console.log("Fetching document URL for:", doc.id);
      
      const url = await documentService.getCachedDocumentUrl(doc.id);
      
      if (url) {
        setPreviewDoc({ 
          url, 
          name: doc.original_name || doc.file_name || 'Document', 
          type: getFileExtension(doc.original_name || doc.file_name) 
        });
        setModalOpen(true);
      } else {
        console.error("Could not get document URL for:", doc);
        // No fallbacks - rely entirely on backend service
      }
    } catch (error) {
      console.error("Error fetching document URL:", error);
      // No fallbacks - rely entirely on backend service
    }
  };


  // Categorize all documents
  const allDocs: PolicyDocument[] = [
    ...(policy.documents || []),
    ...(policy.proposer?.documents || [])
  ];
  
  // Process referenced documents from document_references
  const referencedDocs: PolicyDocument[] = (policy.document_references || []).map((ref: { id: string; source_document: PolicyDocument; transition_type: string }) => ({
    ...ref.source_document,
    // Add a flag to indicate this is a referenced document
    is_referenced: true,
    reference_id: ref.id,
    transition_type: ref.transition_type
  }));
  
  // Combine direct and referenced documents
  const combinedDocs = [...allDocs, ...referencedDocs];
  
  console.log('Document processing in PolicyView:', {
    directDocs: allDocs.length,
    referencedDocs: referencedDocs.length,
    combinedDocs: combinedDocs.length
  });
  
  const { policyDocs, proposerDocs, memberDocs } = categorizeDocuments(combinedDocs);

  // Group member documents by member ID
  const memberDocsByMemberId: { [memberId: string]: PolicyDocument[] } = {};
  memberDocs.forEach((doc: PolicyDocument) => {
    let memberId = doc.insured_member_id || doc.member_id || '';
    
    if (!memberId) {
      if (policy.proposer?.insured_members && policy.proposer.insured_members.length > 0) {
        memberId = policy.proposer.insured_members[0].id || 'member-0';
      } else {
        memberId = 'unassigned';
      }
    }
    
    if (!memberDocsByMemberId[memberId]) {
      memberDocsByMemberId[memberId] = [];
    }
    memberDocsByMemberId[memberId].push(doc);
  });
  
  // Process referenced member documents by matching with current policy members
  const currentMembers = policy.proposer?.insured_members || [];
  const referencedMemberDocs = combinedDocs.filter((d) => d.category === 'INSURED_MEMBER_DOCUMENT');
  
  console.log('Processing member documents in PolicyView:', {
    currentMembers: currentMembers.length,
    referencedMemberDocs: referencedMemberDocs.length,
    allCombinedDocs: combinedDocs.length,
    currentMemberIds: currentMembers.map((m: Member) => m.id),
    referencedMemberIds: referencedMemberDocs.map((d: PolicyDocument) => d.insured_member_id)
  });
  
  // For referenced documents, distribute them among current members
  referencedMemberDocs.forEach((doc, index) => {
    const memberIndex = index % currentMembers.length;
    const currentMember = currentMembers[memberIndex];
    
    console.log(`Distributing member doc ${index} in PolicyView:`, {
      docId: doc.id,
      originalMemberId: doc.insured_member_id,
      assignedToMember: currentMember?.id,
      memberName: currentMember?.name
    });
    
    if (currentMember && currentMember.id) {
      if (!memberDocsByMemberId[currentMember.id]) {
        memberDocsByMemberId[currentMember.id] = [];
      }
      // Update the document to point to the current member
      const updatedDoc = {
        ...doc,
        insured_member_id: currentMember.id,
        member_id: currentMember.id
      };
      memberDocsByMemberId[currentMember.id].push(updatedDoc);
      console.log(`Added doc to member ${currentMember.id} in PolicyView:`, updatedDoc.original_name);
    }
  });
  
  // Also handle direct member documents that might have the correct member IDs
  const directMemberDocs = combinedDocs.filter((d) => 
    d.category === 'INSURED_MEMBER_DOCUMENT' && 
    !d.is_referenced && 
    d.insured_member_id
  );
  
  directMemberDocs.forEach((doc) => {
    const memberId = doc.insured_member_id || '';
    if (memberId && memberDocsByMemberId[memberId]) {
      memberDocsByMemberId[memberId].push(doc);
      console.log(`Added direct doc to member ${memberId} in PolicyView:`, doc.original_name);
    }
  });
  
  // Assign documents to the actual member objects for UI display
  if (policy.proposer?.insured_members) {
    policy.proposer.insured_members.forEach((member) => {
      if (member.id && memberDocsByMemberId[member.id]) {
        member.documents = memberDocsByMemberId[member.id];
        console.log(`Assigned ${member.documents.length} documents to member ${member.id}:`, member.name);
      }
    });
  }

  // Get company name for deductible logic
  const companyName = typeof policy.company === 'string' ? policy.company : policy.company?.name;
  
  const DEDUCTIBLE_OPTIONS: Record<string, number[]> = {
    "HDFC ERGO": [25000, 50000, 100000, 200000, 300000, 500000],
    "STAR HEALTH": [25000, 50000, 100000],
    "NIVA BUPA": [20000, 30000, 50000, 100000],
    "CARE HEALTH": [25000],
  };
  const HIDE_DEDUCTIBLE_FOR = ["ICICI LOMBARD"];

  const deductibleOptions = companyName ? DEDUCTIBLE_OPTIONS[companyName] : undefined;
  const hideDeductible = companyName && HIDE_DEDUCTIBLE_FOR.includes(companyName);

  return (
    <div className="max-w-7xl mx-auto p-4 mt-4 space-y-6">
      {/* Policy Holder Card */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <User className="text-blue-600 w-5 h-5" />
          <CardTitle className="text-lg font-semibold text-blue-700 ">Policy Holder Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div><div className="text-md text-gray-500 mb-1">Salutation</div><div className="font-semibold text-gray-800">{policy.proposer?.proposer_salutation || '-'}</div></div>
            <div><div className="text-md text-gray-500 mb-1">Full Name</div><div className="font-semibold text-gray-800">{policy.proposer?.full_name || '-'}</div></div>
            <div><div className="text-md text-gray-500 mb-1">Date of Birth</div><div className="font-semibold text-gray-800">{formatDate(policy.proposer?.date_of_birth)}</div></div>
            <div><div className="text-md text-gray-500 mb-1">Gender</div><div className="font-semibold text-gray-800">{policy.proposer?.gender || '-'}</div></div>
            <div><div className="text-md text-gray-500 mb-1">Marital Status</div><div className="font-semibold text-gray-800">{policy.proposer?.marital_status || '-'}</div></div>
            <div><div className="text-md text-gray-500 mb-1">Mobile Number</div><div className="font-semibold text-gray-800">{policy.proposer?.mobile || '-'}</div></div>
            <div><div className="text-md text-gray-500 mb-1">Alternate Mobile Number</div><div className="font-semibold text-gray-800">{policy.proposer?.alternate_mobile || '-'}</div></div>
            <div><div className="text-md text-gray-500 mb-1">Email Address</div><div className="font-semibold text-gray-800">{policy.proposer?.email || '-'}</div></div>
            <div><div className="text-md text-gray-500 mb-1">KYC ID</div><div className="font-semibold text-gray-800">{policy.proposer?.kyc_id || '-'}</div></div>
            <div><div className="text-md text-gray-500 mb-1">Occupation</div><div className="font-semibold text-gray-800">{policy.proposer?.occupation || '-'}</div></div>
            <div><div className="text-md text-gray-500 mb-1">Nationality</div><div className="font-semibold text-gray-800">{policy.proposer?.nationality || '-'}</div></div>
            <div className="md:col-span-2"><div className="text-md text-gray-500 mb-1">Address</div><div className="font-semibold text-gray-800">{policy.proposer?.address || '-'}</div></div>
          </div>
          {/* Holder Documents inside Holder Card */}
          <div>
            <div className="flex items-center gap-2 mb-2 mt-2">
              <FileText className="text-yellow-600 w-4 h-4" />
              <span className="text-sm font-semibold text-yellow-800">Holder Documents</span>
                    </div>
            <DocumentList documents={proposerDocs} onView={handleViewDocument} />
          </div>
        </CardContent>
      </Card>
      {/* Policy Details Card */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <BadgeInfo className="text-blue-600 w-5 h-5" />
          <CardTitle className="text-lg font-semibold text-blue-700">Policy Details</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div><div className="text-md text-gray-500 mb-1">Policy Number</div><div className="font-semibold text-gray-800">{policy.policy_number || '-'}</div></div>
            {/* <div><div className="text-md text-gray-500 mb-1">Policy Salutation</div><div className="font-semibold text-gray-800">{policy.policy_salutation || '-'}</div></div> */}
            {/* <div><div className="text-md text-gray-500 mb-1">Customer Name</div><div className="font-semibold text-gray-800">{policy.customer_name || '-'}</div></div> */}
            <div><div className="text-md text-gray-500 mb-1">Policy Group</div><div className="font-semibold text-gray-800">{(policy.policyGroup && typeof policy.policyGroup === 'object' && 'name' in policy.policyGroup) ? policy.policyGroup.name : (typeof policy.policyGroup === 'string' ? policy.policyGroup : '-')}</div></div>
            <div><div className="text-md text-gray-500 mb-1">Insurance Company</div><div className="font-semibold text-gray-800">{(policy.company && typeof policy.company === 'object' && 'name' in policy.company) ? policy.company.name : (typeof policy.company === 'string' ? policy.company : '-')}</div></div>
            <div><div className="text-md text-gray-500 mb-1">Policy Type</div><div className="font-semibold text-gray-800">{(policy.type && typeof policy.type === 'object' && 'name' in policy.type) ? policy.type.name : (typeof policy.type === 'string' ? policy.type : '-')}</div></div>
            <div><div className="text-md text-gray-500 mb-1">Product Name</div><div className="font-semibold text-gray-800">{(policy.policyName && typeof policy.policyName === 'object' && 'name' in policy.policyName) ? policy.policyName.name : (typeof policy.policyName === 'string' ? policy.policyName : '-')}</div></div>
            <div><div className="text-md text-gray-500 mb-1">Sum Insured (₹)</div><div className="font-semibold text-gray-800">{formatCurrency(policy.sum_insured)}</div></div>
             <div><div className="text-md text-gray-500 mb-1">GST Status</div><Badge className={policy.gst_status ? "bg-green-50 text-green-800 border border-green-100" : "bg-gray-50 text-gray-800 border border-gray-100"}>{policy.gst_status ? "GST Included" : "GST Not Included"}</Badge></div>
             {/* {policy.premium_amount_gst && (
               <div><div className="text-md text-gray-500 mb-1">Premium Amount (GST) (₹)</div><div className="font-semibold text-gray-800">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(policy.premium_amount_gst)}</div></div>
             )} */}
            <div><div className="text-md text-gray-500 mb-1">{policy.gst_status ? "Premium Amount (GST Inclusive) (₹)" : "Premium Amount (₹)"}</div><div className="font-semibold text-gray-800">{policy.premium_amount ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(policy.premium_amount) : '-'}</div></div>
            {policy.gst_status && (
              <div><div className="text-md text-gray-500 mb-1">Premium Amount (GST Exclusive) (₹)</div><div className="font-semibold text-gray-800">{policy.premium_amount_gst ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(policy.premium_amount_gst) : '-'}</div></div>
            )}
            {/* {policy.premium_amount && (
              <div className="md:col-span-2">
                <div className="text-sm text-gray-500 mb-1">GST Breakdown</div>
                <div className="text-sm text-gray-600">
                  <span>GST Amount: ₹{new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(policy.premium_amount * 0.18)}</span>
                  <span className="ml-4 text-gray-500">
                    (18% of ₹{new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(policy.premium_amount)})
                  </span>
                </div>
              </div>
            )} */}
            <div><div className="text-md text-gray-500 mb-1">Tenure (Years)</div><div className="font-semibold text-gray-800">{policy.tenure_years || '-'}</div></div>
            <div><div className="text-md text-gray-500 mb-1">Start Date</div><div className="font-semibold text-gray-800">{formatDate(policy.start_date)}</div></div>
            <div><div className="text-md text-gray-500 mb-1">End Date</div><div className="font-semibold text-gray-800">{formatDate(policy.end_date)}</div></div>
            <div><div className="text-md text-gray-500 mb-1">Issued Date</div><div className="font-semibold text-gray-800">{formatDate(policy.issued_date)}</div></div>
            <div><div className="text-md text-gray-500 mb-1">Policy Status</div><Badge className="bg-blue-100 text-blue-800 border border-blue-200">{policy.policy_creation_status === 'Migration' ? 'Internal Portability' : (policy.policy_creation_status || 'Fresh')}</Badge></div>
            <div><div className="text-md text-gray-500 mb-1">EMI Amount</div><div className="font-semibold text-gray-800">{policy.emi_amount !== undefined && policy.emi_amount !== null ? policy.emi_amount : '-'}</div></div>
            {deductibleOptions && !hideDeductible && (
          <>
                <div><div className="text-sm text-gray-500 mb-1">Deductible Amount Status</div><Badge className={policy.deductible_amount_status ? "bg-green-50 text-green-800 border border-green-100" : "bg-red-50 text-red-800 border border-red-100"}>{policy.deductible_amount_status ? 'Yes' : 'No'}</Badge></div>
            {policy.deductible_amount_status && (
                  <div><div className="text-sm text-gray-500 mb-1">Deductible Amount (₹)</div><div className="font-semibold text-gray-800">{formatCurrency(policy.deductible_amount)}</div></div>
                )}
            {((companyName && (companyName.includes('HDFC ERGO') || companyName.includes('HDFC ERGO GIC LTD'))) && policy.commission_add_on_percentage !== undefined && policy.commission_add_on_percentage !== null) && (
                  <div><div className="text-sm text-gray-500 mb-1">Commission Add-on (%)</div><div className="font-semibold text-gray-800">{policy.commission_add_on_percentage}</div></div>
                )}
            {((companyName && (companyName.includes('HDFC ERGO') || companyName.includes('HDFC ERGO GIC LTD'))) && policy.calculated_commission_amount !== undefined && policy.calculated_commission_amount !== null) && (
                  <div><div className="text-sm text-gray-500 mb-1">Calculated Commission Amount</div><div className="font-semibold text-gray-800">{typeof policy.calculated_commission_amount === 'number' ? policy.calculated_commission_amount.toFixed(2) : policy.calculated_commission_amount}</div></div>
            )}
          </>
        )}
            <div><div className="text-md text-gray-500 mb-1">Medical Condition</div><Badge className={policy.medical_condition ? "bg-orange-50 text-orange-800 border border-orange-100" : "bg-green-50 text-green-800 border border-green-100"}>{policy.medical_condition ? "Yes" : "No"}</Badge></div>
        {policy.medical_condition && policy.medical_remarks && (
              <div className="md:col-span-3"><div className="text-sm text-gray-500 mb-1">Medical Remarks</div><div className="font-semibold text-gray-800">{policy.medical_remarks}</div></div>
            )}

        {policy.remarks && (
              <div className="md:col-span-3"><div className="text-sm text-gray-500 mb-1">Policy Remarks</div><div className="font-semibold text-gray-800">{policy.remarks}</div></div>
            )}

      </div>
          {/* Policy Documents inside Policy Details Card */}
          <div>
            <div className="flex items-center gap-2 mb-2 mt-2">
              <File className="text-purple-600 w-4 h-4" />
              <span className="text-sm font-semibold text-purple-800">Policy Documents</span>
                    </div>
            <DocumentList documents={policyDocs} onView={handleViewDocument} />
          </div>
        </CardContent>
      </Card>
      {/* Insured Members Cards */}
      {policy.proposer?.insured_members && policy.proposer.insured_members.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Users className="text-blue-600 w-5 h-5" />
            <CardTitle className="text-lg font-semibold text-blue-700">Insured Members ({policy.proposer.insured_members.length})</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {policy.proposer.insured_members.map((member, idx) => (
                <div key={member.id || idx} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="text-indigo-600 w-5 h-5" />
                    <span className="text-base font-semibold text-indigo-800">Member {idx + 1}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Salutation</div>
                      <div className="font-semibold text-gray-800">{member.insured_member_salutation || '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Full Name</div>
                      <div className="font-semibold text-gray-800">{member.name || '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Relation to Proposer</div>
                      <div className="font-semibold text-gray-800">{member.relation_to_proposer || '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Date of Birth</div>
                      <div className="font-semibold text-gray-800">{formatDate(member.date_of_birth)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Gender</div>
                      <div className="font-semibold text-gray-800">{member.gender || '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Medical Condition</div>
                      <Badge className={member.insured_member_medical_condition ? "bg-orange-50 text-orange-800 border border-orange-100" : "bg-green-50 text-green-800 border border-green-100"}>{member.insured_member_medical_condition ? "Yes" : "No"}</Badge>
                    </div>
                    {member.insured_member_medical_condition && member.insured_member_medical_remarks && (
                      <div className="sm:col-span-2">
                        <div className="text-sm text-gray-500 mb-1">Medical Remarks</div>
                        <div className="font-semibold text-gray-800">{member.insured_member_medical_remarks}</div>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2 mt-2">
                      <FileText className="text-pink-600 w-4 h-4" />
                      <span className="text-sm font-semibold text-pink-800">Documents ({(member.documents || []).length})</span>
                    </div>
                    <DocumentList documents={member.documents || []} onView={handleViewDocument} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {/* Nominee & Payment Card */}
      {policy.nominee_payment && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <User className="text-teal-600 w-5 h-5" />
            <CardTitle className="text-lg font-semibold text-teal-700">Nominee Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div><div className="text-sm text-gray-500 mb-1">Nominee Salutation</div><div className="font-semibold text-gray-800">{policy.nominee_payment.nominee_salutation || '-'}</div></div>
              <div><div className="text-sm text-gray-500 mb-1">Nominee Name</div><div className="font-semibold text-gray-800">{policy.nominee_payment.nominee_name || '-'}</div></div>
              <div><div className="text-sm text-gray-500 mb-1">Relation to Proposer</div><div className="font-semibold text-gray-800">{policy.nominee_payment.nominee_relation || '-'}</div></div>
              <div><div className="text-sm text-gray-500 mb-1">Nominee Date of Birth</div><div className="font-semibold text-gray-800">{formatDate(policy.nominee_payment.nominee_dob)}</div></div>
            </div>
          </CardContent>
        </Card>
      )}
      {policy.nominee_payment && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <CreditCardIcon className="text-blue-600 w-5 h-5" />
            <CardTitle className="text-lg font-semibold text-blue-700">Payment Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div><div className="text-sm text-gray-500 mb-1">Payment Mode</div><div className="font-semibold text-gray-800">{policy.nominee_payment.payment_mode || '-'}</div></div>
              <div><div className="text-sm text-gray-500 mb-1">Payment Reference</div><div className="font-semibold text-gray-800">{policy.nominee_payment.payment_reference || '-'}</div></div>
              <div><div className="text-sm text-gray-500 mb-1">Bank Name</div><div className="font-semibold text-gray-800">{policy.nominee_payment.bank_name || '-'}</div></div>
              <div><div className="text-sm text-gray-500 mb-1">Bank Account Number</div><div className="font-semibold text-gray-800">{policy.nominee_payment.bank_account_number || '-'}</div></div>
              <div><div className="text-sm text-gray-500 mb-1">Bank IFSC Code</div><div className="font-semibold text-gray-800">{policy.nominee_payment.bank_ifsc_code || '-'}</div></div>
              <div><div className="text-sm text-gray-500 mb-1">Bank Branch Name</div><div className="font-semibold text-gray-800">{policy.nominee_payment.bank_branch_name || '-'}</div></div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Close Button */}
      {onClose && (
        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-200">
          <Button type="button" onClick={onClose} className="bg-blue-600 text-white hover:bg-blue-700">Close</Button>
        </div>
      )}
      {/* Document Preview Modal */}
      <DocumentPreviewModal open={modalOpen} onClose={() => setModalOpen(false)} document={previewDoc} />
    </div>
  );
};

export default PolicyView;