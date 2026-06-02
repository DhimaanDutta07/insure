import React, { useState, useEffect, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import axios from "axios";
import { toast } from "sonner";
import { X } from "lucide-react";
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
import { commissionCalculationService } from "../../services/commissionCalculation.service";
// import { Checkbox } from "../ui/checkbox"; // Commented out as declaration section is hidden

export type PolicyType =
  | "HEALTH_INSURANCE"
  | "MOTOR_INSURANCE"
  | "LIFE_INSURANCE";

export interface PolicyDocument {
  file_name?: string;
  file_type?: string;
  file_url?: string;
  document_type?: string;
}

export interface Member {
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
  // type?: PolicyType;
  policy_group_id?: string;
  policy_name_id?: string;
  insurer_name?: string;
  product_name?: string;
  plan_type?: string;
  deductible_amount?: number;
  deductible_amount_status?: boolean;
  sum_insured?: number;
  start_date?: string;
  end_date?: string;
  tenure_years?: number;
  issued_date?: string;
  premium_amount?: number;
  emi_amount?: number;
  commission_add_on_percentage?: number;
  calculated_commission_amount?: number;
  declaration_accepted?: boolean;
  system_ip?: string;
  proposer?: Proposer;
  nominee_payment?: Nominee;
  members?: Member[];
  documents?: PolicyDocument[];
  form_values?: { field_name?: string; value?: string }[];
  medical_condition?: boolean;
  medical_remarks?: string;
  policy_creation_status?: "Fresh" | "Renewal" | "Migration" | "Portablity";
  gst_status?: boolean;
  remarks?: string;
  premium_amount_gst?: number;
}

interface Company {
  id: string;
  name: string;
  category: string;
}

interface PolicyFormProps {
  onSubmit: () => void;
  onClose?: () => void;
}

const DEDUCTIBLE_OPTIONS: Record<string, number[]> = {
  "HDFC ERGO": [25000, 50000, 100000, 200000, 300000, 500000],
  "STAR HEALTH": [25000, 50000, 100000],
  "NIVA BUPA": [20000, 30000, 50000, 100000],
  "CARE HEALTH": [25000],
};
const HIDE_DEDUCTIBLE_FOR = ["ICICI LOMBARD"];

// Companies for which Commission Add-on field should be shown
const COMMISSION_ADDON_COMPANIES = ["HDFC ERGO"];

const PolicyForm: React.FC<PolicyFormProps> = ({ onSubmit, onClose }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [policyNames, setPolicyNames] = useState<
    { id: string; name: string; company_id?: string }[]
  >([]);
  const [policyTypes, setPolicyTypes] = useState<
    { id: string; name: string }[]
  >([]);
  const [policyGroups, setPolicyGroups] = useState<
    { id: string; name: string }[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File upload states
  const [policyDocs, setPolicyDocs] = useState<File[]>([]);
  const [proposerDocs, setProposerDocs] = useState<File[]>([]);
  const [memberDocs, setMemberDocs] = useState<{ [index: number]: File[] }>({});

  // Document preview modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<{
    url: string;
    name: string;
    type?: string;
  } | null>(null);

  // Commission calculation state
  const [calculatedCommission, setCalculatedCommission] = useState<{
    calculated_commission_amount: number;
    base_percentage: number;
    add_on_percentage: number;
    total_percentage: number;
    rule_found: boolean;
  }>({
    calculated_commission_amount: 0,
    base_percentage: 0,
    add_on_percentage: 0,
    total_percentage: 0,
    rule_found: false,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<
    PolicyFormData & { policy_name_id?: string; policy_type_id?: string }
  >({
    mode: "onBlur",
    defaultValues: {
      members: [],
      declaration_accepted: false,
      medical_condition: false,
      medical_remarks: "",
      policy_creation_status: "Fresh",
      gst_status: false,
      remarks: "",
      proposer: {
        full_name: "",
        date_of_birth: "",
        gender: "",
        marital_status: "",
        mobile: "",
        alternate_mobile: "",
        email: "",
        address: "",
        kyc_id: "",
        occupation: "",
        nationality: "",
        documents: [],
      },
    },
  });

  const {
    fields: memberFields,
    append: appendMember,
    remove: removeMember,
  } = useFieldArray({
    control,
    name: "members",
  });

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await axios.get(
          `${(import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '')}/api/v1/companies`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          }
        );
        setCompanies(res.data);
      } catch {
        toast.error("Failed to load companies");
      }
    };

    const fetchPolicyNames = async () => {
      try {
        const res = await axios.get(
          `${(import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '')}/api/v1/policy-names`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          }
        );
        setPolicyNames(res.data);
      } catch {
        toast.error("Failed to load policy names");
      }
    };

    const fetchPolicyTypes = async () => {
      try {
        const res = await axios.get(
          `${(import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '')}/api/v1/policy-types`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          }
        );
        setPolicyTypes(res.data);
      } catch {
        toast.error("Failed to load policy types");
      }
    };
    const fetchPolicyGroups = async () => {
      try {
        const res = await axios.get(
          `${(import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '')}/api/v1/policy-groups`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          }
        );
        setPolicyGroups(
          Array.isArray(res.data.policyGroups) ? res.data.policyGroups : []
        );
      } catch {
        toast.error("Failed to load policy groups");
      }
    };

    fetchCompanies();
    fetchPolicyNames();
    fetchPolicyTypes();
    fetchPolicyGroups();
  }, []);

  // Cleanup URLs when component unmounts
  useEffect(() => {
    return () => {
      if (previewDocument) {
        URL.revokeObjectURL(previewDocument.url);
      }
    };
  }, [previewDocument]);

  // Extract watched values to simple variables for effect dependencies
  const wPremiumAmount = watch("premium_amount");
  const wPolicyNameId = watch("policy_name_id");
  const wProposerDob = watch("proposer.date_of_birth");
  const wProposerFullName = watch("proposer.full_name");
  const wProposerGender = watch("proposer.gender");
  const wProposerSalutation = watch("proposer.proposer_salutation");
  const wMembers = watch("members");
  const wSumInsured = watch("sum_insured");
  const wDeductibleStatus = watch("deductible_amount_status");
  const wPolicyCreationStatus = watch("policy_creation_status");
  const wCommissionAddOn = watch("commission_add_on_percentage");
  const wStartDate = watch("start_date");
  const wTenureYears = watch("tenure_years");

  // Commission calculation function
  const calculateCommission = useCallback(async () => {
    const premiumAmount = wPremiumAmount;
    const policyNameId = wPolicyNameId;
    const proposerDob = wProposerDob;
    const sumInsured = wSumInsured;
    const deductibleStatus = wDeductibleStatus;
    const policyCreationStatus = wPolicyCreationStatus || "Fresh";
    const commissionAddOn = wCommissionAddOn;

    console.log("🔍 [Commission Debug] Input values:", {
      premiumAmount,
      policyNameId,
      proposerDob,
      sumInsured,
      deductibleStatus,
      policyCreationStatus,
      commissionAddOn,
      commissionAddOnType: typeof commissionAddOn,
    });

    // Only calculate if we have the minimum required fields (policyNameId and proposerDob are still required)
    if (!policyNameId || !proposerDob) {
      setCalculatedCommission({
        calculated_commission_amount: 0,
        base_percentage: 0,
        add_on_percentage: 0,
        total_percentage: 0,
        rule_found: false,
      });
      return;
    }

    // Use 0 as default values for optional fields
    const finalPremiumAmount = premiumAmount || 0;
    const finalSumInsured = sumInsured || 0;

    try {
      // Ensure commission add-on is a number
      const commissionAddOnNumber =
        typeof commissionAddOn === "number"
          ? commissionAddOn
          : typeof commissionAddOn === "string"
          ? parseFloat(commissionAddOn) || 0
          : 0;

      console.log(
        "🔍 [Commission Debug] Processed commission add-on:",
        commissionAddOnNumber
      );

      const result = await commissionCalculationService.calculateCommission({
        policy_name_id: policyNameId,
        policy_creation_status: policyCreationStatus,
        proposer_dob: proposerDob,
        sum_insured: finalSumInsured,
        deductible_amount_status: deductibleStatus || false,
        premium_amount: finalPremiumAmount,
        commission_add_on_percentage: commissionAddOnNumber,
      });

      console.log("🔍 [Commission Debug] Result:", result);
      setCalculatedCommission(result);
    } catch (error) {
      console.error("Error calculating commission:", error);
      setCalculatedCommission({
        calculated_commission_amount: 0,
        base_percentage: 0,
        add_on_percentage: 0,
        total_percentage: 0,
        rule_found: false,
      });
    } finally {
    }
  }, [
    wPremiumAmount,
    wPolicyNameId,
    wProposerDob,
    wSumInsured,
    wDeductibleStatus,
    wPolicyCreationStatus,
    wCommissionAddOn,
  ]);

  // Calculate commission when relevant fields change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      calculateCommission();
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
  }, [calculateCommission]);

  const onFormSubmit = async (
    data: PolicyFormData & { policy_name_id?: string; policy_type_id?: string }
  ) => {
    setIsSubmitting(true);
    try {
      // Filter out irrelevant fields before sending
      const filteredData = { ...data };

      // Convert boolean fields from string to boolean
      if (filteredData.gst_status !== undefined) {
        filteredData.gst_status = Boolean(filteredData.gst_status);
      }

      // Handle optional numeric fields - convert empty strings to undefined
      if (
        filteredData.sum_insured === null ||
        filteredData.sum_insured === undefined
      ) {
        delete filteredData.sum_insured;
      }

      if (
        filteredData.premium_amount === null ||
        filteredData.premium_amount === undefined
      ) {
        delete filteredData.premium_amount;
      }

      if (
        filteredData.emi_amount === null ||
        filteredData.emi_amount === undefined
      ) {
        delete filteredData.emi_amount;
      }

      // Handle optional nominee fields - convert null/empty to undefined
      if (filteredData.nominee_payment) {
        const nomineeFields = [
          "nominee_salutation",
          "nominee_name",
          "nominee_relation",
          "nominee_dob",
          "payment_mode",
          "payment_reference",
          "bank_name",
          "bank_account_number",
          "bank_ifsc_code",
          "bank_branch_name",
        ] as const;

        let hasValidData = false;

        nomineeFields.forEach((field) => {
          const value = filteredData.nominee_payment![field];
          if (value === "" || value === null || value === undefined) {
            delete (filteredData.nominee_payment as Record<string, unknown>)[
              field
            ];
          } else {
            hasValidData = true;
          }
        });

        // If nominee_payment has no valid data, delete it entirely
        if (
          !hasValidData ||
          Object.keys(filteredData.nominee_payment).length === 0
        ) {
          delete filteredData.nominee_payment;
        }
      }

      if (!showCommissionAddOn) {
        delete filteredData.commission_add_on_percentage;
      }
      if (hideDeductible || !deductibleOptions) {
        delete filteredData.deductible_amount_status;
        delete filteredData.deductible_amount;
      }
      // If deductible_amount_status is false or not set, remove deductible_amount
      if (!filteredData.deductible_amount_status) {
        delete filteredData.deductible_amount;
      }
      // Only use auto-calculated commission if user hasn't manually entered one
      if (!filteredData.calculated_commission_amount && calculatedCommission.rule_found) {
        filteredData.calculated_commission_amount =
          calculatedCommission.calculated_commission_amount;
      }
      // Always keep policy_name_id if it exists in the form data
      // (No delete for policy_name_id)

      const formData = new FormData();
      Object.entries(filteredData).forEach(([key, value]) => {
        // Skip undefined, null, or empty string values (except for policy_name_id)
        if (key === "policy_name_id") {
          formData.append(
            key,
            value !== undefined && value !== null ? String(value) : ""
          );
          return;
        }

        // Skip empty values for other fields
        if (value === undefined || value === null || value === "") {
          return;
        }

        if (typeof value !== "object" || value instanceof Date) {
          // Handle boolean fields specially for FormData
          if (key === "gst_status" && typeof value === "boolean") {
            formData.append(key, value ? "true" : "false");
          } else {
            formData.append(key, String(value));
          }
        }
      });
      // Attach files
      policyDocs.forEach((file) => formData.append("policyDocs", file));
      proposerDocs.forEach((file) => formData.append("proposerDocs", file));
      Object.entries(memberDocs).forEach(([memberIndex, files]) => {
        files.forEach((file) =>
          formData.append(`memberDocs_${memberIndex}`, file)
        );
      });

      // Clean up proposer data - remove empty fields
      const cleanedProposer = { ...data.proposer };
      Object.keys(cleanedProposer).forEach((key) => {
        const value = cleanedProposer[key as keyof typeof cleanedProposer];
        if (value === "" || value === null || value === undefined) {
          delete cleanedProposer[key as keyof typeof cleanedProposer];
        }
      });

      // Clean up nominee data - only include if it has meaningful data
      let cleanedNominee = null;
      if (data.nominee_payment) {
        const nomineeData = { ...data.nominee_payment };
        const nomineeFields = [
          "nominee_salutation",
          "nominee_name",
          "nominee_relation",
          "nominee_dob",
          "payment_mode",
          "payment_reference",
          "bank_name",
          "bank_account_number",
          "bank_ifsc_code",
          "bank_branch_name",
        ];

        // Remove empty fields
        nomineeFields.forEach((field) => {
          const value = nomineeData[field as keyof typeof nomineeData];
          if (value === "" || value === null || value === undefined) {
            delete nomineeData[field as keyof typeof nomineeData];
          }
        });

        // Only keep nominee data if it has at least one meaningful field
        if (Object.keys(nomineeData).length > 0) {
          cleanedNominee = nomineeData;
        }
      }

      // Ensure all members have medical condition fields
      const processedMembers =
        data.members?.map((member) => ({
          ...member,
          insured_member_medical_condition:
            member.insured_member_medical_condition ?? false,
          insured_member_medical_remarks:
            member.insured_member_medical_remarks ?? "",
        })) || [];

      formData.append("proposer", JSON.stringify(cleanedProposer));

      // Only send nominee_payment if it has valid data
      if (cleanedNominee) {
        formData.append("nominee_payment", JSON.stringify(cleanedNominee));
      }

      formData.append("insured_members", JSON.stringify(processedMembers));

      // Debug: Log nominee data being sent
      console.log(
        "🔍 [Frontend] Nominee data being sent:",
        data.nominee_payment
      );
      // formData.append("form_values", JSON.stringify(data.form_values));
      await axios.post(
        `${(import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '')}/api/v1/policies`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      toast.success("Policy created successfully!");
      reset();
      setPolicyDocs([]);
      setProposerDocs([]);
      setMemberDocs({});
      onSubmit();
      if (onClose) onClose();
    } catch (error: unknown) {
      console.error("Error creating policy:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: { error?: string | { message: string }[] } };
        };
        if (axiosError.response?.data?.error) {
          if (Array.isArray(axiosError.response.data.error)) {
            // Zod validation errors
            toast.error(
              `Validation error: ${axiosError.response.data.error
                .map((e: { message: string }) => e.message)
                .join(", ")}`
            );
          } else {
            toast.error(`Error: ${axiosError.response.data.error}`);
          }
        } else {
          toast.error("Failed to create policy");
        }
      } else {
        toast.error("Failed to create policy");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const addNewMember = () => {
    appendMember({
      name: "",
      relation_to_proposer: "",
      date_of_birth: "",
      gender: "",
      pre_existing: false,
      insured_member_medical_condition: false,
      insured_member_medical_remarks: "",
      documents: [],
    });

    // Scroll to keep the Add Member button visible and accessible after adding a new member
    setTimeout(() => {
      const addMemberButton = document.querySelector(
        "[data-add-member-button]"
      );
      if (addMemberButton) {
        addMemberButton.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }

      // Also focus on the first input field of the new member for immediate editing
      const memberCards = document.querySelectorAll("[data-member-card]");
      const lastMemberCard = memberCards[memberCards.length - 1];
      if (lastMemberCard) {
        const firstInput = lastMemberCard.querySelector(
          'input[type="text"]'
        ) as HTMLInputElement;
        if (firstInput) {
          setTimeout(() => firstInput.focus(), 200);
        }
      }
    }, 100);
  };

  // Preview uploaded file in modal
  const openDocumentPreview = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewDocument({
      url,
      name: file.name,
      type: file.type,
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

  const selectedCompanyId = watch("company_id");
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);
  const deductibleOptions = selectedCompany
    ? DEDUCTIBLE_OPTIONS[selectedCompany.name]
    : undefined;
  const hideDeductible =
    selectedCompany && HIDE_DEDUCTIBLE_FOR.includes(selectedCompany.name);
  const showCommissionAddOn =
    selectedCompany &&
    COMMISSION_ADDON_COMPANIES.includes(selectedCompany.name);

  // Filter policy names by selected company; when no company selected, keep list empty
  const filteredPolicyNames = selectedCompanyId
    ? policyNames
        .filter((pn) => pn.company_id === selectedCompanyId)
        .slice()
        .sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
        )
    : [];

  // Reset policy_name_id when company_id changes
  useEffect(() => {
    setValue("policy_name_id", undefined, { shouldValidate: true });
  }, [selectedCompanyId, setValue]);

  // Reset irrelevant fields when company changes
  useEffect(() => {
    // Reset Policy Name
    setValue("policy_name_id", undefined, { shouldValidate: true });

    // Reset commission_add_on_percentage if not relevant
    if (!showCommissionAddOn) {
      setValue("commission_add_on_percentage", undefined, {
        shouldValidate: true,
      });
    }

    // Reset deductible fields if not relevant
    if (hideDeductible || !deductibleOptions) {
      setValue("deductible_amount_status", false, { shouldValidate: true });
      setValue("deductible_amount", undefined, { shouldValidate: true });
    }
  }, [
    selectedCompanyId,
    showCommissionAddOn,
    hideDeductible,
    deductibleOptions,
    setValue,
  ]);

  // Auto-calculate end date based on start date and tenure years
  useEffect(() => {
    const startDate = wStartDate;
    const tenureYears = wTenureYears;

    if (startDate && tenureYears && tenureYears > 0) {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setFullYear(start.getFullYear() + tenureYears);

      // Subtract 1 day so the end date is inclusive (e.g., 28 Aug -> 27 Aug next tenure)
      end.setDate(end.getDate() - 1);

      // Format the end date as YYYY-MM-DD
      const endDateString = end.toISOString().split("T")[0];
      setValue("end_date", endDateString, { shouldValidate: true });
    }
  }, [wStartDate, wTenureYears, setValue]);

  // Keep customer_name in sync with proposer full name
  useEffect(() => {
    setValue("customer_name", wProposerFullName || "", {
      shouldValidate: true,
    });
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
          setValue(`members.${idx}.name`, wProposerFullName || "", {
            shouldValidate: true,
          });
        }
        if ((wProposerDob || "") !== currentDob) {
          setValue(`members.${idx}.date_of_birth`, wProposerDob || "", {
            shouldValidate: true,
          });
        }
        if ((wProposerGender || "") !== currentGender) {
          setValue(`members.${idx}.gender`, wProposerGender || "", {
            shouldValidate: true,
          });
        }
        if ((wProposerSalutation || "") !== currentSalutation) {
          setValue(
            `members.${idx}.insured_member_salutation`,
            wProposerSalutation || "",
            { shouldValidate: true }
          );
        }
      }
    });
  }, [
    wMembers,
    wProposerFullName,
    wProposerDob,
    wProposerGender,
    wProposerSalutation,
    setValue,
  ]);

  // Validate file types
  const validateFileType = (files: FileList | null) => {
    if (!files) return [];

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
      "text/csv", // .csv
    ];

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    Array.from(files).forEach((file) => {
      if (allowedTypes.includes(file.type)) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      toast.error(
        `Invalid file types: ${invalidFiles.join(
          ", "
        )}. Only PDF, JPG, PNG, DOC, XLSX, XLS, and CSV files are allowed.`
      );
    }

    return validFiles;
  };

  // Sanitize numeric inputs to allow only digits and limit to 10 characters
  const handleNumericInput: React.FormEventHandler<HTMLInputElement> = (e) => {
    const input = e.currentTarget;
    input.value = input.value.replace(/\D/g, "").slice(0, 10);
  };

  return (
    <div className="max-w-7xl mx-auto bg-white rounded-lg border border-gray-200 shadow-lg p-4 mt-4">
      {/* <div className="flex justify-between items-center mb-4 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border-l-4 border-blue-600">
        <h2 className="text-lg font-bold text-blue-800">
          Create New Policy
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
          <h3 className="text-base font-semibold text-blue-800 mb-0">
            Policy Holder Information
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Salutation
            </label>
            <Select
              value={watch("proposer.proposer_salutation")}
              onValueChange={(value) =>
                setValue("proposer.proposer_salutation", value, {
                  shouldValidate: true,
                })
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
                minLength: { value: 1, message: "Full name is required" },
              })}
              className={`h-9 text-sm ${
                errors.proposer?.full_name ? "border-red-500" : ""
              }`}
            />
            {errors.proposer?.full_name && (
              <p className="text-xs text-red-500 mt-1">
                {errors.proposer.full_name.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Date of Birth *
            </label>
            <Input
              type="date"
              min={new Date(1900, 0, 1).toISOString().split("T")[0]}
              max={new Date().toISOString().split("T")[0]}
              {...register("proposer.date_of_birth", {
                required: "Date of birth is required",
              })}
              className={`h-9 text-sm ${
                errors.proposer?.date_of_birth ? "border-red-500" : ""
              }`}
            />
            {errors.proposer?.date_of_birth && (
              <p className="text-xs text-red-500 mt-1">
                {errors.proposer.date_of_birth.message}
              </p>
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
            {errors.proposer?.gender && (
              <p className="text-xs text-red-500 mt-1">
                {errors.proposer.gender.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Marital Status
            </label>
            <Select
              value={watch("proposer.marital_status")}
              onValueChange={(value) =>
                setValue("proposer.marital_status", value, {
                  shouldValidate: true,
                })
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
            {errors.proposer?.marital_status && (
              <p className="text-xs text-red-500 mt-1">
                {errors.proposer.marital_status.message}
              </p>
            )}
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
                  message: "Please enter a valid 10-digit mobile number",
                },
              })}
              placeholder="10-digit number"
              onInput={handleNumericInput}
              maxLength={10}
              inputMode="numeric"
              className={`h-9 text-sm ${
                errors.proposer?.mobile ? "border-red-500" : ""
              }`}
            />
            {errors.proposer?.mobile && (
              <p className="text-xs text-red-500 mt-1">
                {errors.proposer.mobile.message}
              </p>
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
                  message: "Please enter a valid 10-digit mobile number",
                },
                validate: (value) => {
                  if (value && value.length > 0 && !/^[0-9]{10}$/.test(value)) {
                    return "Please enter a valid 10-digit mobile number";
                  }
                  return true;
                },
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
              {...register("proposer.email", {
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Please enter a valid email address",
                },
                validate: (value) => {
                  if (
                    value &&
                    value.length > 0 &&
                    !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)
                  ) {
                    return "Please enter a valid email address";
                  }
                  return true;
                },
              })}
              placeholder="Optional"
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              KYC ID
            </label>
            <Input {...register("proposer.kyc_id")} className="h-9 text-sm" />
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
            <Input {...register("proposer.address")} className="h-9 text-sm" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-700">
            Upload Proposer Documents
          </label>
          <div className="border border-gray-300 rounded p-1 flex items-center gap-2 hover:cursor-pointer w-[400px] h-[50px] align-middle">
            <Input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx,.xls,.csv"
              onChange={(e) => {
                const incoming = validateFileType(e.target.files);
                setProposerDocs((prev) => {
                  const available = Math.max(0, 5 - prev.length);
                  const toAdd = incoming.slice(0, available);
                  if (incoming.length > available) {
                    toast.error(
                      "You can upload a maximum of 5 proposer documents"
                    );
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

          {proposerDocs.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {proposerDocs.map((file, index) => (
                <div
                  key={file.name}
                  className="flex items-center gap-1 p-1 border border-blue-200 rounded bg-blue-50 text-xs"
                >
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
                      const newFiles = proposerDocs.filter(
                        (_, i) => i !== index
                      );
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
        </div>
        {/* Policy Details */}
        <div className="bg-green-50 p-3 rounded-md border-l-4 border-green-600 mb-3">
          <h3 className="text-base font-semibold text-green-800 mb-0">
            Policy Details
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Policy Number *
            </label>
            <Input
              {...register("policy_number", {
                required: "Policy number is required",
                minLength: { value: 1, message: "Policy number is required" },
              })}
              className={`h-9 text-sm ${
                errors.policy_number ? "border-red-500" : ""
              }`}
            />
            {errors.policy_number && (
              <p className="text-xs text-red-500 mt-1">
                {errors.policy_number.message}
              </p>
            )}
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
              className={`h-9 text-sm ${errors.customer_name ? 'border-red-500' : ''}`}
            />
            {errors.customer_name && (
              <p className="text-xs text-red-500 mt-1">{errors.customer_name.message}</p>
            )}
          </div> */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Policy Group
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
                {policyGroups.map((pt) => (
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
                {companies.map((company) => (
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
                {policyTypes.map((pt) => (
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
              <SelectTrigger
                className="w-full h-9 text-sm"
                disabled={!selectedCompanyId}
              >
                <SelectValue
                  placeholder={
                    selectedCompanyId
                      ? "Select policy name"
                      : "Select company first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {filteredPolicyNames.map((pn) => (
                  <SelectItem key={pn.id} value={pn.id}>
                    {pn.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Hidden field to register and submit customer_name synced from proposer.full_name */}
          <input
            type="hidden"
            value={watch("customer_name") || ""}
            {...register("customer_name")}
          />
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
              {...register("sum_insured", {
                min: {
                  value: 0,
                  message: "Sum insured must be 0 or greater",
                },
              })}
              placeholder="Optional"
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
              {watch("gst_status") ? "Premium Amount (GST Inclusive) (₹)" : "Premium Amount (₹)"}
            </label>
            <Input
              type="number"
              step="0.01"
              {...register("premium_amount", {
                setValueAs: (value) => {
                  if (!value || value === "") return undefined;
                  const amount = parseFloat(value);
                  
                  // If GST is enabled, store the user-entered amount and calculate GST-exclusive amount
                  if (watch("gst_status")) {
                    // Calculate GST-exclusive amount
                    const gstExclusiveAmount = amount / 1.18;
                    
                    // Store GST-exclusive amount in the separate field
                    setValue("premium_amount_gst", gstExclusiveAmount, { shouldValidate: true });
                    
                    // Return the user-entered amount (GST-inclusive) for premium_amount
                    return amount;
                  } else {
                    // If GST is disabled, clear GST-exclusive amount and store user-entered amount as-is
                    setValue("premium_amount_gst", undefined, { shouldValidate: true });
                    return amount;
                  }
                },
                min: {
                  value: 0,
                  message: "Premium amount must be 0 or greater",
                },
              })}
              placeholder={watch("gst_status") ? "Enter GST-inclusive amount" : "Enter premium amount"}
              className="h-9 text-sm"
            />
          </div>
          
          {/* Show GST-exclusive amount only when GST is enabled */}
          {watch("gst_status") && (
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">
                Premium Amount (GST Exclusive) (₹)
              </label>
              <Input
                type="number"
                step="0.01"
                value={
                  watch("premium_amount")
                    ? (Number(watch("premium_amount")) / 1.18).toFixed(2)
                    : ""
                }
                readOnly
                className="h-9 text-sm bg-gray-50"
              />
              {watch("premium_amount") && (
                <div className="text-xs text-gray-600 mt-1">
                  <span>GST Amount: ₹{watch("premium_amount_gst") ? (Number(watch("premium_amount")) - Number(watch("premium_amount_gst"))).toFixed(2) : "0.00"}</span>
                  <span className="ml-2 text-gray-500">
                    (Total GST Inclusive: ₹{Number(watch("premium_amount")).toFixed(2)})
                  </span>
                </div>
              )}
            </div>
          )}
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
                valueAsNumber: true,
                min: {
                  value: 1,
                  message: "Minimum tenure is 1 year",
                },
                max: {
                  value: 100,
                  message: "Maximum tenure is 100 years",
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
              min={new Date(1900, 0, 1).toISOString().split("T")[0]}
              max={new Date().toISOString().split("T")[0]}
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
              min={
                watch("start_date") ||
                new Date(1900, 0, 1).toISOString().split("T")[0]
              }
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
              min={new Date(1900, 0, 1).toISOString().split("T")[0]}
              max={new Date().toISOString().split("T")[0]}
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
                setValue(
                  "policy_creation_status",
                  value as "Fresh" | "Renewal" | "Migration" | "Portablity",
                  { shouldValidate: true }
                )
              }
            >
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fresh">Fresh</SelectItem>
                <SelectItem value="Renewal">Renewal</SelectItem>
                <SelectItem value="Migration">Internal Portability</SelectItem>
                <SelectItem value="Portablity">Portablity</SelectItem>
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
                min: {
                  value: 0,
                  message: "EMI amount must be 0 or greater",
                },
              })}
              placeholder="Optional"
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
                    setValue("deductible_amount_status", value === "Yes", {
                      shouldValidate: true,
                    })
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
                    value={
                      watch("deductible_amount")
                        ? String(watch("deductible_amount"))
                        : ""
                    }
                    onValueChange={(value) =>
                      setValue("deductible_amount", Number(value), {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger className="w-full h-9 text-sm">
                      <SelectValue placeholder="Select amount" />
                    </SelectTrigger>
                    <SelectContent>
                      {deductibleOptions.map((opt) => (
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

          {/* Commission Add-on Percentage - Auto-calculated, no manual input */}
          {/* Removed manual input field as per requirements - commission is now automatically calculated */}

          {/* Calculated Commission Display - Read-only */}
          {hasPermission('commission') && (
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">
                Commission Amount (₹) - Auto-calculated
              </label>
              <Input
                type="number"
                step="0.01"
                min={0}
                {...register("calculated_commission_amount", {
                  setValueAs: (value) => {
                    if (!value || value === "") return undefined;
                    const num = parseFloat(value);
                    return isNaN(num) ? undefined : num;
                  },
                  min: { value: 0, message: "Minimum is 0" },
                })}
                className="h-9 text-sm bg-gray-50"
                readOnly
              />
            </div>
          )}
            {/* {calculatedCommission.rule_found && (
    <div className="text-xs text-gray-600 mt-1 space-y-1">
      <div>Base Commission: {calculatedCommission.base_percentage}%</div>
      <div>Add-on Commission: {calculatedCommission.add_on_percentage}%</div>
      <div>Total Commission: {calculatedCommission.total_percentage}%</div>
    </div>
  )} */}
            {!calculatedCommission.rule_found && watch("policy_name_id") && (
              <div className="text-xs text-orange-600 mt-1">
                No commission rule found for the selected criteria
              </div>
            )}
          </div>

          {/* <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Calculated Commission Amount
            </label>
            <Input
              type="number"
              {...register("calculated_commission_amount")}
              className="h-9 text-sm"
              disabled
            />
          </div> */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Medical Condition
            </label>
            <Select
              value={watch("medical_condition") ? "Yes" : "No"}
              onValueChange={(value) =>
                setValue("medical_condition", value === "Yes", {
                  shouldValidate: true,
                })
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

        {/* Policy Documents upload */}
        <div className="bg-purple-50 p-3 rounded-md border-l-4 border-purple-600 mb-3">
          <h3 className="text-base font-semibold text-purple-800 mb-0">
            Policy Documents
          </h3>
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
                setPolicyDocs((prev) => {
                  const available = Math.max(0, 5 - prev.length);
                  const toAdd = incoming.slice(0, available);
                  if (incoming.length > available) {
                    toast.error(
                      "You can upload a maximum of 5 policy documents"
                    );
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
                <div
                  key={file.name}
                  className="flex items-center gap-1 p-1 border border-purple-200 rounded bg-purple-50 text-xs"
                >
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
        </div>

        {/* Members */}
        <div className="bg-indigo-50 p-3 rounded-md border-l-4 border-indigo-600 mb-3">
          <h3 className="text-base font-semibold text-indigo-800 mb-0">
            Insured Members
          </h3>
        </div>
        <div className="space-y-3">
          {memberFields.length === 0 && (
            <div className="text-gray-500 text-xs text-center py-4 bg-gray-50 rounded border-2 border-dashed border-gray-200">
              No members added yet. Click "Add Member" to add insured members.
            </div>
          )}
          {memberFields.map((field, index) => (
            <div
              key={field.id}
              className="border border-indigo-200 rounded-lg p-4 bg-indigo-50"
              data-member-card
            >
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-semibold text-indigo-800">
                  Member {index + 1}
                </h4>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeMember(index)}
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
                      setValue(
                        `members.${index}.insured_member_salutation`,
                        value,
                        { shouldValidate: true }
                      )
                    }
                  >
                    <SelectTrigger
                      className="w-full h-9 text-sm"
                      disabled={
                        watch(`members.${index}.relation_to_proposer`) ===
                        "Self"
                      }
                    >
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
                      minLength: {
                        value: 1,
                        message: "Member name is required",
                      },
                    })}
                    className={`h-9 text-sm ${
                      errors.members?.[index]?.name ? "border-red-500" : ""
                    }`}
                    disabled={
                      watch(`members.${index}.relation_to_proposer`) === "Self"
                    }
                  />
                  {errors.members?.[index]?.name && (
                    <p className="text-xs text-red-500 mt-1">
                      {String(errors.members?.[index]?.name?.message)}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Relation *
                  </label>
                  <Select
                    value={watch(`members.${index}.relation_to_proposer`)}
                    onValueChange={(value) => {
                      setValue(`members.${index}.relation_to_proposer`, value, {
                        shouldValidate: true,
                      });
                      if (value === "Self") {
                        setValue(
                          `members.${index}.name`,
                          watch("proposer.full_name") || "",
                          { shouldValidate: true }
                        );
                        setValue(
                          `members.${index}.date_of_birth`,
                          watch("proposer.date_of_birth") || "",
                          { shouldValidate: true }
                        );
                        setValue(
                          `members.${index}.gender`,
                          watch("proposer.gender") || "",
                          { shouldValidate: true }
                        );
                        setValue(
                          `members.${index}.insured_member_salutation`,
                          watch("proposer.proposer_salutation") || "",
                          { shouldValidate: true }
                        );
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
                  {/* Hidden input to enforce validation for Select */}
                  <input
                    type="hidden"
                    value={watch(`members.${index}.relation_to_proposer`) || ""}
                    {...register(
                      `members.${index}.relation_to_proposer` as const,
                      {
                        required: "Relation is required",
                      }
                    )}
                  />
                  {errors.members?.[index]?.relation_to_proposer && (
                    <p className="text-xs text-red-500 mt-1">
                      {String(
                        errors.members?.[index]?.relation_to_proposer?.message
                      )}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Date of Birth *
                  </label>
                  <Input
                    type="date"
                    min={new Date(1900, 0, 1).toISOString().split("T")[0]}
                    max={new Date().toISOString().split("T")[0]}
                    {...register(`members.${index}.date_of_birth` as const, {
                      required: "Date of birth is required",
                    })}
                    className={`h-9 text-sm ${
                      errors.members?.[index]?.date_of_birth
                        ? "border-red-500"
                        : ""
                    }`}
                    disabled={
                      watch(`members.${index}.relation_to_proposer`) === "Self"
                    }
                  />
                  {errors.members?.[index]?.date_of_birth && (
                    <p className="text-xs text-red-500 mt-1">
                      {String(errors.members?.[index]?.date_of_birth?.message)}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Gender *
                  </label>
                  <Select
                    value={watch(`members.${index}.gender`)}
                    onValueChange={(value) =>
                      setValue(`members.${index}.gender`, value, {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger
                      className="w-full h-9 text-sm"
                      disabled={
                        watch(`members.${index}.relation_to_proposer`) ===
                        "Self"
                      }
                    >
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {/* Hidden input to enforce validation for Select */}
                  <input
                    type="hidden"
                    value={watch(`members.${index}.gender`) || ""}
                    {...register(`members.${index}.gender` as const, {
                      required: "Gender is required",
                    })}
                  />
                  {errors.members?.[index]?.gender && (
                    <p className="text-xs text-red-500 mt-1">
                      {String(errors.members?.[index]?.gender?.message)}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Medical Condition
                  </label>
                  <Select
                    value={
                      watch(`members.${index}.insured_member_medical_condition`)
                        ? "Yes"
                        : "No"
                    }
                    onValueChange={(value) =>
                      setValue(
                        `members.${index}.insured_member_medical_condition`,
                        value === "Yes",
                        { shouldValidate: true }
                      )
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
                      value={
                        watch(
                          `members.${index}.insured_member_medical_remarks`
                        ) || ""
                      }
                      onChange={(e) =>
                        setValue(
                          `members.${index}.insured_member_medical_remarks`,
                          e.target.value,
                          { shouldValidate: true }
                        )
                      }
                      placeholder="Enter medical condition details..."
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Member-specific Document Upload */}
              <div className="mt-4 p-3 bg-white rounded border border-indigo-200 group ">
                <h5 className="text-xs font-semibold text-indigo-700 mb-2">
                  Member {index + 1} Documents
                </h5>

                <div className="space-y-2 group ">
                  <label className="block text-xs font-semibold text-gray-700">
                    Upload Documents for{" "}
                    {watch(`members.${index}.name`) || `Member ${index + 1}`}
                  </label>
                  <div className="border border-gray-300 rounded p-1 flex items-center gap-2 hover:cursor-pointer w-[400px] h-[50px] align-middle">
                    <Input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx,.xls,.csv"
                      onChange={(e) => {
                        const validFiles = validateFileType(e.target.files);
                        setMemberDocs((prev) => ({
                          ...prev,
                          [index]: [...(prev[index] || []), ...validFiles],
                        }));
                      }}
                      className="text-xs cursor-pointer file:cursor-pointer w-[200px] h-[30px] p-1 pl-3 text-center"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, JPG, PNG, DOC, XLSX, CSV (max 5 files)
                    </p>
                  </div>

                  {(memberDocs[index] || []).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(memberDocs[index] || []).map((file, fileIndex) => (
                        <div
                          key={file.name}
                          className="flex items-center gap-1 p-1 border border-indigo-200 rounded bg-indigo-50 text-xs"
                        >
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
                                [index]: (prev[index] || []).filter(
                                  (_, i) => i !== fileIndex
                                ),
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

                  {(memberDocs[index] || []).length === 0 && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-500 text-center">
                      No documents uploaded for this member
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Add Member button at the bottom */}
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
          <h3 className="text-base font-semibold text-teal-800 mb-0">
            Nominee Information
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Nominee Salutation
            </label>
            <Select
              value={watch("nominee_payment.nominee_salutation")}
              onValueChange={(value) =>
                setValue("nominee_payment.nominee_salutation", value, {
                  shouldValidate: true,
                })
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
                setValue("nominee_payment.nominee_name", e.target.value, {
                  shouldValidate: true,
                })
              }
              placeholder="Optional"
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
                setValue("nominee_payment.nominee_relation", value, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue placeholder="Optional - Select relation" />
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
              min={new Date(1900, 0, 1).toISOString().split("T")[0]}
              max={new Date().toISOString().split("T")[0]}
              value={watch("nominee_payment.nominee_dob")}
              onChange={(e) =>
                setValue("nominee_payment.nominee_dob", e.target.value, {
                  shouldValidate: true,
                })
              }
              placeholder="Optional"
              className="h-9 text-sm"
            />
          </div>
        </div>
        {/* Payment */}
        <div className="bg-indigo-50 p-3 rounded-md border-l-4 border-indigo-600 mb-3">
          <h3 className="text-base font-semibold text-indigo-800 mb-0">
            Payment Information
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Payment Mode
            </label>
            <Select
              value={watch("nominee_payment.payment_mode")}
              onValueChange={(value) =>
                setValue("nominee_payment.payment_mode", value, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue placeholder="Optional - Select payment mode" />
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
                setValue("nominee_payment.payment_reference", e.target.value, {
                  shouldValidate: true,
                })
              }
              placeholder="Optional"
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
                setValue("nominee_payment.bank_name", e.target.value, {
                  shouldValidate: true,
                })
              }
              placeholder="Optional"
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
                setValue(
                  "nominee_payment.bank_account_number",
                  e.target.value,
                  { shouldValidate: true }
                )
              }
              placeholder="Optional"
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
                setValue("nominee_payment.bank_ifsc_code", e.target.value, {
                  shouldValidate: true,
                })
              }
              placeholder="Optional"
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
                setValue("nominee_payment.bank_branch_name", e.target.value, {
                  shouldValidate: true,
                })
              }
              placeholder="Optional"
              className="h-9 text-sm"
            />
          </div>
        </div>

        {/* Declaration - Hidden as requested */}
        {/* <div className="flex items-center mt-4">
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
            {isSubmitting ? "Submitting..." : "Create Policy"}
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
};

export default PolicyForm;


