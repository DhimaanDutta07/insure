// Ultra-fast data hooks with aggressive caching, prefetching, and optimistic updates
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import {
  getAllPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  deletePolicy,
  importPolicies,
  policyService,
} from '../services/policy.service';
import {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyFormFields,
} from '../services/company.service';
import {
  getAllAgents,
  createAgent,
  updateAgent,
  deleteAgent,
} from '../services/agent.service';
import {
  getAllCommissions,
  createCommission,
  updateCommission,
  deleteCommission,
} from '../services/commission.service';
import {
  getAllRevenues,
  createRevenue,
  updateRevenue,
  deleteRevenue,
  getRevenuesByTimePeriod,
} from '../services/revenue.service';
import {
  getPolicyClaims,
  getClaimById,
  createClaim,
  updateClaim,
  updateClaimStatus,
  deleteClaim,
} from '../services/claim.service';
import { enquiryService } from '../services/enquiry.service';
import {
  getAllPolicyNames as getPolicyNames,
  createPolicyName,
  updatePolicyName,
  deletePolicyName,
} from '../services/policyName.service';
import {
  getAllPolicyGroups,
  createPolicyGroup,
  updatePolicyGroup,
  deletePolicyGroup,
} from '../services/policyGroup.service';
import {
  getAllPolicyTypes,
  createPolicyType,
  updatePolicyType,
  deletePolicyType,
} from '../services/policyType.service';
import {
  getAllCommissionRules as getCommissionRules,
  createCommissionRule,
  updateCommissionRule,
  deleteCommissionRule,
} from '../services/commissionRule.service';
import {
  getAllPolicyReceipts,
  createPolicyReceipt,
  updatePolicyReceipt,
  deletePolicyReceipt,
} from '../services/policyReceipt.service';
import { useCallback } from 'react';

// Query key factories - centralized for consistency
export const queryKeys = {
  policies: (params?: Record<string, unknown>) => ['policies', params] as const,
  policy: (id: string) => ['policy', id] as const,
  policyClaims: (policyId: string) => ['claims', policyId] as const,
  claim: (id: string) => ['claim', id] as const,
  companies: () => ['companies'] as const,
  company: (id: string) => ['company', id] as const,
  companyFormFields: (id: string) => ['companyFormFields', id] as const,
  agents: () => ['agents'] as const,
  agent: (id: string) => ['agent', id] as const,
  commissions: () => ['commissions'] as const,
  commission: (id: string) => ['commission', id] as const,
  revenues: () => ['revenues'] as const,
  revenue: (id: string) => ['revenue', id] as const,
  revenuesByTime: (timePeriod: string, siteId: string) => ['revenues', timePeriod, siteId] as const,
  enquiries: () => ['enquiries'] as const,
  enquiry: (id: string) => ['enquiry', id] as const,
  policyNames: () => ['policyNames'] as const,
  policyName: (id: string) => ['policyName', id] as const,
  policyGroups: () => ['policyGroups'] as const,
  policyGroup: (id: string) => ['policyGroup', id] as const,
  policyTypes: () => ['policyTypes'] as const,
  policyType: (id: string) => ['policyType', id] as const,
  commissionRules: () => ['commissionRules'] as const,
  commissionRule: (id: string) => ['commissionRule', id] as const,
  policyReceipts: () => ['policyReceipts'] as const,
  policyReceipt: (id: string) => ['policyReceipt', id] as const,
  dashboard: (timeRange?: string) => ['dashboard', timeRange] as const,
};

// ─── POLICIES ───────────────────────────────────────────

export function usePolicies(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.policies(params),
    queryFn: () => getAllPolicies(params),
    staleTime: 15_000,
    gcTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
}

export function usePolicy(id: string) {
  return useQuery({
    queryKey: queryKeys.policy(id),
    queryFn: () => getPolicyById(id),
    staleTime: 30_000,
    gcTime: 10 * 60_000,
    enabled: !!id,
  });
}

export function usePrefetchPolicy() {
  const qc = useQueryClient();
  return useCallback(
    (id: string) => {
      qc.prefetchQuery({
        queryKey: queryKeys.policy(id),
        queryFn: () => getPolicyById(id),
        staleTime: 30_000,
      });
    },
    [qc]
  );
}

export function useCreatePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPolicy,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['policies'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdatePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) => updatePolicy(id, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.policy(variables.id) });
      qc.invalidateQueries({ queryKey: ['policies'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeletePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePolicy,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['policies'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useImportPolicies() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: importPolicies,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['policies'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDashboardStats(timeRange?: string) {
  return useQuery({
    queryKey: queryKeys.dashboard(timeRange),
    queryFn: () => policyService.getDashboardStats(timeRange),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

// ─── COMPANIES ──────────────────────────────────────────

export function useCompanies() {
  return useQuery({
    queryKey: queryKeys.companies(),
    queryFn: getAllCompanies,
    staleTime: 300_000, // 5min - reference data rarely changes
    gcTime: 10 * 60_000,
  });
}

export function useCompany(id: string) {
  return useQuery({
    queryKey: queryKeys.company(id),
    queryFn: () => getCompanyById(id),
    staleTime: 300_000,
    enabled: !!id,
  });
}

export function useCompanyFormFields(companyId: string) {
  return useQuery({
    queryKey: queryKeys.companyFormFields(companyId),
    queryFn: () => getCompanyFormFields(companyId),
    staleTime: 300_000,
    enabled: !!companyId,
  });
}

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCompany,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateCompany>[1] }) => updateCompany(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  });
}

export function useDeleteCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCompany,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  });
}

// ─── AGENTS ─────────────────────────────────────────────

export function useAgents() {
  return useQuery({
    queryKey: queryKeys.agents(),
    queryFn: getAllAgents,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}

export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAgent,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agents'] }),
  });
}

export function useUpdateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateAgent>[1] }) => updateAgent(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agents'] }),
  });
}

export function useDeleteAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAgent,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agents'] }),
  });
}

// ─── COMMISSIONS ────────────────────────────────────────

export function useCommissions() {
  return useQuery({
    queryKey: queryKeys.commissions(),
    queryFn: getAllCommissions,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}

export function useCreateCommission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCommission,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commissions'] }),
  });
}

export function useUpdateCommission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateCommission>[1] }) => updateCommission(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commissions'] }),
  });
}

export function useDeleteCommission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCommission,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commissions'] }),
  });
}

// ─── REVENUES ───────────────────────────────────────────

export function useRevenues() {
  return useQuery({
    queryKey: queryKeys.revenues(),
    queryFn: getAllRevenues,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export function useRevenuesByTime(timePeriod: string, siteId: string) {
  return useQuery({
    queryKey: queryKeys.revenuesByTime(timePeriod, siteId),
    queryFn: () => getRevenuesByTimePeriod(timePeriod, siteId),
    staleTime: 30_000,
    enabled: !!timePeriod && !!siteId,
  });
}

export function useCreateRevenue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createRevenue,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['revenues'] }),
  });
}

export function useUpdateRevenue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateRevenue>[1] }) => updateRevenue(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['revenues'] }),
  });
}

export function useDeleteRevenue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteRevenue,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['revenues'] }),
  });
}

// ─── CLAIMS ───────────────────────────────────────────────

export function usePolicyClaims(policyId: string) {
  return useQuery({
    queryKey: queryKeys.policyClaims(policyId),
    queryFn: () => getPolicyClaims(policyId),
    staleTime: 30_000,
    enabled: !!policyId,
  });
}

export function useClaim(claimId: string) {
  return useQuery({
    queryKey: queryKeys.claim(claimId),
    queryFn: () => getClaimById(claimId),
    staleTime: 30_000,
    enabled: !!claimId,
  });
}

export function useCreateClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ policyId, data, files }: { policyId: string; data: Parameters<typeof createClaim>[1]; files?: File[] }) =>
      createClaim(policyId, data, files),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.policyClaims(vars.policyId) });
    },
  });
}

export function useUpdateClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ claimId, data, files }: { claimId: string; data: Parameters<typeof updateClaim>[1]; files?: File[] }) =>
      updateClaim(claimId, data, files),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['claims'] });
    },
  });
}

export function useUpdateClaimStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ claimId, status, rejectionReason }: { claimId: string; status: string; rejectionReason?: string }) =>
      updateClaimStatus(claimId, status, rejectionReason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['claims'] });
    },
  });
}

export function useDeleteClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteClaim,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['claims'] });
    },
  });
}

// ─── ENQUIRIES ────────────────────────────────────────

export function useEnquiries() {
  return useQuery({
    queryKey: queryKeys.enquiries(),
    queryFn: () => enquiryService.getAllEnquiries(),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export function useEnquiry(id: string) {
  return useQuery({
    queryKey: queryKeys.enquiry(id),
    queryFn: () => enquiryService.getEnquiryById(id),
    staleTime: 30_000,
    enabled: !!id,
  });
}

export function useCreateEnquiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: enquiryService.createEnquiry,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['enquiries'] }),
  });
}

export function useUpdateEnquiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof enquiryService.updateEnquiry>[1] }) =>
      enquiryService.updateEnquiry(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['enquiries'] }),
  });
}

export function useDeleteEnquiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: enquiryService.deleteEnquiry,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['enquiries'] }),
  });
}

// ─── POLICY NAMES ───────────────────────────────────────

export function usePolicyNames() {
  return useQuery({
    queryKey: queryKeys.policyNames(),
    queryFn: getPolicyNames,
    staleTime: 300_000,
    gcTime: 10 * 60_000,
  });
}

export function useCreatePolicyName() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: Parameters<typeof createPolicyName>[1] }) => createPolicyName(groupId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['policyNames'] }),
  });
}

export function useUpdatePolicyName() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updatePolicyName>[1] }) => updatePolicyName(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['policyNames'] }),
  });
}

export function useDeletePolicyName() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePolicyName,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['policyNames'] }),
  });
}

// ─── POLICY GROUPS ────────────────────────────────────

export function usePolicyGroups() {
  return useQuery({
    queryKey: queryKeys.policyGroups(),
    queryFn: getAllPolicyGroups,
    staleTime: 300_000,
    gcTime: 10 * 60_000,
  });
}

export function useCreatePolicyGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPolicyGroup,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['policyGroups'] }),
  });
}

export function useUpdatePolicyGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updatePolicyGroup>[1] }) => updatePolicyGroup(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['policyGroups'] }),
  });
}

export function useDeletePolicyGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePolicyGroup,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['policyGroups'] }),
  });
}

// ─── POLICY TYPES ─────────────────────────────────────

export function usePolicyTypes() {
  return useQuery({
    queryKey: queryKeys.policyTypes(),
    queryFn: getAllPolicyTypes,
    staleTime: 300_000,
    gcTime: 10 * 60_000,
  });
}

export function useCreatePolicyType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPolicyType,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['policyTypes'] }),
  });
}

export function useUpdatePolicyType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updatePolicyType>[1] }) => updatePolicyType(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['policyTypes'] }),
  });
}

export function useDeletePolicyType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePolicyType,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['policyTypes'] }),
  });
}

// ─── COMMISSION RULES ─────────────────────────────────

export function useCommissionRules() {
  return useQuery({
    queryKey: queryKeys.commissionRules(),
    queryFn: () => getCommissionRules(),
    staleTime: 300_000,
    gcTime: 10 * 60_000,
  });
}

export function useCreateCommissionRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCommissionRule,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commissionRules'] }),
  });
}

export function useUpdateCommissionRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateCommissionRule>[1] }) => updateCommissionRule(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commissionRules'] }),
  });
}

export function useDeleteCommissionRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCommissionRule,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commissionRules'] }),
  });
}

// ─── POLICY RECEIPTS ──────────────────────────────────

export function usePolicyReceipts() {
  return useQuery({
    queryKey: queryKeys.policyReceipts(),
    queryFn: getAllPolicyReceipts,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export function useCreatePolicyReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPolicyReceipt,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['policyReceipts'] }),
  });
}

export function useUpdatePolicyReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updatePolicyReceipt>[1] }) => updatePolicyReceipt(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['policyReceipts'] }),
  });
}

export function useDeletePolicyReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePolicyReceipt,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['policyReceipts'] }),
  });
}

// ─── PREFETCH HELPERS ─────────────────────────────────

export function usePrefetchAll() {
  const qc = useQueryClient();
  return useCallback(() => {
    // Preload reference data that almost every page needs
    qc.prefetchQuery({ queryKey: queryKeys.companies(), queryFn: getAllCompanies, staleTime: 300_000 });
    qc.prefetchQuery({ queryKey: queryKeys.policyTypes(), queryFn: getAllPolicyTypes, staleTime: 300_000 });
    qc.prefetchQuery({ queryKey: queryKeys.policyGroups(), queryFn: getAllPolicyGroups, staleTime: 300_000 });
    qc.prefetchQuery({ queryKey: queryKeys.policyNames(), queryFn: getPolicyNames, staleTime: 300_000 });
    qc.prefetchQuery({ queryKey: queryKeys.agents(), queryFn: getAllAgents, staleTime: 60_000 });
    qc.prefetchQuery({ queryKey: queryKeys.commissions(), queryFn: getAllCommissions, staleTime: 60_000 });
  }, [qc]);
}
