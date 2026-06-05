import apiClient from './apiClient';
import { PolicyGroup, PolicyName } from '../types/index';

// PolicyGroup CRUD
export const getAllPolicyGroups = async (): Promise<PolicyGroup[]> => {
  const res = await apiClient.get('/api/v1/policy-groups');
  return res.data.policyGroups;
};

export const getPolicyGroup = async (id: string): Promise<PolicyGroup> => {
  const res = await apiClient.get(`/api/v1/policy-groups/${id}`);
  return res.data;
};

export const createPolicyGroup = async (data: { name: string; description?: string | null }): Promise<PolicyGroup> => {
  const res = await apiClient.post('/api/v1/policy-groups', data);
  return res.data;
};

export const updatePolicyGroup = async (id: string, data: { name: string; description?: string | null }): Promise<PolicyGroup> => {
  const res = await apiClient.patch(`/api/v1/policy-groups/${id}`, data);
  return res.data;
};

export const deletePolicyGroup = async (id: string): Promise<PolicyGroup> => {
  const res = await apiClient.delete(`/api/v1/policy-groups/${id}`);
  return res.data;
};

// PolicyName CRUD
export const getAllPolicyNames = async (): Promise<PolicyName[]> => {
  const res = await apiClient.get('/api/v1/policy-names');
  return res.data;
};

export const getPolicyNamesByGroup = async (groupId: string): Promise<PolicyName[]> => {
  const res = await apiClient.get(`/api/v1/policy-groups/${groupId}/policy-names`);
  return res.data;
};

export const getPolicyName = async (id: string): Promise<PolicyName> => {
  const res = await apiClient.get(`/api/v1/policy-names/${id}`);
  return res.data;
};

export const createPolicyName = async (groupId: string, data: { name: string; description?: string | null }): Promise<PolicyName> => {
  const res = await apiClient.post(`/api/v1/policy-groups/${groupId}/policy-names`, data);
  return res.data;
};

export const updatePolicyName = async (id: string, data: { name: string; description?: string | null; policy_group_id: string }): Promise<PolicyName> => {
  const res = await apiClient.patch(`/api/v1/policy-names/${id}`, data);
  return res.data;
};

export const deletePolicyName = async (id: string): Promise<PolicyName> => {
  const res = await apiClient.delete(`/api/v1/policy-names/${id}`);
  return res.data;
}; 