import { useState, useEffect, useCallback, FormEventHandler } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import axios from "axios";
import { toast } from "sonner";
import { deleteDocument } from "../../services/policy.service";
import { Trash, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import DocumentPreviewModal from "../ui/DocumentPreviewModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { commissionCalculationService } from "../../services/commissionCalculation.service";
import { PolicyTransitionService } from "../../services/policyTransition.service";
import { documentService } from "../../services/documentService";

export type PolicyTypeEnum = "HEALTH_INSURANCE" | "MOTOR_INSURANCE" | "LIFE_INSURANCE";

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
  insured_members?: Member[]; // Added for nested members
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

export interface PolicyFormData {
  policy_salutation?: string;
  policy_number?: string;
  customer_name?: string;
  company_id?: string;
  policy_type_id?: string;
  policy_group_id?: string;
  policy_name_id?: string;
  insurer_name?: string;
  product_name?: string;
  plan_type?: string;
  deductible_amount?: number;
  deductible_amount_status?: boolean;
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
  medical_condition?: boolean;
  medical_remarks?: string;
  policy_creation_status?: 'Fresh' | 'Renewal' | 'Migration' | 'Portablity';
  gst_status?: boolean;
  remarks?: string;
  emi_amount?: number;
  calculated_commission_amount?: number;
}

interface PolicyEditFormProps {
  policyId: string;
  onSubmit: () => void;
  onClose?: () => void;
}

interface Company {
  id: string;
  name: string;
  category: string;
}

interface PolicyTypeOption {
  id: string;
  name: string;
  description?: string;
}

interface PolicyName {
  id: string;
  name: string;
  description?: string;
  policy_group_id?: string;
  company_id?: string;
}
interface PolicyGroup {
  id: string;
  name: string;
  description?: string;
}

// Helper to get file icon for extension
const getFileIcon = (ext: string) => {
  switch (ext) {
    case "pdf":
      return <span className="text-red-500 mr-1">📄</span>;
    case "doc":
    case "docx":
      return <span className="text-blue-500 mr-1">📄</span>;
    case "xls":
    case "xlsx":
    case "csv":
      return <span className="text-green-500 mr-1">📊</span>;
    case "jpg":
    case "jpeg":
    case "png":
    case "webp":
      return <span className="text-yellow-500 mr-1">🖼️</span>;
    default:
      return <span className="text-gray-500 mr-1">📁</span>;
  }
};

// Helper to truncate document name
const truncateName = (name: string, maxLength = 10) => {
  if (name.length <= maxLength) return name;
  return name.slice(0, maxLength) + "...";
};

export default function PolicyEditForm({ policyId, onSubmit, onClose }: PolicyEditFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [policyTypes, setPolicyTypes] = useState<PolicyTypeOption[]>([]);
  const [policyNames, setPolicyNames] = useState<PolicyName[]>([]);
  const [policyGroups, setPolicyGroups] = useState<PolicyGroup[]>([]);
  const [commissionRules, setCommissionRules] = useState<any[]>([]);
  
  // File upload states - organized by entity
  const [policyDocs, setPolicyDocs] = useState<File[]>([]);
  const [proposerDocs, setProposerDocs] = useState<File[]>([]);
  const [memberDocs, setMemberDocs] = useState<{ [index: number]: File[] }>({});
  
  // Categorized existing documents
  const [existingPolicyDocs, setExistingPolicyDocs] = useState<PolicyDocument[]>([]);
  const [existingProposerDocs, setExistingProposerDocs] = useState<PolicyDocument[]>([]);
  const [existingMemberDocs, setExistingMemberDocs] = useState<{ [memberId: string]: PolicyDocument[] }>({});
  const [deletedMemberIds, setDeletedMemberIds] = useState<string[]>([]);

  // Document preview modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<{ url: string; name: string; type?: string } | null>(null);

  // Commission calculation state
  const [calculatedCommission, setCalculatedCommission] = useState<{
    calculated_commission_amount: number;
    base_percentage: number;
    rule_found: boolean;
    si_condition?: string;
    custom_si_threshold?: number;
    custom_si_operator?: string;
  }>({
    calculated_commission_amount: 0,
    base_percentage: 0,
    rule_found: false,
  });
  const [isCalculatingCommission, setIsCalculatingCommission] = useState(false);
  
  // Local state for premium amount input to prevent input interference
  const [premiumAmountInput, setPremiumAmountInput] = useState<string>("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<PolicyFormData>({
    mode: "onBlur",
    defaultValues: {
      members: [],
      declaration_accepted: false,
      medical_condition: false,
      medical_remarks: '',
      deductible_amount_status: false,
      policy_creation_status: 'Fresh',
      gst_status: false,
      remarks: '',
      proposer: {
        proposer_salutation: '',
        full_name: '',
        date_of_birth: '',
        gender: '',
        marital_status: '',
        mobile: '',
        email: '',
        address: '',
        kyc_id: '',
        occupation: '',
        nationality: '',
        documents: [],
        insured_members: [], // Initialize insured_members
      },
    }
  });

  const { fields: memberFields, append: appendMember, remove: removeMember } = useFieldArray({
    control,
    name: "members",
  });

  // Custom remove function that also cleans up member documents
  const handleRemoveMember = (index: number) => {
    const member = watch(`members.${index}`);
    if (member && member.id) {
      // Track deleted member ID for submission
      setDeletedMemberIds(prev => [...prev, member.id as string]);
      // Remove member documents from state when member is deleted
      setExistingMemberDocs(prev => {
        const updated = { ...prev };
        if (member.id) {
          delete updated[member.id];
        }
        return updated;
      });
    }
    // Call the original remove function
    removeMember(index);
  };

  // Dynamic API calls and policy data fetching
  useEffect(() => {
    const fetchPolicyDetails = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("authToken");
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch dropdown data and policy details in parallel
        const [policyRes, companiesRes, policyTypesRes, policyNamesRes, policyGroupsRes, commissionRulesRes] = await Promise.all([
          axios.get(`${(import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '')}/api/v1/policies/${policyId}`, { headers }),
          axios.get(`${(import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '')}/api/v1/companies`, { headers }),
          axios.get(`${(import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '')}/api/v1/policy-types`, { headers }),
          axios.get(`${(import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '')}/api/v1/policy-names`, { headers }),
          axios.get(`${(import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '')}/api/v1/policy-groups`, { headers }),
          axios.get(`${(import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '')}/api/v1/commission-rules`, { headers }),
        ]);

        // Extract policy data from the response (backend returns { success: true, data: policy })
        const policy = policyRes.data.data || policyRes.data;
        console.log('Fetched policy data:', policy);
        
        // Set dropdown data
        setCompanies(Array.isArray(companiesRes.data) ? companiesRes.data : []);
        setPolicyTypes(Array.isArray(policyTypesRes.data) ? policyTypesRes.data : []);
        setPolicyNames(Array.isArray(policyNamesRes.data) ? policyNamesRes.data : []);
        setPolicyGroups(Array.isArray(policyGroupsRes.data.policyGroups) ? policyGroupsRes.data.policyGroups : []);
        setCommissionRules(Array.isArray(commissionRulesRes.data) ? commissionRulesRes.data : []);
        
        // Process and categorize documents
        const allDocs: PolicyDocument[] = policy.documents || [];
        
        // Process referenced documents from document_references
        const referencedDocs: PolicyDocument[] = (policy.document_references || []).map((ref: { id: string; transition_type: string; source_document: PolicyDocument }) => ({
          ...ref.source_document,
          // Add a flag to indicate this is a referenced document
          is_referenced: true,
          reference_id: ref.id,
          transition_type: ref.transition_type
        }));
        
        // Combine direct and referenced documents
        const combinedDocs = [...allDocs, ...referencedDocs];
        
        console.log('Document processing:', {
          directDocs: allDocs.length,
          referencedDocs: referencedDocs.length,
          combinedDocs: combinedDocs.length
        });
        
        // Extract documents from nested structures
        const proposerDocs: PolicyDocument[] = policy.proposer?.documents || [];
        const memberDocsFromNested: PolicyDocument[] = [];
        
        // Extract member documents from nested member objects
        // Check both policy.members and policy.proposer.insured_members
        const allMembers = [
          ...(policy.members || []),
          ...(policy.proposer?.insured_members || [])
        ];
        
        allMembers.forEach((member: Member & { id?: string; documents?: PolicyDocument[] }) => {
          if (member.documents && Array.isArray(member.documents)) {
            member.documents.forEach((doc: PolicyDocument) => {
              memberDocsFromNested.push({
                ...doc,
                insured_member_id: member.id, // Ensure the member ID is set
                member_id: member.id // Fallback
              });
            });
          }
        });
        
        console.log('Extracted documents:', {
          policyDocs: allDocs.length,
          proposerDocs: proposerDocs.length,
          memberDocsFromNested: memberDocsFromNested.length,
          allMembers: allMembers.length,
          policyMembers: policy.members?.length || 0,
          proposerInsuredMembers: policy.proposer?.insured_members?.length || 0
        });
        
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
          
        // Set policy documents (from policy.documents)
        setExistingPolicyDocs(getPolicyDocs(combinedDocs));
        
        // Proposer docs might also reside in policy.documents with category PROPOSER_DOCUMENT
        const combinedProposerDocs = [
          ...getProposerDocs(combinedDocs),
          ...getProposerDocs(proposerDocs),
        ];
        setExistingProposerDocs(combinedProposerDocs);
        
        // Group member documents by member ID - maintain stable associations
        const memberDocsByMemberId: { [memberId: string]: PolicyDocument[] } = {};

        // 1. Use nested member docs if present (already handled above)
        memberDocsFromNested.forEach((doc: PolicyDocument) => {
          const memberId = doc.insured_member_id || doc.member_id || '';
          
          if (memberId) {
            if (!memberDocsByMemberId[memberId]) {
              memberDocsByMemberId[memberId] = [];
            }
            memberDocsByMemberId[memberId].push(doc);
          }
        });

        // 2. Process referenced member documents by matching with current policy members
        const currentMembers = policy.proposer?.insured_members || [];
        const referencedMemberDocs = combinedDocs.filter((d) => d.category === 'INSURED_MEMBER_DOCUMENT');
        
        console.log('Processing member documents:', {
          currentMembers: currentMembers.length,
          referencedMemberDocs: referencedMemberDocs.length,
          allCombinedDocs: combinedDocs.length,
          currentMemberIds: currentMembers.map((m: Member & { id?: string }) => m.id),
          referencedMemberIds: referencedMemberDocs.map((d: PolicyDocument) => d.insured_member_id)
        });
        
        // For referenced documents, distribute them among current members
        referencedMemberDocs.forEach((doc, index) => {
          const memberIndex = index % currentMembers.length;
          const currentMember = currentMembers[memberIndex];
          
          console.log(`Distributing member doc ${index}:`, {
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
            console.log(`Added doc to member ${currentMember.id}:`, updatedDoc.original_name);
          }
        });
        
        // 3. Also handle direct member documents that might have the correct member IDs
        const directMemberDocs = combinedDocs.filter((d) => 
          d.category === 'INSURED_MEMBER_DOCUMENT' && 
          !d.is_referenced && 
          d.insured_member_id
        );
        
        directMemberDocs.forEach((doc) => {
            const memberId = doc.insured_member_id || '';
          if (memberId && memberDocsByMemberId[memberId]) {
            memberDocsByMemberId[memberId].push(doc);
            console.log(`Added direct doc to member ${memberId}:`, doc.original_name);
          }
        });
        
        console.log('Final member documents mapping:', memberDocsByMemberId);
        setExistingMemberDocs(memberDocsByMemberId);
        
        // Assign documents to the actual member objects for UI display
        if (policy.proposer?.insured_members) {
          policy.proposer.insured_members.forEach((member: Member & { id?: string; documents?: PolicyDocument[] }) => {
            if (member.id && memberDocsByMemberId[member.id]) {
              member.documents = memberDocsByMemberId[member.id];
              console.log(`Assigned ${member.documents.length} documents to member ${member.id}:`, member.name);
            }
          });
        }
        
        // Helper function to safely format dates
        const formatDate = (dateString: string | null | undefined): string => {
          if (!dateString) return '';
          try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            return date.toISOString().split('T')[0];
          } catch (error) {
            console.warn('Error formatting date:', dateString, error);
            return '';
          }
        };
        
        // Prepare form data with comprehensive fallbacks
        const formData: PolicyFormData = {
          // Policy basic info
          policy_salutation: policy.policy_salutation || '',
          policy_number: policy.policy_number || '',
          customer_name: policy.customer_name || '',
          company_id: policy.company_id || '',
          policy_type_id: policy.policy_type_id || '',
          policy_group_id: policy.policy_group_id || '',
          policy_name_id: policy.policy_name_id || '',
          insurer_name: policy.insurer_name || '',
          product_name: policy.product_name || '',
          plan_type: policy.plan_type || '',
          
          // Financial details
          deductible_amount: policy.deductible_amount ?? undefined,
          deductible_amount_status: Boolean(policy.deductible_amount_status),
          sum_insured: policy.sum_insured || 0,
          premium_amount: policy.premium_amount || 0,
          tenure_years: policy.tenure_years || 0,
          
          // Dates
          start_date: formatDate(policy.start_date),
          end_date: formatDate(policy.end_date),
          issued_date: formatDate(policy.issued_date),
          
          // Medical and status
          medical_condition: Boolean(policy.medical_condition),
          medical_remarks: policy.medical_remarks || '',
          policy_creation_status: policy.policy_creation_status || 'Fresh',
          gst_status: Boolean(policy.gst_status),
          remarks: policy.remarks || '',
          declaration_accepted: Boolean(policy.declaration_accepted),
          
          // Proposer information
          proposer: {
            proposer_salutation: policy.proposer?.proposer_salutation || '',
            full_name: policy.proposer?.full_name || '',
            date_of_birth: formatDate(policy.proposer?.date_of_birth),
            gender: policy.proposer?.gender || '',
            marital_status: policy.proposer?.marital_status || '',
            mobile: policy.proposer?.mobile || '',
            alternate_mobile: policy.proposer?.alternate_mobile || '',
            email: policy.proposer?.email || '',
            address: policy.proposer?.address || '',
            kyc_id: policy.proposer?.kyc_id || '',
            occupation: policy.proposer?.occupation || '',
            nationality: policy.proposer?.nationality || '',
            documents: policy.proposer?.documents || [],
            insured_members: (policy.members || []).map((member: Member & { id?: string }) => ({
              id: member.id, // Keep original ID for updates
              insured_member_salutation: member.insured_member_salutation || '',
              name: member.name || '',
              relation_to_proposer: member.relation_to_proposer || '',
              date_of_birth: formatDate(member.date_of_birth),
              gender: member.gender || '',
              pre_existing: Boolean(member.pre_existing),
              insured_member_medical_condition: Boolean(member.insured_member_medical_condition),
              insured_member_medical_remarks: member.insured_member_medical_remarks || '',
              documents: member.documents || [],
            })),
          },
          
          // Members array - populate from policy.members or policy.proposer.insured_members
          members: (policy.members || policy.proposer?.insured_members || []).map((member: Member & { id?: string }) => ({
            id: member.id, // Keep original ID for updates
            insured_member_salutation: member.insured_member_salutation || '',
            name: member.name || '',
            relation_to_proposer: member.relation_to_proposer || '',
            date_of_birth: formatDate(member.date_of_birth),
            gender: member.gender || '',
            pre_existing: Boolean(member.pre_existing),
            insured_member_medical_condition: Boolean(member.insured_member_medical_condition),
            insured_member_medical_remarks: member.insured_member_medical_remarks || '',
            documents: member.documents || [],
          })),
          
          // Nominee payment information
          nominee_payment: {
            nominee_salutation: policy.nominee_payment?.nominee_salutation || '',
            nominee_name: policy.nominee_payment?.nominee_name || '',
            nominee_relation: policy.nominee_payment?.nominee_relation || '',
            nominee_dob: formatDate(policy.nominee_payment?.nominee_dob),
            payment_mode: policy.nominee_payment?.payment_mode || '',
            payment_reference: policy.nominee_payment?.payment_reference || '',
            bank_name: policy.nominee_payment?.bank_name || '',
            bank_account_number: policy.nominee_payment?.bank_account_number || '',
            bank_ifsc_code: policy.nominee_payment?.bank_ifsc_code || '',
            bank_branch_name: policy.nominee_payment?.bank_branch_name || '',
          },
        };
        
        console.log('Form data to be set:', formData);
        
        // Reset form with comprehensive data
        reset(formData);
        
        // Force update form fields that might not be properly set
        setTimeout(() => {
          // Ensure dropdown values are properly set
          if (policy.company_id) {
            setValue('company_id', policy.company_id);
          }
          if (policy.policy_type_id) {
            setValue('policy_type_id', policy.policy_type_id);
          }
          if (policy.policy_group_id) {
            setValue('policy_group_id', policy.policy_group_id);
          }
          if (policy.policy_name_id) {
            setValue('policy_name_id', policy.policy_name_id);
          }
          if (policy.plan_type) {
            setValue('plan_type', policy.plan_type);
          }
          if (policy.policy_creation_status) {
            setValue('policy_creation_status', policy.policy_creation_status);
          }
          
          // Ensure proposer dropdown fields are set
          if (policy.proposer?.gender) {
            setValue('proposer.gender', policy.proposer.gender);
          }
          if (policy.proposer?.marital_status) {
            setValue('proposer.marital_status', policy.proposer.marital_status);
          }
          
          // Ensure member dropdown fields are set
          (policy.members || []).forEach((member: Member, index: number) => {
            if (member.relation_to_proposer) {
              setValue(`members.${index}.relation_to_proposer`, member.relation_to_proposer);
            }
            if (member.gender) {
              setValue(`members.${index}.gender`, member.gender);
            }
          });
          
          // Ensure nominee dropdown fields are set
          if (policy.nominee_payment?.nominee_relation) {
            setValue('nominee_payment.nominee_relation', policy.nominee_payment.nominee_relation);
          }
          if (policy.nominee_payment?.payment_mode) {
            setValue('nominee_payment.payment_mode', policy.nominee_payment.payment_mode);
          }
          
          // Explicitly set commission/emi/commission amount fields as numbers
          if (typeof policy.emi_amount === 'number') {
            setValue('emi_amount', policy.emi_amount);
          }
          if (typeof policy.calculated_commission_amount === 'number') {
            setValue('calculated_commission_amount', policy.calculated_commission_amount);
          }
          
          console.log('Form values after reset:', watch());
        }, 100);
        
      } catch (error) {
        console.error('Error fetching policy details:', error);
        toast.error('Failed to load policy details');
      } finally {
        setIsLoading(false);
      }
    };

    if (policyId) {
    fetchPolicyDetails();
    }
  }, [policyId, reset, setValue, watch]);

  // Cleanup URLs when component unmounts
  useEffect(() => {
    return () => {
      if (previewDocument) {
        URL.revokeObjectURL(previewDocument.url);
      }
    };
  }, [previewDocument]);

  // Extract watched values to simple variables for effect dependencies
  const wStartDate = watch("start_date");
  const wTenureYears = watch("tenure_years");
  const wPremiumAmount = watch("premium_amount");
  const wPolicyNameId = watch("policy_name_id");
  const wCompanyId = watch("company_id");
  const wProposerDob = watch("proposer.date_of_birth");
  const wProposerGender = watch("proposer.gender");
  const wProposerSalutation = watch("proposer.proposer_salutation");
  const wSumInsured = watch("sum_insured");
  const wDeductibleStatus = watch("deductible_amount_status");
  const wPolicyCreationStatus = watch("policy_creation_status");
  const wProposerFullName = watch("proposer.full_name");
  const wMembers = watch("members");

  // Determine available statuses based on commission rules (like PolicyForm)
  const selectedPolicyName = policyNames.find(pn => pn.id === wPolicyNameId);
  const productName = selectedPolicyName?.name?.toUpperCase() || '';
  const companyName = companies.find(c => c.id === wCompanyId)?.name || '';

  // Check actual commission rules for this product to determine if it has complex classifications
  const productCommissionRules = commissionRules.filter(rule => rule.policy_name_id === wPolicyNameId);

  // Fallback to name-based classification only if no rules exist yet (for new products)
  const isOptimaSecure = productName.includes('OPTIMA SECURE');
  const isOtherRetailHealth = companyName === 'HDFC ERGO' && productName === 'OTHERS';
  const isSTU = companyName === 'HDFC ERGO' && productName === 'STU';
  const isPA = companyName === 'HDFC ERGO' && productName === 'PA';
  const isSME = companyName === 'HDFC ERGO' && productName === 'SME';
  const isTravel = companyName === 'HDFC ERGO' && productName === 'TRAVEL';

  let availableStatuses: ("Fresh" | "Renewal" | "Migration" | "Portablity")[] = ["Fresh", "Renewal", "Migration", "Portablity"];

  // Use actual rule classification if rules exist, otherwise fall back to name patterns
  if (productCommissionRules.length > 0) {
    // Extract unique statuses from actual rules
    const uniqueStatuses = Array.from(new Set(productCommissionRules.map(rule => rule.policyStatus).filter(Boolean)));
    if (uniqueStatuses.length > 0) {
      availableStatuses = uniqueStatuses as ("Fresh" | "Renewal" | "Migration" | "Portablity")[];
    }
  } else {
    // No rules yet - use name-based classification for backward compatibility
    if (isOptimaSecure || isOtherRetailHealth) {
      availableStatuses = ["Fresh", "Portablity", "Renewal"];
    } else if (isSTU) {
      availableStatuses = ["Fresh", "Portablity", "Renewal"];
    } else if (isPA || isSME) {
      availableStatuses = ["Fresh", "Renewal"];
    } else if (isTravel) {
      availableStatuses = ["Fresh", "Renewal"];
    }
  }


  // Auto-calculate end date based on start date and tenure years
  useEffect(() => {
    if (wStartDate && wTenureYears && wTenureYears > 0) {
      const start = new Date(wStartDate);
      const end = new Date(start);
      end.setFullYear(start.getFullYear() + wTenureYears);
      end.setDate(end.getDate() - 1);
      const endDateString = end.toISOString().split('T')[0];
      setValue("end_date", endDateString, { shouldValidate: true });
    }
  }, [wStartDate, wTenureYears, setValue]);

  // Keep customer_name in sync with proposer full name during updates
  useEffect(() => {
    setValue("customer_name", wProposerFullName || "", { shouldValidate: true });
  }, [wProposerFullName, setValue]);

  // Auto-populate member fields when relation is "Self" and keep in sync with proposer
  useEffect(() => {
    if (!Array.isArray(wMembers)) return;

    wMembers.forEach((member, idx) => {
      if (member?.relation_to_proposer === "Self") {
        const currentName = member?.name || "";
        const currentDob = member?.date_of_birth || "";
        const currentGender = member?.gender || "";
        const currentSalutation = member?.insured_member_salutation || "";

        if ((wProposerFullName || "") !== currentName) {
          setValue(`members.${idx}.name`, wProposerFullName || "", { shouldValidate: true });
        }
        if ((wProposerDob || "") !== currentDob) {
          setValue(`members.${idx}.date_of_birth`, wProposerDob || "", { shouldValidate: true });
        }
        if ((wProposerGender || "") !== currentGender) {
          setValue(`members.${idx}.gender`, wProposerGender || "", { shouldValidate: true });
        }
        if ((wProposerSalutation || "") !== currentSalutation) {
          setValue(`members.${idx}.insured_member_salutation`, wProposerSalutation || "", { shouldValidate: true });
        }
      }
    });
  }, [wMembers, wProposerFullName, wProposerDob, wProposerGender, wProposerSalutation, setValue]);

  // Commission calculation function
  const calculateCommission = useCallback(async () => {
    const premiumAmount = wPremiumAmount;
    const policyNameId = wPolicyNameId;
    const proposerDob = wProposerDob;
    const sumInsured = wSumInsured;
    const deductibleStatus = wDeductibleStatus;
    const policyCreationStatus = wPolicyCreationStatus || "Fresh";

    console.log('🔍 [Commission Debug] Input values:', {
      premiumAmount,
      policyNameId,
      proposerDob,
      sumInsured,
      deductibleStatus,
      policyCreationStatus,
    });

    // Only calculate if we have the minimum required fields
    if (!premiumAmount || !policyNameId || !proposerDob || !sumInsured) {
      setCalculatedCommission({
        calculated_commission_amount: 0,
        base_percentage: 0,
        rule_found: false,
      });
      return;
    }

    setIsCalculatingCommission(true);
    try {
      const result = await commissionCalculationService.calculateCommission({
        policy_name_id: policyNameId,
        policy_creation_status: policyCreationStatus,
        proposer_dob: proposerDob,
        sum_insured: sumInsured,
        deductible_amount_status: deductibleStatus || false,
        premium_amount: premiumAmount, // Use GST-exclusive amount (same as PolicyForm)
      });

      console.log('🔍 [Commission Debug] Result:', result);
      setCalculatedCommission(result);
    } catch (error) {
      console.error('Error calculating commission:', error);
      setCalculatedCommission({
        calculated_commission_amount: 0,
        base_percentage: 0,
        rule_found: false,
      });
    } finally {
      setIsCalculatingCommission(false);
    }
  }, [wPremiumAmount, wPolicyNameId, wProposerDob, wSumInsured, wDeductibleStatus, wPolicyCreationStatus]);

  // Calculate commission when relevant fields change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      calculateCommission();
    }, 200); // Reduced debounce to 200ms for faster response

    return () => clearTimeout(timeoutId);
  }, [calculateCommission, wPolicyCreationStatus]);

  const onFormSubmit = async (data: PolicyFormData) => {
    setIsSubmitting(true);
    try {
      console.log('🚀 [UPDATE] Starting policy update...');
      
      // Build FormData exactly like PolicyForm.tsx
      const formData = new FormData();
      
      // Convert boolean fields from string to boolean
      const processedData = { ...data };
      if (processedData.gst_status !== undefined) {
        processedData.gst_status = Boolean(processedData.gst_status);
      }
      
      // Helper function to check if a value is empty or undefined
      // For updates, omit empty strings and undefined/null to avoid backend enum/format errors
      const isEmptyOrUndefined = (value: unknown): boolean => {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string' && value.trim() === '') return true;
        return false;
      };

      const isValidEmail = (val: unknown): boolean => {
        if (typeof val !== 'string' || val.trim() === '') return false;
        return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(val.trim());
      };

      const isValidMobile = (val: unknown): boolean => {
        if (typeof val !== 'string' || val.trim() === '') return false;
        return /^[0-9]{10}$/.test(val.trim());
      };
      
      // Append all primitive fields (only if not empty/undefined)
      Object.entries(processedData).forEach(([key, value]) => {
        if (typeof value !== "object" || value === null || value instanceof Date) {
          if (isEmptyOrUndefined(value)) return;
          // Coerce numeric fields
          if (key === 'emi_amount' && typeof value === 'string') {
            const num = parseFloat(value);
            if (!isNaN(num)) {
              formData.append(key, String(num));
            }
            return;
          }
          formData.append(key, String(value));
        }
      });
      
      // Clean and process members - preserve all fields including empty strings for updates
      const processedMembers = processedData.members?.map(member => {
        const cleanedMember = cleanObject({
          ...member,
          insured_member_salutation: member.insured_member_salutation || "",
          name: member.name || "",
          relation_to_proposer: member.relation_to_proposer || "",
          date_of_birth: member.date_of_birth || "",
          gender: member.gender || "",
          pre_existing: member.pre_existing ?? false,
          insured_member_medical_condition: member.insured_member_medical_condition ?? false,
          insured_member_medical_remarks: member.insured_member_medical_remarks ?? "",
        }) as Record<string, unknown>;
        return cleanedMember;
      }).filter(member => Object.keys(member as Record<string, unknown>).length > 0) || [];
      
      // Clean proposer: omit empty/invalid optional fields that cause BE validation
      const proposerRaw = { ...(processedData.proposer ?? {}) } as Record<string, unknown>;
      // Use helpers so they aren't flagged as unused and to enforce validity
      if (!isValidEmail(proposerRaw.email)) delete proposerRaw.email;
      if (!isValidMobile(proposerRaw.alternate_mobile)) delete proposerRaw.alternate_mobile;
      if (!proposerRaw.gender) delete proposerRaw.gender;
      if (!proposerRaw.marital_status) delete proposerRaw.marital_status;
      const cleanedProposer = cleanObject(proposerRaw) as Record<string, unknown>;
      if (Object.keys(cleanedProposer).length > 0) {
        formData.append("proposer", JSON.stringify(cleanedProposer));
      }
      
      const cleanedNomineePayment = cleanObject(data.nominee_payment ?? {}) as Record<string, unknown>;
      if (Object.keys(cleanedNomineePayment).length > 0) {
        formData.append("nominee_payment", JSON.stringify(cleanedNomineePayment));
      }
      
      if (processedMembers.length > 0) {
        formData.append("insured_members", JSON.stringify(processedMembers));
      }
      
      // Debug: Log the processed members data being sent
      console.log("🔍 [UPDATE] Processed members data:", processedMembers);
      
      // Add calculated commission amount
      if (calculatedCommission.rule_found) {
        formData.append("calculated_commission_amount", calculatedCommission.calculated_commission_amount.toString());
      }

      // Add member deletion tracking - use tracked deleted member IDs
      if (deletedMemberIds.length > 0) {
        formData.append("insured_members_to_delete", JSON.stringify(deletedMemberIds));
      }
      
      // Attach files with metadata for member association
      policyDocs.forEach((file) => formData.append("policyDocs", file));
      proposerDocs.forEach((file) => formData.append("proposerDocs", file));
      
      // Attach member documents with metadata for proper association
      Object.entries(memberDocs).forEach(([memberIndex, files]) => {
        files.forEach((file) => formData.append(`memberDocs_${memberIndex}`, file));
      });

      // Send PATCH request
      const token = localStorage.getItem("authToken");
      const headers = { Authorization: `Bearer ${token}` }; // Remove Content-Type!

      const response = await axios.patch(
        `${(import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '')}/api/v1/policies/${policyId}`,
        formData,
        { headers }
      );

      console.log('✅ [UPDATE] Policy updated successfully:', response.data);
      toast.success("Policy updated successfully!");
      // Reset deleted member IDs after successful submission
      setDeletedMemberIds([]);
      // Clear new file uploads since they've been submitted
      setPolicyDocs([]);
      setProposerDocs([]);
      setMemberDocs({});
      // Re-fetch policy data to refresh document lists
      const policyRes = await axios.get(
        `${(import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '')}/api/v1/policies/${policyId}`,
        { headers }
      );
      const policy = policyRes.data.data || policyRes.data;
      
      // Re-process and categorize documents from the updated policy
      const allDocs: PolicyDocument[] = policy.documents || [];
      const referencedDocs: PolicyDocument[] = (policy.document_references || []).map((ref: { id: string; transition_type: string; source_document: PolicyDocument }) => ({
        ...ref.source_document,
        is_referenced: true,
        reference_id: ref.id,
        transition_type: ref.transition_type
      }));
      const combinedDocs = [...allDocs, ...referencedDocs];
      
      const proposerDocsFromPolicy: PolicyDocument[] = policy.proposer?.documents || [];
      
      const getProposerDocs = (docs: PolicyDocument[]) => 
        docs.filter((doc: PolicyDocument) => 
          doc.category === 'PROPOSER_DOCUMENT' || 
          doc.document_type === 'PROPOSER_DOCUMENT' ||
          doc.document_type === 'proposer' ||
          doc.category === 'proposer'
        );
      
      const combinedProposerDocs = [
        ...getProposerDocs(combinedDocs),
        ...getProposerDocs(proposerDocsFromPolicy),
      ];
      setExistingProposerDocs(combinedProposerDocs);
      
      onSubmit();
      if (onClose) onClose();
    } catch (error) {
      console.error('❌ [UPDATE] Policy update failed:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string | { message: string }[] } } };
        if (axiosError.response?.data?.error) {
          if (Array.isArray(axiosError.response.data.error)) {
            toast.error(`Validation error: ${axiosError.response.data.error.map((e: { message: string }) => e.message).join(', ')}`);
          } else {
            toast.error(`Error: ${axiosError.response.data.error}`);
          }
        } else {
          toast.error("Failed to update policy");
        }
      } else {
        toast.error("Failed to update policy");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const addNewMember = () => {
    appendMember({
      insured_member_salutation: "",
      name: "",
      relation_to_proposer: "",
      date_of_birth: "",
      gender: "",
      pre_existing: false,
      insured_member_medical_condition: false,
      insured_member_medical_remarks: "",
      documents: [],
    });
    
    setTimeout(() => {
      const addMemberButton = document.querySelector('[data-add-member-button]');
      if (addMemberButton) {
        addMemberButton.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end'
        });
      }
      
      const memberCards = document.querySelectorAll('[data-member-card]');
      const lastMemberCard = memberCards[memberCards.length - 1];
      if (lastMemberCard) {
        const firstInput = lastMemberCard.querySelector('input[type="text"]') as HTMLInputElement;
        if (firstInput) {
          setTimeout(() => firstInput.focus(), 200);
        }
      }
    }, 100);
  };

  // Handle document deletion
  const handleDeleteDocument = async (documentId: string, documentName: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${documentName}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteDocument(documentId);
      toast.success("Document deleted successfully");
      
      // Remove from state by document ID
      setExistingPolicyDocs(prev => prev.filter(doc => doc.id !== documentId));
      setExistingProposerDocs(prev => prev.filter(doc => doc.id !== documentId));
      
      // Remove from member docs by checking all member groups
      setExistingMemberDocs(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(memberId => {
          updated[memberId] = updated[memberId].filter(doc => doc.id !== documentId);
          // Remove empty member groups
          if (updated[memberId].length === 0) {
            delete updated[memberId];
          }
        });
        return updated;
      });
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  // Handle document reference deletion (for referenced documents)
  const handleDeleteDocumentReference = async (referenceId: string, documentName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove the reference to "${documentName}"? This will remove the document from this policy but keep the original document intact.`
    );
    if (!confirmed) return;

    try {
      await PolicyTransitionService.deleteDocumentReference(referenceId);
      toast.success("Document reference removed successfully");
      
      // Remove from state by reference ID
      setExistingPolicyDocs(prev => prev.filter(doc => doc.reference_id !== referenceId));
      setExistingProposerDocs(prev => prev.filter(doc => doc.reference_id !== referenceId));
      
      // Remove from member docs by checking all member groups
      setExistingMemberDocs(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(memberId => {
          updated[memberId] = updated[memberId].filter(doc => doc.reference_id !== referenceId);
          // Remove empty member groups
          if (updated[memberId].length === 0) {
            delete updated[memberId];
          }
        });
        return updated;
      });
    } catch (error) {
      console.error("Error deleting document reference:", error);
      toast.error("Failed to remove document reference");
    }
  };

  // Handle document preview - uses documentService with fallback
  const handleViewDocument = async (doc: PolicyDocument) => {
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
          name: doc.original_name || doc.file_name || "Document",
          type: doc.file_type,
        });
        setPreviewModalOpen(true);
      } else {
        console.error("Could not get document URL from service, trying fallback");
        // Fallback: construct URL directly from relative_path
        if (doc.relative_path) {
          const fallbackUrl = documentService.constructDirectUrl(doc.relative_path);
          console.log("Using fallback URL:", fallbackUrl);
          setPreviewDocument({
            url: fallbackUrl,
            name: doc.original_name || doc.file_name || "Document",
            type: doc.file_type,
          });
          setPreviewModalOpen(true);
        } else {
          console.error("No relative_path available for fallback");
          toast.error("Could not load document");
        }
      }
    } catch (error) {
      console.error("Error fetching document URL:", error);
      // Fallback: construct URL directly from relative_path
      if (doc.relative_path) {
        const fallbackUrl = documentService.constructDirectUrl(doc.relative_path);
        console.log("Using fallback URL from error handler:", fallbackUrl);
        setPreviewDocument({
          url: fallbackUrl,
          name: doc.original_name || doc.file_name || "Document",
          type: doc.file_type,
        });
        setPreviewModalOpen(true);
      } else {
        toast.error("Could not load document");
      }
    }
  };


  // Validate file types
  const validateFileType = (files: FileList | null) => {
    if (!files) return [];
    
    const allowedTypes = [
      'application/pdf',
      'image/jpeg', 
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];
    
    Array.from(files).forEach(file => {
      if (allowedTypes.includes(file.type)) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });
    
    if (invalidFiles.length > 0) {
      toast.error(`Invalid file types: ${invalidFiles.join(', ')}. Only PDF, JPG, PNG, DOC, XLSX, XLS, and CSV files are allowed.`);
    }
    
    return validFiles;
  };

  // Sanitize numeric inputs to allow only digits and limit to 10 characters
  const handleNumericInput: FormEventHandler<HTMLInputElement> = (e) => {
    const input = e.currentTarget;
    input.value = input.value.replace(/\D/g, "").slice(0, 10);
  };

  // Preview uploaded file in new tab
  const openDocumentPreview = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewDocument({
      url,
      name: file.name,
      type: file.type
    });
    setPreviewModalOpen(true);
  };

  // Cleanup function for modal
  const closeDocumentPreview = () => {
    setPreviewModalOpen(false);
    if (previewDocument) {
      URL.revokeObjectURL(previewDocument.url);
    }
    setPreviewDocument(null);
  };

  // Document display component
  const DocumentButton = ({ doc, onView, onDelete, onDeleteReference }: { 
    doc: PolicyDocument; 
    onView: (doc: PolicyDocument) => void;
    onDelete: (id: string, name: string) => void;
    onDeleteReference?: (referenceId: string, name: string) => void;
  }) => {
    const ext = (doc.original_name || doc.file_name || '').split('.').pop()?.toLowerCase() || '';
    const isReferenced = doc.is_referenced;
    const canDeleteReference = isReferenced && doc.reference_id && onDeleteReference;
    
    return (
      <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onView(doc)}
                className="text-left justify-start flex items-center gap-2"
              >
                {getFileIcon(ext)}
                {truncateName(doc.original_name || doc.file_name || 'Document')}
                {isReferenced && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded ml-1">
                    Referenced
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>
                {doc.original_name || doc.file_name || 'Document'}
                {isReferenced && ` (Referenced from parent policy)`}
              </span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* Show delete button for non-referenced documents */}
        {!isReferenced && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => onDelete(doc.id!, doc.original_name || doc.file_name || 'Document')}
            className="px-3"
            title="Delete document"
          >
            <Trash className="w-5 h-5" />
          </Button>
        )}
        
        {/* Show remove reference button for removable referenced documents */}
        {canDeleteReference && (
          <Button
            type="button"
            size="sm"
            onClick={() => onDeleteReference!(doc.reference_id!, doc.original_name || doc.file_name || 'Document')}
            className="px-1 text-black"
            title="Remove document reference"
          >
            <Trash className="w-4 h-4" />
          </Button>
        )}
        
        {/* Show read-only indicator for non-removable referenced documents */}
        {isReferenced && !canDeleteReference && (
          <span className="text-xs text-gray-500 px-2 py-1">
            Read-only
          </span>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading policy details...</p>
        </div>
      </div>
    );
  }

  // Get dynamic deductible options based on selected company
  const selectedCompanyId = watch("company_id");
  const selectedCompany = companies.find(c => c.id === selectedCompanyId);
  
  const DEDUCTIBLE_OPTIONS: Record<string, number[]> = {
    "HDFC ERGO": [25000, 50000, 100000, 200000, 300000, 500000],
    "STAR HEALTH": [25000, 50000, 100000],
    "NIVA BUPA": [20000, 30000, 50000, 100000],
    "CARE HEALTH": [25000],
  };
  const HIDE_DEDUCTIBLE_FOR = ["ICICI LOMBARD"];

  const deductibleOptions = selectedCompany ? DEDUCTIBLE_OPTIONS[selectedCompany.name] : undefined;
  const hideDeductible = selectedCompany && HIDE_DEDUCTIBLE_FOR.includes(selectedCompany.name);

  // Recursively remove empty string/null/undefined from objects/arrays
  const cleanObject = (obj: unknown): unknown => {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) {
      return obj
        .map((item) => cleanObject(item))
        .filter((item) => !(typeof item === 'string' && item.trim() === '') && item !== null && item !== undefined);
    }
    if (typeof obj === 'object') {
      const cleaned: Record<string, unknown> = {};
      Object.entries(obj as Record<string, unknown>).forEach(([k, v]) => {
        if (!(v === null || v === undefined || (typeof v === 'string' && v.trim() === ''))) {
          cleaned[k] = cleanObject(v);
        }
      });
      return cleaned;
    }
    return obj;
  };

  return (
    <div className="max-w-7xl mx-auto bg-white rounded-lg border border-gray-200 shadow-lg p-4 mt-4">
      {/* <div className="flex justify-between items-center mb-4 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border-l-4 border-blue-600">
        <h2 className="text-lg font-bold text-blue-800">
          Edit Policy
        </h2>
        {/* {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 w-7 p-0 hover:bg-blue-100"
          >
            <X className="h-4 w-4" />
          </Button>
        )} */}
      {/* </div> */}
      
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {/* Proposer Info */}
        <div className="bg-blue-50 p-3 rounded-md border-l-4 border-blue-600 mb-3">
          <h3 className="text-base font-semibold text-blue-800 mb-0">Policy Holder Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Salutation
            </label>
            <Select
              value={watch("proposer.proposer_salutation")}
              onValueChange={(value) =>
                setValue("proposer.proposer_salutation", value, { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue placeholder="Select salutation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mr.">Mr.</SelectItem>
                <SelectItem value="Mrs.">Mrs.</SelectItem>
                <SelectItem value="Ms.">Ms.</SelectItem>
                <SelectItem value="Dr.">Dr.</SelectItem>
                <SelectItem value="Prof.">Prof.</SelectItem>
                <SelectItem value="Capt.">Capt.</SelectItem>
                <SelectItem value="Col.">Col.</SelectItem>
                <SelectItem value="Lt.">Lt.</SelectItem>
                <SelectItem value="Smt.">Smt.</SelectItem>
                <SelectItem value="Shri">Shri</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Full Name *
            </label>
            <Input 
              {...register("proposer.full_name", {
                required: "Full name is required",
                minLength: { value: 1, message: "Full name is required" }
              })} 
              className={`h-9 text-sm ${errors.proposer?.full_name ? 'border-red-500' : ''}`}
            />
            {errors.proposer?.full_name && (
              <p className="text-xs text-red-500 mt-1">{String(errors.proposer.full_name.message)}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Date of Birth *
            </label>
            <Input 
              type="date" 
              min={new Date(1900, 0, 1).toISOString().split('T')[0]}
              max={new Date().toISOString().split('T')[0]}
              {...register("proposer.date_of_birth", { required: "Date of birth is required" })} 
              className={`h-9 text-sm ${errors.proposer?.date_of_birth ? 'border-red-500' : ''}`}
            />
            {errors.proposer?.date_of_birth && (
              <p className="text-xs text-red-500 mt-1">{String(errors.proposer.date_of_birth.message)}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Gender
            </label>
            <Select
              value={watch("proposer.gender")}
              onValueChange={(value) =>
                setValue("proposer.gender", value, { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Marital Status
            </label>
            <Select
              value={watch("proposer.marital_status")}
              onValueChange={(value) =>
                setValue("proposer.marital_status", value, { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue placeholder="Select marital status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Single">Single</SelectItem>
                <SelectItem value="Married">Married</SelectItem>
                <SelectItem value="Divorced">Divorced</SelectItem>
                <SelectItem value="Widowed">Widowed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Mobile Number *
            </label>
            <Input 
              {...register("proposer.mobile", {
                required: "Mobile number is required",
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: "Please enter a valid 10-digit mobile number"
                }
              })} 
              placeholder="10-digit number"
              onInput={handleNumericInput}
              maxLength={10}
              inputMode="numeric"
              className={`h-9 text-sm ${errors.proposer?.mobile ? 'border-red-500' : ''}`}
            />
            {errors.proposer?.mobile && (
              <p className="text-xs text-red-500 mt-1">{String(errors.proposer.mobile.message)}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Alternate Mobile
            </label>
            <Input 
              {...register("proposer.alternate_mobile", {
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: "Please enter a valid 10-digit mobile number"
                }
              })} 
              placeholder="Optional"
              onInput={handleNumericInput}
              maxLength={10}
              inputMode="numeric"
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Email Address
            </label>
            <Input 
              type="email" 
              {...register("proposer.email")} 
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              KYC ID
            </label>
            <Input 
              {...register("proposer.kyc_id")} 
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Occupation
            </label>
            <Input 
              {...register("proposer.occupation")} 
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Nationality
            </label>
            <Input 
              {...register("proposer.nationality")} 
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1 col-span-2">
            <label className="block text-xs font-semibold text-gray-700">
              Address
            </label>
            <Input 
              {...register("proposer.address")} 
              className="h-9 text-sm"
            />
          </div>
        </div>
        
        {/* Proposer Documents */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-700">
            Upload Proposer Documents
          </label>
          <div className="border border-gray-300 rounded p-1  flex items-center gap-2  hover:cursor-pointer w-[400px] h-[50px] align-middle">
            <Input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              max={5}
              onChange={(e) => {
                const incoming = validateFileType(e.target.files);
                setProposerDocs(prev => {
                  const available = Math.max(0, 5 - prev.length);
                  const toAdd = incoming.slice(0, available);
                  if (incoming.length > available) {
                    toast.error("You can upload a maximum of 5 proposer documents");
                  }
                  return [...prev, ...toAdd];
                });
              }}
              className="text-xs cursor-pointer file:cursor-pointer w-[200px] h-[30px] p-1 pl-3 text-center"
            />
            <p className=" text-xs text-gray-500 mt-1">
              PDF, JPG, PNG, DOC (max 5 files)
            </p>
          </div>
          
          {proposerDocs.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {proposerDocs.map((file, index) => (
                <div key={file.name} className="flex items-center gap-1 p-1 border border-blue-200 rounded bg-blue-50 text-xs">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => openDocumentPreview(file)}
                    className="text-blue-600 hover:bg-blue-100 flex-1 justify-start text-xs p-1"
                  >
                    {file.name}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newFiles = proposerDocs.filter((_, i) => i !== index);
                      setProposerDocs(newFiles);
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
          
          {/* Existing Proposer Documents */}
          {existingProposerDocs.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-600 mb-3">Existing Proposer Documents:</p>
              <div className="flex flex-wrap gap-1">
                {existingProposerDocs.map((doc) => (
                  <DocumentButton
                    key={doc.id}
                    doc={doc}
                    onView={handleViewDocument}
                    onDelete={handleDeleteDocument}
                    onDeleteReference={handleDeleteDocumentReference}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Policy Details */}
        <div className="bg-green-50 p-3 rounded-md border-l-4 border-green-600 mb-3">
          <h3 className="text-base font-semibold text-green-800 mb-0">Policy Details</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Policy Number *
            </label>
            <Input 
              {...register("policy_number")} 
              className="h-9 text-sm"
            />
          </div>
          {/* <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Policy Salutation
            </label>
            <Select
              value={watch("policy_salutation")}
              onValueChange={(value) =>
                setValue("policy_salutation", value, { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue placeholder="Select salutation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mr.">Mr.</SelectItem>
                <SelectItem value="Mrs.">Mrs.</SelectItem>
                <SelectItem value="Ms.">Ms.</SelectItem>
                <SelectItem value="Dr.">Dr.</SelectItem>
                <SelectItem value="Prof.">Prof.</SelectItem>
                <SelectItem value="Capt.">Capt.</SelectItem>
                <SelectItem value="Col.">Col.</SelectItem>
                <SelectItem value="Lt.">Lt.</SelectItem>
                <SelectItem value="Smt.">Smt.</SelectItem>
                <SelectItem value="Shri">Shri</SelectItem>
              </SelectContent>
            </Select>
          </div> */}
          {/* <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Customer Name
            </label>
            <Input 
              {...register("customer_name")} 
              className="h-9 text-sm"
            />
          </div> */}
          {/* Hidden field to submit customer_name synced from proposer.full_name */}
          <input
            type="hidden"
            value={watch("customer_name") || ''}
            {...register("customer_name")}
          />
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Policy Group *
            </label>
            <Select
              value={watch("policy_group_id")}
              onValueChange={(value) =>
                setValue("policy_group_id", value, { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue placeholder="Select policy group" />
              </SelectTrigger>
              <SelectContent>
                {(policyGroups || []).map((pt) => (
                  <SelectItem key={pt.id} value={pt.id}>
                    {pt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Insurance Company
            </label>
            <Select
              value={watch("company_id")}
              onValueChange={(value) =>
                setValue("company_id", value, { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                {(companies || []).map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Policy Type
            </label>
            <Select
              value={watch("policy_type_id")}
              onValueChange={(value) =>
                setValue("policy_type_id", value, { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue placeholder="Select policy type" />
              </SelectTrigger>
              <SelectContent>
                {(policyTypes || []).map((pt) => (
                  <SelectItem key={pt.id} value={pt.id}>
                    {pt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Product Name
            </label>
            <Select
              value={watch("policy_name_id")}
              onValueChange={(value) =>
                setValue("policy_name_id", value, { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue placeholder="Select policy name" />
              </SelectTrigger>
              <SelectContent>
                {(() => {
                  const company = companies.find(c => c.id === watch('company_id'));
                  let filtered = policyNames || [];

                  // Filter by selected company
                  if (company) {
                    filtered = filtered.filter((pn) => pn.company_id === company.id);
                  }

                  // Deduplicate by name to ensure no duplicate product names
                  const uniqueMap = new Map(filtered.map(pn => [pn.name, pn]));
                  return Array.from(uniqueMap.values())
                    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
                    .map((pn) => (
                      <SelectItem key={pn.id} value={pn.id}>
                        {pn.name}
                      </SelectItem>
                    ));
                })()}
              </SelectContent>
            </Select>
          </div>
          {/* <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Insurer Name
            </label>
            <Input 
              {...register("insurer_name")} 
              className="h-9 text-sm"
            />
          </div> */}
          {/* <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Product Name
            </label>
            <Input 
              {...register("product_name")} 
              className="h-9 text-sm"
            />
          </div> */}
          {/* <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Plan Type
            </label>
            <Select
              value={watch("plan_type")}
              onValueChange={(value) =>
                setValue("plan_type", value, { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue placeholder="Select plan type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Individual">Individual</SelectItem>
                <SelectItem value="Family Floater">Family Floater</SelectItem>
                <SelectItem value="Group">Group</SelectItem>
              </SelectContent>
            </Select>
          </div> */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Sum Insured (₹)
            </label>
            <Input 
              type="number" 
              {...register("sum_insured")} 
              className="h-9 text-sm"
            />
          </div>
                     {/* GST Status */}
           <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              GST Status
            </label>
            <Select
              value={watch("gst_status") ? "Yes" : "No"}
              onValueChange={(value) =>
                setValue("gst_status", value === "Yes", { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue placeholder="Select GST status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="No">No</SelectItem>
                <SelectItem value="Yes">Yes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Premium Amount (₹)
            </label>
            <Input 
              type="number" 
              step="0.01" 
              value={premiumAmountInput || (watch("premium_amount") ? 
                Number(watch("premium_amount")).toFixed(2) 
                : "")}
              onChange={(e) => {
                const inputValue = e.target.value;
                setPremiumAmountInput(inputValue);
                setValue("premium_amount", parseFloat(inputValue) || 0, { shouldValidate: true });
              }}
              onBlur={() => {
                // Clear local input state when field loses focus
                setPremiumAmountInput("");
              }}
              placeholder="Enter premium amount"
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Tenure (Years)
            </label>
            <Input
              type="number"
              min={1}
              max={100}
              onInput={(e) => {
                const input = e.currentTarget;
                const value = parseInt(input.value, 10);
                if (value > 100) input.value = "100";
                else if (value < 1) input.value = "1";
              }}
              {...register("tenure_years", {
                setValueAs: (v) => {
                  if (v === '' || v === null || v === undefined) return undefined;
                  const n = typeof v === 'number' ? v : parseInt(String(v), 10);
                  return isNaN(n) ? undefined : n;
                },
                validate: (v) => {
                  if (v === undefined ) return true; // optional on update
                  return (v >= 1 && v <= 100) || "Tenure must be between 1 and 100";
                },
              })}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Start Date 
            </label>
            <Input 
              type="date" 
              min={new Date(1900, 0, 1).toISOString().split('T')[0]}
              max={new Date().toISOString().split('T')[0]}
              {...register("start_date")} 
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              End Date 
            </label>
            <Input 
              type="date"
              min={watch("start_date") || new Date(1900, 0, 1).toISOString().split('T')[0]}
              {...register("end_date")} 
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Issued Date
            </label>
            <Input 
              type="date" 
              min={new Date(1900, 0, 1).toISOString().split('T')[0]}
              max={new Date().toISOString().split('T')[0]}
              {...register("issued_date")} 
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Policy Status
            </label>
            <Select
              value={watch("policy_creation_status")}
              onValueChange={(value) =>
                setValue("policy_creation_status", value as 'Fresh' | 'Renewal' | 'Migration' | 'Portablity', { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === "Migration" ? "Internal Portability" : status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
        EMI Amount
            </label>
      <Input
        type="number"
        step="0.01"
        {...register("emi_amount", {
          setValueAs: (v) => {
            if (v === '' || v === null || v === undefined) return undefined;
            const n = typeof v === 'number' ? v : parseFloat(v);
            return isNaN(n) ? undefined : n;
          },
          min: { value: 0, message: "EMI amount must be 0 or greater" }
        })}
        className="h-9 text-sm"
      />
          </div>
          
          {/* Conditional Deductible Fields */}
          {deductibleOptions && !hideDeductible && (
            <>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Deductible Amount Status
                </label>
                <Select
                  value={watch("deductible_amount_status") ? "Yes" : "No"}
                  onValueChange={(value) =>
                    setValue("deductible_amount_status", value === "Yes", { shouldValidate: true })
                  }
                >
                  <SelectTrigger className="w-full h-9 text-sm">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No">No</SelectItem>
                    <SelectItem value="Yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {watch("deductible_amount_status") && (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Deductible Amount (₹)
                  </label>
                  <Select
                    value={watch("deductible_amount") ? String(watch("deductible_amount")) : ""}
                    onValueChange={value => setValue("deductible_amount", Number(value), { shouldValidate: true })}
                  >
                    <SelectTrigger className="w-full h-9 text-sm">
                      <SelectValue placeholder="Select amount" />
                    </SelectTrigger>
                    <SelectContent>
                      {deductibleOptions.map(opt => (
                        <SelectItem key={opt} value={String(opt)}>
                          {opt.toLocaleString("en-IN")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}
{/* Calculated Commission Display */}
<div className="space-y-1">
  <label className="block text-xs font-semibold text-gray-700">
    Calculated Commission Amount (₹)
  </label>
  <div className="relative">
    <Input
      type="number"
      value={calculatedCommission.calculated_commission_amount.toFixed(2)}
      readOnly
      className="h-9 text-sm bg-gray-50"
    />
    {isCalculatingCommission && (
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
      </div>
    )}
  </div>
  {/* Display SI condition and commission percentage */}
  {calculatedCommission.rule_found && (
    <div className="mt-1 text-xs text-gray-600">
      <span className="font-medium">{calculatedCommission.base_percentage}%</span>
      {calculatedCommission.si_condition && calculatedCommission.si_condition !== 'ALL_SI' && (
        <span> • {calculatedCommission.si_condition === 'LESS_THAN_10_LAKHS' ? 'SI < ₹10L' : calculatedCommission.si_condition === 'GREATER_EQUAL_10_LAKHS' ? 'SI ≥ ₹10L' : calculatedCommission.si_condition}</span>
      )}
      {calculatedCommission.custom_si_threshold && calculatedCommission.custom_si_operator && (
        <span> • SI {calculatedCommission.custom_si_operator === 'LESS_THAN' ? '<' : '>'} ₹{calculatedCommission.custom_si_threshold >= 100000 ? (calculatedCommission.custom_si_threshold / 100000).toFixed(0) + 'L' : calculatedCommission.custom_si_threshold.toLocaleString()}</span>
      )}
    </div>
  )}
  {!calculatedCommission.rule_found && watch("premium_amount") && watch("policy_name_id") && (
    <div className="text-xs text-orange-600 mt-1">
      No commission rule found for the selected criteria
    </div>
  )}
</div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Medical Condition
            </label>
            <Select
              value={watch("medical_condition") ? "Yes" : "No"}
              onValueChange={(value) =>
                setValue("medical_condition", value === "Yes", { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="No">No</SelectItem>
                <SelectItem value="Yes">Yes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          

          
          {/* Conditional Medical Remarks */}
          {watch("medical_condition") && (
            <div className="md:col-span-2 lg:col-span-4 space-y-1">
              <label className="block text-xs font-semibold text-gray-700">
                Medical Remarks
              </label>
              <Textarea 
                {...register("medical_remarks")}
                placeholder="Enter medical condition details..."
                rows={2}
                className="text-sm"
              />
            </div>
          )}

          


          {/* Policy Remarks */}
          <div className="md:col-span-2 lg:col-span-4 space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Policy Remarks
            </label>
            <Textarea 
              {...register("remarks")}
              placeholder="Enter any additional remarks or notes..."
              rows={2}
              className="text-sm"
            />
          </div>
        </div>

        {/* Policy Documents */}
        <div className="bg-purple-50 p-3 rounded-md border-l-4 border-purple-600 mb-3">
          <h3 className="text-base font-semibold text-purple-800 mb-0">Policy Documents</h3>
        </div>
        
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-700">
            Upload Policy Documents
          </label>
          <div className="border border-gray-300 rounded p-1 flex items-center gap-2 hover:cursor-pointer w-[400px] h-[50px] align-middle">
            <Input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx,.xls,.csv"
              onChange={(e) => {
                const incoming = validateFileType(e.target.files);
                setPolicyDocs(prev => {
                  const available = Math.max(0, 5 - prev.length);
                  const toAdd = incoming.slice(0, available);
                  if (incoming.length > available) {
                    toast.error("You can upload a maximum of 5 policy documents");
                  }
                  return [...prev, ...toAdd];
                });
              }}
              className="text-xs cursor-pointer file:cursor-pointer w-[200px] h-[30px] p-1 pl-3 text-center"
            />
            <p className="text-xs text-gray-500 mt-1">
              PDF, JPG, PNG, DOC, XLSX, CSV (max 5 files)
            </p>
          </div>
          
          {policyDocs.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {policyDocs.map((file, index) => (
                <div key={file.name} className="flex items-center gap-1 p-1 border border-purple-200 rounded bg-purple-50 text-xs">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => openDocumentPreview(file)}
                    className="text-purple-600 hover:bg-purple-100 flex-1 justify-start text-xs p-1"
                  >
                    {file.name}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newFiles = policyDocs.filter((_, i) => i !== index);
                      setPolicyDocs(newFiles);
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
          
          {/* Existing Policy Documents */}
          {existingPolicyDocs.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-600 mb-3">Existing Policy Documents:</p>
              <div className="flex flex-wrap gap-1">
                {existingPolicyDocs.map((doc, index) => (
                  <DocumentButton
                    key={doc.id || index}
                    doc={doc}
                    onView={handleViewDocument}
                    onDelete={handleDeleteDocument}
                    onDeleteReference={handleDeleteDocumentReference}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Members */}
        <div className="bg-indigo-50 p-3 rounded-md border-l-4 border-indigo-600 mb-3">
          <h3 className="text-base font-semibold text-indigo-800 mb-0">Insured Members</h3>
        </div>
        
        <div className="space-y-3">
          {memberFields.length === 0 && (
            <div className="text-gray-500 text-xs text-center py-4 bg-gray-50 rounded border-2 border-dashed border-gray-200">
              No members added yet. Click "Add Member" to add insured members.
            </div>
          )}
          
          {memberFields.map((field, index) => {
            const memberData = watch(`members.${index}`);
            const memberId = memberData?.id || field.id || `member-${index}`;
            let memberDocuments = existingMemberDocs[memberId] || [];
            
            // If no documents found for this member ID, try alternative lookups
            if (memberDocuments.length === 0) {
              // Try with the actual member data ID if available
              if (memberData?.id && existingMemberDocs[memberData.id]) {
                memberDocuments = existingMemberDocs[memberData.id];
              }
              
              // Last resort: check for any remaining unassigned documents
              if (memberDocuments.length === 0 && existingMemberDocs['unassigned']) {
                memberDocuments = existingMemberDocs['unassigned'];
              }
            }
            
            console.log(`Member ${index + 1} (ID: ${memberId}) documents:`, memberDocuments);
            
            return (
              <div 
                key={field.id} 
                className="border border-indigo-200 rounded-lg p-4 bg-indigo-50"
                data-member-card
              >
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-semibold text-indigo-800">Member {index + 1}</h4>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveMember(index)}
                    className="text-indigo-600 hover:bg-indigo-50 text-xs px-2 py-1"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      Salutation
                    </label>
                    <Select
                      value={watch(`members.${index}.insured_member_salutation`)}
                      onValueChange={(value) =>
                        setValue(`members.${index}.insured_member_salutation`, value, { shouldValidate: true })
                      }
                    >
                      <SelectTrigger className="w-full h-9 text-sm" disabled={watch(`members.${index}.relation_to_proposer`) === 'Self'}>
                        <SelectValue placeholder="Select salutation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mr.">Mr.</SelectItem>
                        <SelectItem value="Mrs.">Mrs.</SelectItem>
                        <SelectItem value="Ms.">Ms.</SelectItem>
                        <SelectItem value="Dr.">Dr.</SelectItem>
                        <SelectItem value="Prof.">Prof.</SelectItem>
                        <SelectItem value="Capt.">Capt.</SelectItem>
                        <SelectItem value="Col.">Col.</SelectItem>
                        <SelectItem value="Lt.">Lt.</SelectItem>
                        <SelectItem value="Smt.">Smt.</SelectItem>
                        <SelectItem value="Shri">Shri</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      Full Name *
                    </label>
                    <Input
                      {...register(`members.${index}.name` as const, {
                        required: "Member name is required",
                        minLength: { value: 1, message: "Member name is required" },
                      })}
                      className={`h-9 text-sm ${errors.members?.[index]?.name ? 'border-red-500' : ''}`}
                      disabled={watch(`members.${index}.relation_to_proposer`) === 'Self'}
                    />
                    {errors.members?.[index]?.name && (
                      <p className="text-xs text-red-500 mt-1">{String(errors.members?.[index]?.name?.message)}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      Relation *
                    </label>
                    <Select
                      value={watch(`members.${index}.relation_to_proposer`)}
                      onValueChange={(value) => {
                        setValue(`members.${index}.relation_to_proposer`, value, { shouldValidate: true });
                        if (value === 'Self') {
                          setValue(`members.${index}.name`, watch('proposer.full_name') || '', { shouldValidate: true });
                          setValue(`members.${index}.date_of_birth`, watch('proposer.date_of_birth') || '', { shouldValidate: true });
                          setValue(`members.${index}.gender`, watch('proposer.gender') || '', { shouldValidate: true });
                          setValue(`members.${index}.insured_member_salutation`, watch('proposer.proposer_salutation') || '', { shouldValidate: true });
                        }
                      }}
                    >
                      <SelectTrigger className="w-full h-9 text-sm">
                        <SelectValue placeholder="Select relation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Self">Self</SelectItem>
                        <SelectItem value="Spouse">Spouse</SelectItem>
                        <SelectItem value="Child">Child</SelectItem>
                        <SelectItem value="Parent">Parent</SelectItem>
                        <SelectItem value="Sibling">Sibling</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <input
                      type="hidden"
                      value={watch(`members.${index}.relation_to_proposer`) || ''}
                      {...register(`members.${index}.relation_to_proposer` as const, {
                        required: "Relation is required",
                      })}
                    />
                    {errors.members?.[index]?.relation_to_proposer && (
                      <p className="text-xs text-red-500 mt-1">{String(errors.members?.[index]?.relation_to_proposer?.message)}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      Date of Birth *
                    </label>
                    <Input
                      type="date"
                      min={new Date(1900, 0, 1).toISOString().split('T')[0]}
                      max={new Date().toISOString().split('T')[0]}
                      {...register(`members.${index}.date_of_birth` as const, {
                        required: "Date of birth is required",
                      })}
                      className={`h-9 text-sm ${errors.members?.[index]?.date_of_birth ? 'border-red-500' : ''}`}
                      disabled={watch(`members.${index}.relation_to_proposer`) === 'Self'}
                    />
                    {errors.members?.[index]?.date_of_birth && (
                      <p className="text-xs text-red-500 mt-1">{String(errors.members?.[index]?.date_of_birth?.message)}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      Gender *
                    </label>
                    <Select
                      value={watch(`members.${index}.gender`)}
                      onValueChange={(value) =>
                        setValue(`members.${index}.gender`, value, { shouldValidate: true })
                      }
                    >
                      <SelectTrigger className="w-full h-9 text-sm" disabled={watch(`members.${index}.relation_to_proposer`) === 'Self'}>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <input
                      type="hidden"
                      value={watch(`members.${index}.gender`) || ''}
                      {...register(`members.${index}.gender` as const, {
                        required: "Gender is required",
                      })}
                    />
                    {errors.members?.[index]?.gender && (
                      <p className="text-xs text-red-500 mt-1">{String(errors.members?.[index]?.gender?.message)}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      Medical Condition
                    </label>
                    <Select
                      value={watch(`members.${index}.insured_member_medical_condition`) ? "Yes" : "No"}
                      onValueChange={(value) =>
                        setValue(`members.${index}.insured_member_medical_condition`, value === "Yes", { shouldValidate: true })
                      }
                    >
                      <SelectTrigger className="w-full h-9 text-sm">
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="Yes">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {watch(`members.${index}.insured_member_medical_condition`) && (
                    <div className="md:col-span-2 lg:col-span-4 space-y-1">
                      <label className="block text-xs font-semibold text-gray-700">
                        Medical Remarks
                      </label>
                      <Textarea 
                        value={watch(`members.${index}.insured_member_medical_remarks`) || ''}
                        onChange={(e) =>
                          setValue(`members.${index}.insured_member_medical_remarks`, e.target.value, { shouldValidate: true })
                        }
                        placeholder="Enter medical condition details..."
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Member-specific Document Upload */}
                <div className="mt-4 p-3 bg-white rounded border border-indigo-200">
                  <h5 className="text-xs font-semibold text-indigo-700 mb-2">
                    Member {index + 1} Documents
                  </h5>
                  
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-700">
                      Upload Documents for {watch(`members.${index}.name`) || `Member ${index + 1}`}
                    </label>
                    <div className="border border-gray-300 rounded p-1 flex items-center gap-2 hover:cursor-pointer w-[400px] h-[50px] align-middle">
                      <Input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx,.xls,.csv"
                        onChange={(e) => {
                          const incoming = validateFileType(e.target.files);
                          setMemberDocs((prev) => {
                            const available = Math.max(0, 5 - (prev[index] || []).length);
                            const toAdd = incoming.slice(0, available);
                            if (incoming.length > available) {
                              toast.error("You can upload a maximum of 5 documents per member");
                            }
                            return {
                              ...prev,
                              [index]: [...(prev[index] || []), ...toAdd],
                            };
                          });
                        }}
                        className="text-xs cursor-pointer file:cursor-pointer w-[200px] h-[30px] p-1 pl-3 text-center"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        PDF, JPG, PNG, DOC, XLSX, CSV (max 5 files)
                      </p>
                    </div>
                    
                    {/* Show newly selected files */}
                    {(memberDocs[index] || []).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {(memberDocs[index] || []).map((file, fileIndex) => (
                          <div key={file.name} className="flex items-center gap-1 p-1 border border-indigo-200 rounded bg-indigo-50 text-xs">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => openDocumentPreview(file)}
                              className="text-indigo-600 hover:bg-indigo-100 flex-1 justify-start text-xs p-1"
                            >
                              {file.name}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setMemberDocs((prev) => ({
                                  ...prev,
                                  [index]: (prev[index] || []).filter((_, i) => i !== fileIndex),
                                }));
                              }}
                              className="text-gray-600 hover:bg-gray-100 px-1 text-xs"
                              title="Remove file"
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Show existing member documents */}
                    {memberDocuments.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-600 mb-3">Existing Documents:</p>
                        <div className="flex flex-wrap gap-1">
                          {memberDocuments.map((doc) => (
                            <DocumentButton
                              key={doc.id}
                              doc={doc}
                              onView={handleViewDocument}
                              onDelete={handleDeleteDocument}
                              onDeleteReference={handleDeleteDocumentReference}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {memberDocuments.length === 0 && (memberDocs[index] || []).length === 0 && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-500 text-center">
                        No documents uploaded for this member
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          <div className="mt-4 flex justify-end">
            <Button 
              type="button" 
              onClick={addNewMember} 
              className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 text-sm font-semibold"
              data-add-member-button
            >
              + Add Member
            </Button>
          </div>
        </div>

        {/* Nominee & Payment */}
        <div className="bg-teal-50 p-3 rounded-md border-l-4 border-teal-600 mb-3">
          <h3 className="text-base font-semibold text-teal-800 mb-0">Nominee Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Nominee Salutation
            </label>
            <Select
              value={watch("nominee_payment.nominee_salutation")}
              onValueChange={(value) =>
                setValue("nominee_payment.nominee_salutation", value, { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue placeholder="Select salutation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mr.">Mr.</SelectItem>
                <SelectItem value="Mrs.">Mrs.</SelectItem>
                <SelectItem value="Ms.">Ms.</SelectItem>
                <SelectItem value="Dr.">Dr.</SelectItem>
                <SelectItem value="Prof.">Prof.</SelectItem>
                <SelectItem value="Capt.">Capt.</SelectItem>
                <SelectItem value="Col.">Col.</SelectItem>
                <SelectItem value="Lt.">Lt.</SelectItem>
                <SelectItem value="Smt.">Smt.</SelectItem>
                <SelectItem value="Shri">Shri</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Nominee Name
            </label>
            <Input
              value={watch("nominee_payment.nominee_name")}
              onChange={(e) =>
                setValue("nominee_payment.nominee_name", e.target.value, { shouldValidate: true })
              }
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Relation to Proposer
            </label>
            <Select
              value={watch("nominee_payment.nominee_relation")}
              onValueChange={(value) =>
                setValue("nominee_payment.nominee_relation", value, { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue placeholder="Select relation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Self">Self</SelectItem>
                <SelectItem value="Spouse">Spouse</SelectItem>
                <SelectItem value="Child">Child</SelectItem>
                <SelectItem value="Parent">Parent</SelectItem>
                <SelectItem value="Sibling">Sibling</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Nominee Date of Birth
            </label>
            <Input
              type="date"
              min={new Date(1900, 0, 1).toISOString().split('T')[0]}
              max={new Date().toISOString().split('T')[0]}
              value={watch("nominee_payment.nominee_dob")}
              onChange={(e) =>
                setValue("nominee_payment.nominee_dob", e.target.value, { shouldValidate: true })
              }
              className="h-9 text-sm"
            />
          </div>



        </div>
        <div className="bg-indigo-50 p-3 rounded-md border-l-4 border-indigo-600 mb-3">
          <h3 className="text-base font-semibold text-indigo-800 mb-0">Payment Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Payment Mode
            </label>
            <Select
              value={watch("nominee_payment.payment_mode")}
              onValueChange={(value) =>
                setValue("nominee_payment.payment_mode", value, { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue placeholder="Select payment mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Cheque">Cheque</SelectItem>
                <SelectItem value="Online Transfer">Online Transfer</SelectItem>
                <SelectItem value="Credit Card">Credit Card</SelectItem>
                <SelectItem value="Debit Card">Debit Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Payment Reference
            </label>
            <Input
              value={watch("nominee_payment.payment_reference")}
              onChange={(e) =>
                setValue("nominee_payment.payment_reference", e.target.value, { shouldValidate: true })
              }
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Bank Name
            </label>
            <Input
              value={watch("nominee_payment.bank_name")}
              onChange={(e) =>
                setValue("nominee_payment.bank_name", e.target.value, { shouldValidate: true })
              }
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Bank Account Number
            </label>
            <Input
              value={watch("nominee_payment.bank_account_number")}
              onChange={(e) =>
                setValue("nominee_payment.bank_account_number", e.target.value, { shouldValidate: true })
              }
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Bank IFSC Code
            </label>
            <Input
              value={watch("nominee_payment.bank_ifsc_code")}
              onChange={(e) =>
                setValue("nominee_payment.bank_ifsc_code", e.target.value, { shouldValidate: true })
              }
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Bank Branch Name
            </label>
            <Input
              value={watch("nominee_payment.bank_branch_name")}
              onChange={(e) =>
                setValue("nominee_payment.bank_branch_name", e.target.value, { shouldValidate: true })
              }
              className="h-9 text-sm"
            />
          </div>
        </div>

        {/* Declaration - Hidden as requested */}
        {/* <div className="flex items-center mt-6">
          <Checkbox
            id="declaration_accepted"
            checked={watch("declaration_accepted")}
            onCheckedChange={(checked) =>
              setValue("declaration_accepted", !!checked, { shouldValidate: true })
            }
          />
          <label htmlFor="declaration_accepted" className="ml-2 text-sm text-gray-700">
            I hereby declare that the information provided above is true and correct to the best of my knowledge.
          </label>
        </div> */}

        {/* Submit/Cancel */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          {onClose && (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="hover:bg-gray-100 border-gray-300 text-gray-700 px-4 py-2 text-sm"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 text-sm font-semibold"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Update Policy"}
          </Button>
        </div>
      </form>
      
      {/* Document Preview Modal */}
      <DocumentPreviewModal
        open={previewModalOpen}
        onClose={closeDocumentPreview}
        document={previewDocument}
      />
    </div>
  );
}


