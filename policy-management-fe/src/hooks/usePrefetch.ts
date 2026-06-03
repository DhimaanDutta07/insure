// Prefetching utilities for instant navigation
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getPolicyById } from '../services/policy.service';
import { getCompanyById } from '../services/company.service';
import { getAgentById } from '../services/agent.service';
import { getAllCompanies } from '../services/company.service';
import { getAllPolicyTypes } from '../services/policyType.service';
import { getAllPolicyGroups } from '../services/policyGroup.service';
import { getAllPolicyNames as getPolicyNames } from '../services/policyName.service';
import { getAllAgents } from '../services/agent.service';
import { getAllCommissions } from '../services/commission.service';
import { queryKeys } from './useApi';

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

export function usePrefetchCompany() {
  const qc = useQueryClient();
  return useCallback(
    (id: string) => {
      qc.prefetchQuery({
        queryKey: queryKeys.company(id),
        queryFn: () => getCompanyById(id),
        staleTime: 300_000,
      });
    },
    [qc]
  );
}

export function usePrefetchAgent() {
  const qc = useQueryClient();
  return useCallback(
    (id: string) => {
      qc.prefetchQuery({
        queryKey: queryKeys.agent(id),
        queryFn: () => getAgentById(id),
        staleTime: 60_000,
      });
    },
    [qc]
  );
}

export function usePrefetchReferenceData() {
  const qc = useQueryClient();
  return useCallback(() => {
    // Preload all reference data that almost every page needs
    qc.prefetchQuery({
      queryKey: queryKeys.companies(),
      queryFn: getAllCompanies,
      staleTime: 300_000,
    });
    qc.prefetchQuery({
      queryKey: queryKeys.policyTypes(),
      queryFn: getAllPolicyTypes,
      staleTime: 300_000,
    });
    qc.prefetchQuery({
      queryKey: queryKeys.policyGroups(),
      queryFn: getAllPolicyGroups,
      staleTime: 300_000,
    });
    qc.prefetchQuery({
      queryKey: queryKeys.policyNames(),
      queryFn: getPolicyNames,
      staleTime: 300_000,
    });
    qc.prefetchQuery({
      queryKey: queryKeys.agents(),
      queryFn: getAllAgents,
      staleTime: 60_000,
    });
    qc.prefetchQuery({
      queryKey: queryKeys.commissions(),
      queryFn: getAllCommissions,
      staleTime: 60_000,
    });
  }, [qc]);
}
