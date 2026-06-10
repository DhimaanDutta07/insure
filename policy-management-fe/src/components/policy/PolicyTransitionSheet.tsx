import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { RefreshCw, ArrowRight, Building2, Shield, AlertCircle, Plus, Trash2, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { PolicyTransitionService, PolicyTransitionData } from '../../services/policyTransition.service';
import type { Policy } from '../../types/index';
import { useCompanies, usePolicyNames } from '../../hooks/useApi';

// Extended interfaces for the transition sheet
interface ExtendedProposer {
  id?: string;
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
  insured_members?: ExtendedMember[];
}

interface ExtendedMember {
  id?: string;
  insured_member_salutation?: string;
  name?: string;
  relation_to_proposer?: string;
  date_of_birth?: string;
  gender?: string;
  age?: number;
  pre_existing?: boolean;
  insured_member_medical_condition?: boolean;
  insured_member_medical_remarks?: string;
  documents?: PolicyDocument[];
}

interface PolicyDocument {
  id?: string;
  category?: string;
  original_name?: string;
  file_name?: string;
}

interface DocumentReference {
  id: string;
  source_document: PolicyDocument;
  transition_type: string;
}

interface ExtendedPolicy extends Omit<Policy, 'proposer'> {
  proposer?: ExtendedProposer;
  document_references?: DocumentReference[];
}

interface PolicyTransitionSheetProps {
  open: boolean;
  onClose: () => void;
  policy: ExtendedPolicy | null;
  transitionType: 'RENEWAL' | 'MIGRATION' | 'PORTABILITY';
  onSuccess?: (result: { message: string }) => void;
}

type ExtendedTransitionData = PolicyTransitionData & {
  deductible_amount_status?: boolean;
  deductible_amount?: number;
  gst_status?: boolean;
};

const PolicyTransitionSheet: React.FC<PolicyTransitionSheetProps> = ({
  open,
  onClose,
  policy,
  transitionType,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use React Query hooks for instant data loading with caching
  const { data: companies = [] } = useCompanies();
  const { data: policyNames = [] } = usePolicyNames();
  
  // Local state for premium amount input to prevent input interference
  const [premiumAmountInput, setPremiumAmountInput] = useState<string>("");
  
  // Local state for member management
  const [members, setMembers] = useState<ExtendedMember[]>([]);
  
  // Local state for document upload
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    clearErrors,
    formState: { errors }
  } = useForm<ExtendedTransitionData>({
    defaultValues: {
      policy_number: '',
      customer_name: '',
      company_id: '',
      policy_name_id: '',
      sum_insured: 0,
      premium_amount: 0,
      tenure_years: 0,
      start_date: '',
      end_date: '',
      issued_date: '',
      gst_status: false,
      deductible_amount_status: false,
      deductible_amount: undefined,
    },
  });

  const watchedValues = watch();

  // Memoized eligibility checker (define before effects that use it)
  const checkEligibility = useCallback(async () => {
    if (!policy) return;
    try {
      setError(null);
      await PolicyTransitionService.validateEligibility(policy.id, transitionType);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to validate eligibility';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [policy, transitionType]);

  // Extract watched values for stable dependencies
  const wStartDate = watchedValues.start_date;
  const wTenureYears = watchedValues.tenure_years;
  const wPolicyNameId = watchedValues.policy_name_id;

  // Register hidden/non-UI fields so they are submitted
  useEffect(() => {
    register('deductible_amount_status');
    register('deductible_amount');
  }, [register]);

  // Auto-calculate end date based on start date and tenure years
  useEffect(() => {
    if (wStartDate && wTenureYears && Number(wTenureYears) > 0) {
      const start = new Date(wStartDate);
      const end = new Date(start);
      end.setDate(start.getDate() - 1);
      end.setFullYear(start.getFullYear() + Number(wTenureYears));
      setValue('end_date', end.toISOString().split('T')[0], { shouldValidate: true });
    }
  }, [wStartDate, wTenureYears, setValue]);

  // Filter policy names by selected company
  const selectedCompanyId = watchedValues.company_id;
  const filteredPolicyNames = selectedCompanyId
    ? policyNames.filter((pn) => pn.company_id === selectedCompanyId)
    : policyNames;

  // Reset policy_name_id when company_id changes ONLY if current policy name doesn't belong to selected company
  useEffect(() => {
    if (!selectedCompanyId) return;
    const currentPolicyName = policyNames.find((pn) => pn.id === wPolicyNameId);
    const belongsToSelectedCompany = currentPolicyName && currentPolicyName.company_id === selectedCompanyId;
    if (!belongsToSelectedCompany) {
      setValue("policy_name_id", "", { shouldValidate: true });
    }
  }, [selectedCompanyId, wPolicyNameId, policyNames, setValue]);

  // Reset form and check eligibility when sheet opens or transition type changes
  useEffect(() => {
    if (open && policy) {
      // Clear form validation errors
      clearErrors();
      
      // Reset form state
      setError(null);
      setPremiumAmountInput("");
      
      // Check eligibility for current transition type
      checkEligibility();
      
      // Fetch document transfer statistics
      // fetchDocumentTransferStats(); // Removed as per edit hint
    }
  }, [open, policy, transitionType, clearErrors, checkEligibility]);

  // Fetch document transfer statistics
  // const fetchDocumentTransferStats = async () => {
  //   if (!policy) return;
    
  //   try {
  //     const stats = await PolicyTransitionService.getDocumentTransferStats(policy.id, transitionType);
  //     setDocumentTransferStats(stats);
  //   } catch (error: unknown) {
  //     const errorMessage = error instanceof Error ? error.message : 'Failed to fetch document transfer statistics';
  //     // Don't show error to user as this is not critical
  //   }
  // };

  // Data is now loaded via React Query hooks with caching - no manual fetch needed

  // Pre-fill form with parent policy data - only after policy names are loaded
  useEffect(() => {
    if (policy && policyNames.length > 0) {
      
      // Clear form validation errors first
      clearErrors();
      
      // Reset form first
      setValue('customer_name', '');
      setValue('company_id', '');
      setValue('policy_name_id', '');
      setValue('sum_insured', 0);
      setValue('premium_amount', 0);
      setValue('tenure_years', 0);
      setValue('start_date', '');
      setValue('end_date', '');
      setValue('issued_date', '');
      setValue('policy_number', '');
      setValue('gst_status', false);
      
      // Clear local state
      setPremiumAmountInput("");
      setError(null);
      
      // Then set the values based on transition type
      setValue('customer_name', policy.customer_name);
      setValue('company_id', policy.company_id || '');
      setValue('policy_name_id', policy.policy_name_id || '');
      setValue('sum_insured', policy.sum_insured);
      setValue('premium_amount', policy.premium_amount);
      setValue('tenure_years', policy.tenure_years);
      setValue('gst_status', Boolean((policy as ExtendedPolicy & { gst_status?: boolean }).gst_status));
      setValue('deductible_amount_status', Boolean((policy as ExtendedPolicy & { deductible_amount_status?: boolean }).deductible_amount_status));
      if ((policy as ExtendedPolicy & { deductible_amount_status?: boolean }).deductible_amount_status) {
        setValue('deductible_amount', (policy as ExtendedPolicy & { deductible_amount?: number }).deductible_amount || 0);
      } else {
        setValue('deductible_amount', undefined);
      }
      
      // Initialize members from parent policy
      // Use the same path that works in the display section
      const parentMembers = policy.proposer?.insured_members || [];

      setMembers(parentMembers);

      // Set dates based on transition type
      const startDate = new Date();
      const endDate = new Date();
      
      if (transitionType === 'RENEWAL') {
        // For renewal, extend by tenure_years from current date
        endDate.setFullYear(endDate.getFullYear() + policy.tenure_years);
      } else if (transitionType === 'MIGRATION') {
        // For migration, use same tenure but start from current date
        endDate.setFullYear(endDate.getFullYear() + policy.tenure_years);
      } else if (transitionType === 'PORTABILITY') {
        // For portability, use same tenure but start from current date
        endDate.setFullYear(endDate.getFullYear() + policy.tenure_years);
      }
      // Always set end date to one day less than the tenure-adjusted date
      endDate.setDate(endDate.getDate() - 1);
      
      setValue('start_date', startDate.toISOString().split('T')[0]);
      setValue('end_date', endDate.toISOString().split('T')[0]);
      setValue('issued_date', new Date().toISOString().split('T')[0]);
      
      // Check eligibility for the new transition type
      checkEligibility();
    }
  }, [policy, policyNames, setValue, transitionType, clearErrors, checkEligibility]);

  const resetForm = () => {
    // Reset all form values
    setValue('customer_name', '');
    setValue('company_id', '');
    setValue('policy_name_id', '');
    setValue('sum_insured', 0);
    setValue('premium_amount', 0);
    setValue('tenure_years', 0);
    setValue('start_date', '');
    setValue('end_date', '');
    setValue('issued_date', '');
    setValue('policy_number', '');
    setValue('gst_status', false);
    setValue('deductible_amount_status', false);
    setValue('deductible_amount', undefined);
    
    // Clear local state
    setPremiumAmountInput("");
    setError(null);

    // Clear form validation errors
    clearErrors();
  };

  const onSubmit = async (data: PolicyTransitionData) => {
    console.log('onSubmit called with data:', data);
    console.log('policy:', policy);
    console.log('transitionType:', transitionType);
    
    if (!policy) {
      console.error('No policy provided');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Prepare payload with deductible and GST handling
      const payload: Record<string, string | number | boolean | null | undefined | any[]> = { ...data };
      console.log('Payload prepared:', payload);

      // Handle deductible fields
      if (!payload.deductible_amount_status) {
        delete payload.deductible_amount;
      }

      // Add members to payload for all transition types
      if (members.length > 0) {
        payload.members = members;
      }
      console.log('Members added:', members);

      // Create FormData for file upload
      const formData = new FormData();

      // Add all non-file fields to FormData
      Object.entries(payload).forEach(([key, value]) => {
        if (key === 'members') {
          formData.append(key, JSON.stringify(value));
        } else if (value !== undefined && value !== null && value !== '') {
          formData.append(key, String(value));
        }
      });
      console.log('FormData created, entries count:', formData.entries.length);

      // Add documents to FormData
      uploadedFiles.forEach((file) => {
        formData.append('documents', file);
      });
      console.log('Uploaded files:', uploadedFiles);

      let result;

      switch (transitionType) {
        case 'RENEWAL':
          console.log('Calling createRenewal');
          result = await PolicyTransitionService.createRenewal(policy.id, formData);
          break;
        case 'MIGRATION':
          result = await PolicyTransitionService.createMigration(policy.id, formData);
          break;
        case 'PORTABILITY':
          result = await PolicyTransitionService.createPortability(policy.id, formData);
          break;
        default:
          throw new Error('Invalid transition type');
      }

      console.log('Result received:', result);
      toast.success(result.message);
      onSuccess?.(result);
      resetForm();
      onClose();
    } catch (error: unknown) {
      console.error('Error in onSubmit:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create policy transition';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const getTransitionTitle = () => {
    switch (transitionType) {
      case 'RENEWAL':
        return 'Policy Renewal';
      case 'MIGRATION':
        return 'Policy Internal Portability';
      case 'PORTABILITY':
        return 'Policy Portability';
      default:
        return 'Policy Transition';
    }
  };

  const getTransitionDisplayName = () => {
    switch (transitionType) {
      case 'RENEWAL':
        return 'renewal';
      case 'MIGRATION':
        return 'internal portability';
      case 'PORTABILITY':
        return 'portability';
      default:
        return 'transition';
    }
  };

  // const getTransitionDescription = () => {
  //   switch (transitionType) {
  //     case 'RENEWAL':
  //       return 'Create a new policy by renewing the existing one with updated terms.';
  //     case 'MIGRATION':
  //       return 'Migrate the policy to a different company with new terms.';
  //     case 'PORTABILITY':
  //       return 'Transfer the policy to a new insurer while maintaining benefits.';
  //     default:
  //       return 'Create a new policy based on the existing one.';
  //   }
  // };

  const getTransitionIcon = () => {
    switch (transitionType) {
      case 'RENEWAL':
        return <RefreshCw className="w-5 h-5" />;
      case 'MIGRATION':
        return <Building2 className="w-5 h-5" />;
      case 'PORTABILITY':
        return <ArrowRight className="w-5 h-5" />;
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  if (!policy) return null;

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
          py-6
          border-l
          border-gray-200
        "
        style={{ boxShadow: '0 6px 32px 0 rgba(0,0,0,0.08)' }}
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-xl font-semibold mb-2">
            {getTransitionIcon()}
            {getTransitionTitle()}
          </SheetTitle>
          {/* <p className="text-sm text-gray-600">{getTransitionDescription()}</p> */}
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Parent Policy Reference */}
          <Card className="border-l-4 border-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="w-4 h-4" />
                Parent Policy Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Document Transfer Information */}
              {/* Removed document transfer statistics section */}

              {/* 1. Holder Information */}
              {policy.proposer && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Holder Information</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Full Name</Label>
                      <p className="text-sm text-gray-900">{policy.proposer.full_name}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Date of Birth</Label>
                      <p className="text-sm text-gray-900">
                        {policy.proposer.date_of_birth ? new Date(policy.proposer.date_of_birth).toLocaleDateString() : '-'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Gender</Label>
                      <p className="text-sm text-gray-900">{policy.proposer.gender || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Marital Status</Label>
                      <p className="text-sm text-gray-900">{policy.proposer.marital_status || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Mobile</Label>
                      <p className="text-sm text-gray-900">{policy.proposer.mobile}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Alternate Mobile</Label>
                      <p className="text-sm text-gray-900">{policy.proposer.alternate_mobile || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Email</Label>
                      <p className="text-sm text-gray-900">{policy.proposer.email || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Occupation</Label>
                      <p className="text-sm text-gray-900">{policy.proposer.occupation || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Nationality</Label>
                      <p className="text-sm text-gray-900">{policy.proposer.nationality || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">KYC ID</Label>
                      <p className="text-sm text-gray-900">{policy.proposer.kyc_id || '-'}</p>
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs font-medium text-gray-600">Address</Label>
                      <p className="text-sm text-gray-900">{policy.proposer.address || '-'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Policy Information */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Policy Information</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Policy Number</Label>
                    <p className="text-sm font-semibold text-blue-600">{policy.policy_number}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Customer Name</Label>
                    <p className="text-sm text-gray-900">{policy.customer_name}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Company</Label>
                    <p className="text-sm text-gray-900">
                      {typeof policy.company === 'object' && policy.company ? policy.company.name : (policy.company || '-')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Product Name</Label>
                    <p className="text-sm text-gray-900">
                      {typeof policy.policyName === 'object' && policy.policyName ? policy.policyName.name : (policy.policyName || '-')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Policy Group</Label>
                    <p className="text-sm text-gray-900">
                      {typeof policy.policyGroup === 'object' && policy.policyGroup ? policy.policyGroup.name : (policy.policyGroup || '-')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Policy Status</Label>
                    <p className="text-sm text-gray-900">{policy.policy_creation_status}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Sum Insured</Label>
                    <p className="text-sm font-semibold text-gray-900">
                      ₹{policy.sum_insured?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">GST Status</Label>
                    <p className="text-sm text-gray-900">
                      {(policy as ExtendedPolicy & { gst_status?: boolean }).gst_status ? 'GST Included' : 'GST Not Included'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Premium Amount</Label>
                    <p className="text-sm font-semibold text-green-600">
                      ₹{policy.premium_amount?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Tenure (Years)</Label>
                    <p className="text-sm text-gray-900">{policy.tenure_years}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">EMI Amount</Label>
                    <p className="text-sm text-gray-900">
                      {(policy as ExtendedPolicy & { emi_amount?: number }).emi_amount ? `₹${(policy as ExtendedPolicy & { emi_amount?: number }).emi_amount!.toLocaleString()}` : '-'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Commission Amount</Label>
                    <p className="text-sm text-gray-900">
                      {(policy as ExtendedPolicy & { calculated_commission_amount?: number }).calculated_commission_amount ? `₹${(policy as ExtendedPolicy & { calculated_commission_amount?: number }).calculated_commission_amount!.toLocaleString()}` : '-'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Deductible Amount</Label>
                    <p className="text-sm text-gray-900">
                      {(policy as ExtendedPolicy & { deductible_amount?: number }).deductible_amount ? `₹${(policy as ExtendedPolicy & { deductible_amount?: number }).deductible_amount!.toLocaleString()}` : '-'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Medical Condition</Label>
                    <p className="text-sm text-gray-900">{(policy as ExtendedPolicy & { medical_condition?: boolean }).medical_condition ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Medical Remarks</Label>
                    <p className="text-sm text-gray-900">{(policy as ExtendedPolicy & { medical_remarks?: string }).medical_remarks || '-'}</p>
                  </div>
                  {/* <div>
                    <Label className="text-xs font-medium text-gray-600">Declaration Accepted</Label>
                    <p className="text-sm text-gray-900">{(policy as ExtendedPolicy & { declaration_accepted?: boolean }).declaration_accepted ? 'Yes' : 'No'}</p>
                  </div> */}
                  <div className="col-span-3">
                    <Label className="text-xs font-medium text-gray-600">Policy Remarks</Label>
                    <p className="text-sm text-gray-900">
                      {(policy as ExtendedPolicy & { remarks?: string }).remarks || 'No remarks'}
                    </p>
                  </div>
                  <div className="col-span-3">
                    <Label className="text-xs font-medium text-gray-600">Policy Period</Label>
                    <p className="text-sm text-gray-700">
                      {new Date(policy.start_date).toLocaleDateString()} - {new Date(policy.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Insured Member Information */}
              {policy.proposer?.insured_members && policy.proposer.insured_members.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
                Insured Member Information ({policy.proposer.insured_members.length} members)
                  </h4>
                  <div className="space-y-3">
                    {policy.proposer.insured_members.map((member: ExtendedMember, index: number) => (
                      <div key={member.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <h5 className="text-sm font-medium text-gray-800">Member {index + 1}</h5>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {member.relation_to_proposer}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <Label className="text-xs font-medium text-gray-600">Name</Label>
                            <p className="text-sm text-gray-900">{member.name}</p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-gray-600">Date of Birth</Label>
                            <p className="text-sm text-gray-900">
                              {member.date_of_birth ? new Date(member.date_of_birth).toLocaleDateString() : '-'}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-gray-600">Gender</Label>
                            <p className="text-sm text-gray-900">{member.gender || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-gray-600">Pre-existing Condition</Label>
                            <p className="text-sm text-gray-900">
                              {member.pre_existing ? 'Yes' : 'No'}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-gray-600">Medical Condition</Label>
                            <p className="text-sm text-gray-900">
                              {member.insured_member_medical_condition ? 'Yes' : 'No'}
                            </p>
                          </div>
                          {member.insured_member_medical_condition && member.insured_member_medical_remarks && (
                            <div className="col-span-2">
                              <Label className="text-xs font-medium text-gray-600">Medical Remarks</Label>
                              <p className="text-sm text-gray-900">{member.insured_member_medical_remarks}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Member Management Section - For all transition types */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-2">
                  <h4 className="text-sm font-semibold text-gray-800">
                    Manage Members ({members.length} members)
                  </h4>
                  <Button
                    type="button"
                    onClick={() => {
                      setMembers([...members, {
                        name: '',
                        relation_to_proposer: '',
                        date_of_birth: '',
                        gender: '',
                        pre_existing: false,
                        insured_member_medical_condition: false,
                        insured_member_medical_remarks: '',
                      }]);
                    }}
                    size="sm"
                    className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Member
                  </Button>
                </div>
                  <div className="space-y-3">
                    {members.map((member, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
                        <div className="flex justify-between items-start mb-3">
                          <h5 className="text-sm font-medium text-gray-800">Member {index + 1}</h5>
                          <Button
                            type="button"
                            onClick={() => {
                              setMembers(members.filter((_, i) => i !== index));
                            }}
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <Label className="text-xs font-medium text-gray-600">Name</Label>
                            <Input
                              value={member.name || ''}
                              onChange={(e) => {
                                const updated = [...members];
                                updated[index].name = e.target.value;
                                setMembers(updated);
                              }}
                              className="h-7 text-xs mt-1"
                              placeholder="Enter name"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-gray-600">Relation</Label>
                            <Select
                              value={member.relation_to_proposer || ''}
                              onValueChange={(value) => {
                                const updated = [...members];
                                updated[index].relation_to_proposer = value;
                                setMembers(updated);
                              }}
                            >
                              <SelectTrigger className="h-7 text-xs mt-1">
                                <SelectValue placeholder="Select relation" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Self">Self</SelectItem>
                                <SelectItem value="Spouse">Spouse</SelectItem>
                                <SelectItem value="Son">Son</SelectItem>
                                <SelectItem value="Daughter">Daughter</SelectItem>
                                <SelectItem value="Father">Father</SelectItem>
                                <SelectItem value="Mother">Mother</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-gray-600">Date of Birth</Label>
                            <Input
                              type="date"
                              value={member.date_of_birth ? new Date(member.date_of_birth).toISOString().split('T')[0] : ''}
                              onChange={(e) => {
                                const updated = [...members];
                                updated[index].date_of_birth = e.target.value;
                                // Auto-calculate age from date of birth
                                if (e.target.value) {
                                  const dob = new Date(e.target.value);
                                  const today = new Date();
                                  let age = today.getFullYear() - dob.getFullYear();
                                  const monthDiff = today.getMonth() - dob.getMonth();
                                  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                                    age--;
                                  }
                                  updated[index].age = age;
                                }
                                setMembers(updated);
                              }}
                              className="h-7 text-xs mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-gray-600">Gender</Label>
                            <Select
                              value={member.gender || ''}
                              onValueChange={(value) => {
                                const updated = [...members];
                                updated[index].gender = value;
                                setMembers(updated);
                              }}
                            >
                              <SelectTrigger className="h-7 text-xs mt-1">
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                    {members.length === 0 && (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No members added. Click "Add Member" to add members to the new policy.
                      </div>
                    )}
                  </div>
                </div>

              {/* Document Upload Section - For all transition types */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-2">
                  <h4 className="text-sm font-semibold text-gray-800">
                    Upload Documents ({uploadedFiles.length} files)
                  </h4>
                </div>
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                    <input
                      type="file"
                      id="document-upload"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx,.xls,.csv"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setUploadedFiles([...uploadedFiles, ...files]);
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="document-upload"
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      <Plus className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Click to upload documents</p>
                      <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG, DOC, XLSX, XLS, CSV</p>
                    </label>
                  </div>
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span className="text-xs text-gray-700">{file.name}</span>
                            <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                          </div>
                          <Button
                            type="button"
                            onClick={() => {
                              setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
                            }}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Nominee and Payment Information */}
              {policy.nominee_payment && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Nominee and Payment Information</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Nominee Name</Label>
                      <p className="text-sm text-gray-900">{policy.nominee_payment.nominee_name}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Relation</Label>
                      <p className="text-sm text-gray-900">{policy.nominee_payment.nominee_relation}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Date of Birth</Label>
                      <p className="text-sm text-gray-900">
                        {policy.nominee_payment.nominee_dob ? new Date(policy.nominee_payment.nominee_dob).toLocaleDateString() : '-'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Payment Mode</Label>
                      <p className="text-sm text-gray-900">{policy.nominee_payment.payment_mode}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Payment Reference</Label>
                      <p className="text-sm text-gray-900">{policy.nominee_payment.payment_reference}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Bank Name</Label>
                      <p className="text-sm text-gray-900">{policy.nominee_payment.bank_name || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Account Number</Label>
                      <p className="text-sm text-gray-900">{policy.nominee_payment.bank_account_number || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">IFSC Code</Label>
                      <p className="text-sm text-gray-900">{policy.nominee_payment.bank_ifsc_code || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Bank Branch</Label>
                      <p className="text-sm text-gray-900">{policy.nominee_payment.bank_branch_name || '-'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Eligibility Status */}
              {/* {eligibility && (
                <div className={`mt-4 p-3 rounded-lg ${
                  eligibility.eligible ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {eligibility.eligible ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      eligibility.eligible ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {eligibility.eligible ? 'Eligible for Transition' : 'Not Eligible for Transition'}
                    </span>
                  </div>
                  
                  {eligibility.reasons.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {eligibility.reasons.map((reason, index) => (
                        <li key={index} className="text-xs text-red-600 flex items-start gap-1">
                          <span className="mt-0.5">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  {eligibility.requirements.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700 mb-1">Requirements:</p>
                      <ul className="space-y-1">
                        {eligibility.requirements.map((req, index) => (
                          <li key={index} className="text-xs text-gray-600 flex items-start gap-1">
                            <span className="mt-0.5">•</span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )} */}

              {/* Error Display */}
              {error && (
                <div className="mt-4 flex items-center gap-2 text-red-600 p-3 bg-red-50 rounded-md border border-red-100 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* New Policy Form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">New Policy Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Policy Number */}
                  <div>
                    <label className="block text-xs font-medium mb-1">New Policy Number *</label>
                    <Input
                      id="policy_number"
                      {...register('policy_number', { required: 'Policy number is required' })}
                      placeholder="Enter new policy number"
                      className={`h-8 text-xs ${errors.policy_number ? 'border-red-500' : ''}`}
                    />
                    {errors.policy_number && (
                      <p className="text-xs text-red-500 mt-1">{errors.policy_number.message}</p>
                    )}
                  </div>

                  {/* Customer Name */}
                  <div>
                    <label className="block text-xs font-medium mb-1">Customer Name *</label>
                    <Input
                      id="customer_name"
                      {...register('customer_name', { required: 'Customer name is required' })}
                      placeholder="Enter customer name"
                      className={`h-8 text-xs ${errors.customer_name ? 'border-red-500' : ''}`}
                    />
                    {errors.customer_name && (
                      <p className="text-xs text-red-500 mt-1">{errors.customer_name.message}</p>
                    )}
                  </div>

                  {/* Company - Show for all transitions, not just Migration */}
                  <div>
                    <label className="block text-xs font-medium mb-1">Company *</label>
                    <Select
                      value={watchedValues.company_id}
                      onValueChange={(value) => setValue('company_id', value)}
                    >
                      <SelectTrigger className={`h-8 text-xs ${errors.company_id ? 'border-red-500' : ''}`}>
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
                      <p className="text-xs text-red-500 mt-1">{errors.company_id.message}</p>
                    )}
                  </div>

                  {/* Product Name */}
                  <div>
                    <label className="block text-xs font-medium mb-1">Product Name *</label>
                    <Select
                      value={watchedValues.policy_name_id}
                      onValueChange={(value) => setValue('policy_name_id', value)}
                    >
                      <SelectTrigger className={`h-8 text-xs ${errors.policy_name_id ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select policy name" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredPolicyNames
                          .slice()
                          .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
                          .map((policyName) => (
                          <SelectItem key={policyName.id} value={policyName.id}>
                            {policyName.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.policy_name_id && (
                      <p className="text-xs text-red-500 mt-1">{errors.policy_name_id.message}</p>
                    )}
                  </div>

                  {/* Sum Insured */}
                  <div>
                    <label className="block text-xs font-medium mb-1">Sum Insured *</label>
                    <Input
                      id="sum_insured"
                      type="number"
                      {...register('sum_insured', { 
                        required: 'Sum insured is required',
                        min: { value: 1, message: 'Sum insured must be greater than 0' }
                      })}
                      placeholder="Enter sum insured"
                      className={`h-8 text-xs ${errors.sum_insured ? 'border-red-500' : ''}`}
                    />
                    {errors.sum_insured && (
                      <p className="text-xs text-red-500 mt-1">{errors.sum_insured.message}</p>
                    )}
                  </div>

                  {/* GST Status */}
                  <div>
                    <label className="block text-xs font-medium mb-1">GST Status</label>
                    <Select
                      value={watchedValues.gst_status ? "Yes" : "No"}
                      onValueChange={(value) =>
                        setValue('gst_status', value === "Yes", { shouldValidate: true })
                      }
                    >
                      <SelectTrigger className={`h-8 text-xs ${errors.gst_status ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select GST status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="Yes">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gst_status && (
                      <p className="text-xs text-red-500 mt-1">{errors.gst_status.message}</p>
                    )}
                  </div>

                  {/* Premium Amount */}
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      {watchedValues.gst_status ? "Premium Amount (GST Inclusive) *" : "Premium Amount *"}
                    </label>
                    <Input
                      id="premium_amount"
                      type="number"
                      step="0.01"
                      value={premiumAmountInput || (watchedValues.premium_amount ? 
                        Number(watchedValues.premium_amount).toFixed(2) 
                        : "")}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        setPremiumAmountInput(inputValue);
                        setValue('premium_amount', parseFloat(inputValue) || 0, { shouldValidate: true });
                      }}
                      onBlur={() => {
                        // Clear local input state when field loses focus
                        setPremiumAmountInput("");
                      }}
                      placeholder="Enter premium amount"
                      className={`h-8 text-xs ${errors.premium_amount ? 'border-red-500' : ''}`}
                    />
                    {errors.premium_amount && (
                      <p className="text-xs text-red-500 mt-1">{errors.premium_amount.message}</p>
                    )}
                  </div>

                  {/* Tenure Years */}
                  <div>
                    <label className="block text-xs font-medium mb-1">Tenure (Years) *</label>
                    <Input
                      id="tenure_years"
                      type="number"
                      {...register('tenure_years', { 
                        required: 'Tenure is required',
                        min: { value: 1, message: 'Tenure must be at least 1 year' }
                      })}
                      placeholder="Enter tenure in years"
                      className={`h-8 text-xs ${errors.tenure_years ? 'border-red-500' : ''}`}
                    />
                    {errors.tenure_years && (
                      <p className="text-xs text-red-500 mt-1">{errors.tenure_years.message}</p>
                    )}
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-xs font-medium mb-1">Start Date *</label>
                    <Input
                      id="start_date"
                      type="date"
                      {...register('start_date', { required: 'Start date is required' })}
                      value={watch('start_date') || ''}
                      className={`h-8 text-xs ${errors.start_date ? 'border-red-500' : ''}`}
                    />
                    {errors.start_date && (
                      <p className="text-xs text-red-500 mt-1">{errors.start_date.message}</p>
                    )}
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-xs font-medium mb-1">End Date *</label>
                    <Input
                      id="end_date"
                      type="date"
                      {...register('end_date', { required: 'End date is required' })}
                      value={watch('end_date') || ''}
                      className={`h-8 text-xs ${errors.end_date ? 'border-red-500' : ''}`}
                    />
                    {errors.end_date && (
                      <p className="text-xs text-red-500 mt-1">{errors.end_date.message}</p>
                    )}
                  </div>

                  {/* Issued Date */}
                  <div>
                    <label className="block text-xs font-medium mb-1">Issued Date *</label>
                    <Input
                      id="issued_date"
                      type="date"
                      {...register('issued_date', { required: 'Issued date is required' })}
                      value={watch('issued_date') || ''}
                      className={`h-8 text-xs ${errors.issued_date ? 'border-red-500' : ''}`}
                    />
                    {errors.issued_date && (
                      <p className="text-xs text-red-500 mt-1">{errors.issued_date.message}</p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 pb-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="hover:bg-gray-100 border-gray-300 text-gray-700 px-4 py-2 text-sm"
                    onClick={() => {
                      resetForm();
                      onClose();
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {getTransitionIcon()}
                        Create {getTransitionDisplayName()}
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PolicyTransitionSheet; 