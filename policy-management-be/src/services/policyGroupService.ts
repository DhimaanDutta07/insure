import { PolicyGroup, PolicyName } from '@prisma/client';
import {
  createPolicyGroup,
  getAllPolicyGroups,
  getPolicyGroupById,
  updatePolicyGroup,
  deletePolicyGroup,
  createPolicyName,
  getAllPolicyNames,
  getPolicyNamesByGroupId,
  getPolicyNameById,
  updatePolicyName,
  deletePolicyName,
  PolicyGroupWithPolicyNames,
  PolicyNameWithPolicyGroup,
} from '../repositories/policyGroupRepository';

export type PolicyGroupWithNames = PolicyGroup & { itemNames: PolicyName[] };

export const addPolicyGroup = async (policyGroupData: { name: string; description?: string }): Promise<PolicyGroup> => {
  return createPolicyGroup(policyGroupData);
};

export const fetchAllPolicyGroups = async (): Promise<PolicyGroupWithPolicyNames[]> => {
  return getAllPolicyGroups();
};

export const fetchPolicyGroupById = async (id: string): Promise<PolicyGroup | null> => {
  return getPolicyGroupById(id);
};

export const modifyPolicyGroup = async (id: string, policyGroupData: { name?: string; description?: string }): Promise<PolicyGroup> => {
  return updatePolicyGroup(id, policyGroupData);
};

export const removePolicyGroup = async (id: string): Promise<PolicyGroup> => {
  return deletePolicyGroup(id);
};

export const addPolicyName = async (policyGroupId: string, policyNameData: { name: string; description?: string }): Promise<PolicyName> => {
  const data = { ...policyNameData, policy_group_id: policyGroupId };
  return createPolicyName(data);
};

export const fetchPolicyNamesByGroupId = async (policyGroupId: string): Promise<PolicyNameWithPolicyGroup[]> => {
  return getPolicyNamesByGroupId(policyGroupId);
};

export const fetchPolicyNameById = async (id: string): Promise<PolicyName | null> => {
  return getPolicyNameById(id);
};

export const modifyPolicyName = async (id: string, policyNameData: { name?: string; description?: string; policy_group_id: string }): Promise<PolicyName> => {
  return updatePolicyName(id, policyNameData);
};

export const removePolicyName = async (id: string): Promise<PolicyName> => {
  return deletePolicyName(id);
};

export const fetchAllPolicyNames = async (): Promise<PolicyNameWithPolicyGroup[]> => {
  return getAllPolicyNames();
};