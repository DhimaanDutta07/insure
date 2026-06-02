import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

export interface PolicyName {
  id: string;
  name: string;
  description?: string;
  policy_group_id?: string;
  policyGroup?: {
    id: string;
    name: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface CreatePolicyNameRequest {
  name: string;
  description?: string;
  policy_group_id?: string;
}

export interface UpdatePolicyNameRequest {
  name?: string;
  description?: string;
  policy_group_id?: string;
}

export const getAllPolicyNames = async (): Promise<PolicyName[]> => {
  const response = await axios.get(`${API_BASE_URL}/api/v1/policy-names`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return response.data;
};

export const getPolicyNameById = async (id: string): Promise<PolicyName> => {
  const response = await axios.get(`${API_BASE_URL}/api/v1/policy-names/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return response.data;
};

export const getPolicyNamesByGroupId = async (groupId: string): Promise<PolicyName[]> => {
  const response = await axios.get(`${API_BASE_URL}/api/v1/policy-groups/${groupId}/policy-names`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return response.data;
};

export const createPolicyName = async (groupId: string, data: CreatePolicyNameRequest): Promise<PolicyName> => {
  const response = await axios.post(`${API_BASE_URL}/api/v1/policy-groups/${groupId}/policy-names`, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return response.data;
};

export const updatePolicyName = async (id: string, data: UpdatePolicyNameRequest): Promise<PolicyName> => {
  const response = await axios.patch(`${API_BASE_URL}/api/v1/policy-names/${id}`, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return response.data;
};

export const deletePolicyName = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/api/v1/policy-names/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
}; 