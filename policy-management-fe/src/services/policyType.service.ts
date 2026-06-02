import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

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
  const response = await axios.get(`${API_BASE_URL}/api/v1/policy-types`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return response.data;
};

export const getPolicyTypeById = async (id: string): Promise<PolicyType> => {
  const response = await axios.get(`${API_BASE_URL}/api/v1/policy-types/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return response.data;
};

export const createPolicyType = async (data: CreatePolicyTypeRequest): Promise<PolicyType> => {
  const response = await axios.post(`${API_BASE_URL}/api/v1/policy-types`, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return response.data;
};

export const updatePolicyType = async (id: string, data: UpdatePolicyTypeRequest): Promise<PolicyType> => {
  const response = await axios.patch(`${API_BASE_URL}/api/v1/policy-types/${id}`, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return response.data;
};

export const deletePolicyType = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/api/v1/policy-types/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
}; 