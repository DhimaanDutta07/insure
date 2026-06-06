import axios from 'axios';
import type { CommissionRule } from '../types/index';

const API_BASE_URL = (import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '');

// Define search parameters type
export interface CommissionRuleSearchParams {
  search?: string;
  policyStatus?: string;
  deductibleType?: string;
  ageCondition?: string;
  page?: number;
  limit?: number;
  isActive?: boolean; // <-- add this
}

// Define paginated response type
export interface PaginatedCommissionRuleResponse {
  data: CommissionRule[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getAllCommissionRules = async (searchParams?: CommissionRuleSearchParams): Promise<CommissionRule[] | PaginatedCommissionRuleResponse> => {
  const params = new URLSearchParams();
  
  if (searchParams) {
    if (searchParams.search) params.append('search', searchParams.search);
    if (searchParams.policyStatus) params.append('policyStatus', searchParams.policyStatus);
    if (searchParams.deductibleType) params.append('deductibleType', searchParams.deductibleType);
    if (searchParams.ageCondition) params.append('ageCondition', searchParams.ageCondition);
    if (searchParams.page) params.append('page', searchParams.page.toString());
    if (searchParams.limit) params.append('limit', searchParams.limit.toString());
    if (typeof searchParams.isActive === 'boolean') params.append('isActive', searchParams.isActive ? 'true' : 'false');
  }

  const url = searchParams ? `${API_BASE_URL}/api/v1/commission-rules?${params.toString()}` : `${API_BASE_URL}/api/v1/commission-rules`;
  
  const res = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const searchCommissionRules = async (searchParams: CommissionRuleSearchParams): Promise<PaginatedCommissionRuleResponse> => {
  const params = new URLSearchParams();
  
  if (searchParams.search) params.append('search', searchParams.search);
  if (searchParams.policyStatus) params.append('policyStatus', searchParams.policyStatus);
  if (searchParams.deductibleType) params.append('deductibleType', searchParams.deductibleType);
  if (searchParams.ageCondition) params.append('ageCondition', searchParams.ageCondition);
  if (searchParams.page) params.append('page', searchParams.page.toString());
  if (searchParams.limit) params.append('limit', searchParams.limit.toString());
  if (typeof searchParams.isActive === 'boolean') params.append('isActive', searchParams.isActive ? 'true' : 'false');

  const res = await axios.get(`${API_BASE_URL}/api/v1/commission-rules?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const getCommissionRuleById = async (id: string): Promise<CommissionRule> => {
  const res = await axios.get(`${API_BASE_URL}/api/v1/commission-rules/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const createCommissionRule = async (data: Omit<CommissionRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<CommissionRule> => {
  const res = await axios.post(`${API_BASE_URL}/api/v1/commission-rules`, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const updateCommissionRule = async (id: string, data: Partial<Omit<CommissionRule, 'id' | 'createdAt' | 'updatedAt'>>): Promise<CommissionRule> => {
  const res = await axios.patch(`${API_BASE_URL}/api/v1/commission-rules/${id}`, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const updateCommissionRuleStatus = async (id: string, isActive: boolean): Promise<CommissionRule> => {
  const res = await axios.patch(`${API_BASE_URL}/api/v1/commission-rules/${id}/status`, { is_active: isActive }, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const deleteCommissionRule = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/api/v1/commission-rules/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
}; 

export async function updateCommissionRulesStatusByPolicy(policyNameId: string, is_active: boolean) {
  const response = await fetch(`${(import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '')}/api/v1/commission-rules/policy/${policyNameId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
    body: JSON.stringify({ is_active }),
  });
  if (!response.ok) {
    throw new Error('Failed to update commission rules status');
  }
  return response.json();
}

// Simplified: get commission percentage for a product
export async function getCommissionByProduct(policyNameId: string): Promise<{ commissionPercent: number; rule: CommissionRule | null }> {
  const response = await fetch(`${(import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '')}/api/v1/commission-rules/product/${policyNameId}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch commission for product');
  }
  return response.json();
}

// Simplified: upsert commission percentage for a product with optional sub-classifications
export async function upsertCommissionByProduct(policyNameId: string, commissionPercent: number, productType?: string, policyStatus?: string, siCondition?: string): Promise<{ success: boolean; rule: CommissionRule }> {
  const response = await fetch(`${(import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '')}/api/v1/commission-rules/product/${policyNameId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
    body: JSON.stringify({ commissionPercent, productType, policyStatus, siCondition }),
  });
  if (!response.ok) {
    throw new Error('Failed to update commission for product');
  }
  return response.json();
}