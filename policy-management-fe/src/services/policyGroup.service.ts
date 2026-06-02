import axios from 'axios';
import { PolicyGroup, PolicyName } from '../types/index';

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

// PolicyGroup CRUD
export const getAllPolicyGroups = async (): Promise<PolicyGroup[]> => {
  const res = await axios.get(`${API_BASE_URL}/api/v1/policy-groups`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data.policyGroups;
};

export const getPolicyGroup = async (id: string): Promise<PolicyGroup> => {
  const res = await axios.get(`${API_BASE_URL}/api/v1/policy-groups/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const createPolicyGroup = async (data: { name: string; description?: string | null }): Promise<PolicyGroup> => {
  const res = await axios.post(`${API_BASE_URL}/api/v1/policy-groups`, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const updatePolicyGroup = async (id: string, data: { name: string; description?: string | null }): Promise<PolicyGroup> => {
  const res = await axios.patch(`${API_BASE_URL}/api/v1/policy-groups/${id}`, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const deletePolicyGroup = async (id: string): Promise<PolicyGroup> => {
  const res = await axios.delete(`${API_BASE_URL}/api/v1/policy-groups/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

// PolicyName CRUD
export const getAllPolicyNames = async (): Promise<PolicyName[]> => {
  const res = await axios.get(`${API_BASE_URL}/api/v1/policy-names`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const getPolicyNamesByGroup = async (groupId: string): Promise<PolicyName[]> => {
  const res = await axios.get(`${API_BASE_URL}/api/v1/policy-groups/${groupId}/policy-names`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const getPolicyName = async (id: string): Promise<PolicyName> => {
  const res = await axios.get(`${API_BASE_URL}/api/v1/policy-names/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const createPolicyName = async (groupId: string, data: { name: string; description?: string | null }): Promise<PolicyName> => {
  const res = await axios.post(`${API_BASE_URL}/api/v1/policy-groups/${groupId}/policy-names`, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const updatePolicyName = async (id: string, data: { name: string; description?: string | null; policy_group_id: string }): Promise<PolicyName> => {
  const res = await axios.patch(`${API_BASE_URL}/api/v1/policy-names/${id}`, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const deletePolicyName = async (id: string): Promise<PolicyName> => {
  const res = await axios.delete(`${API_BASE_URL}/api/v1/policy-names/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
}; 