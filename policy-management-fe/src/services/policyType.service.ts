import apiClient from './apiClient';

export interface PolicyType {
  id: string;
  name: string;
  _count?: {
    policies: number;
  };
}

export interface CreatePolicyTypeRequest {
  name: string;
}

export interface UpdatePolicyTypeRequest {
  name?: string;
}

export const getAllPolicyTypes = async (): Promise<PolicyType[]> => {
  const response = await apiClient.get('/api/v1/policy-types');
  return response.data;
};

export const getPolicyTypeById = async (id: string): Promise<PolicyType> => {
  const response = await apiClient.get(`/api/v1/policy-types/${id}`);
  return response.data;
};

export const createPolicyType = async (data: CreatePolicyTypeRequest): Promise<PolicyType> => {
  const response = await apiClient.post('/api/v1/policy-types', data);
  return response.data;
};

export const updatePolicyType = async (id: string, data: UpdatePolicyTypeRequest): Promise<PolicyType> => {
  const response = await apiClient.patch(`/api/v1/policy-types/${id}`, data);
  return response.data;
};

export const deletePolicyType = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/v1/policy-types/${id}`);
}; 