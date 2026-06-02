import { Request, Response } from 'express';
import {
  addPolicyGroup,
  fetchAllPolicyGroups,
  fetchPolicyGroupById,
  modifyPolicyGroup,
  removePolicyGroup,
  addPolicyName,
  fetchPolicyNamesByGroupId,
  fetchPolicyNameById,
  modifyPolicyName,
  removePolicyName,
  fetchAllPolicyNames,
  PolicyGroupWithNames,
} from '../services/policyGroupService';
import { PolicyNameWithPolicyGroup } from '../repositories/policyGroupRepository';
import {
  createPolicyGroupSchema,
  updatePolicyGroupSchema,
  createPolicyNameSchema,
  updatePolicyNameSchema,
  getPolicyGroupSchema,
  getPolicyNamesSchema,
  getPolicyNameSchema,
  deletePolicyGroupSchema,
  deletePolicyNameSchema,
} from '../schemas/policyGroupSchema';
import { asyncTryCatch } from '../utils/errorHandler';

// PolicyGroup CRUD
export const createPolicyGroup = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
  const validatedData = createPolicyGroupSchema.parse({
    body: req.body
  });
  const { name, description } = validatedData.body;
  const policyGroup = await addPolicyGroup({ name, description: description || undefined });
  res.status(201).json(policyGroup);
});

export const getAllPolicyGroups = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
  const policyGroups = await fetchAllPolicyGroups();
  res.status(200).json({ policyGroups });
});

export const getPolicyGroup = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
  const validatedData = getPolicyGroupSchema.parse({
    params: req.params
  });
  const { id } = validatedData.params;
  const policyGroup = await fetchPolicyGroupById(id);
  if (!policyGroup) {
    res.status(404).json({ error: 'PolicyGroup not found' });
    return;
  }
  res.status(200).json(policyGroup);
});

export const updatePolicyGroup = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
  const validatedData = updatePolicyGroupSchema.parse({
    params: req.params,
    body: req.body
  });
  const { id } = validatedData.params;
  const { name, description } = validatedData.body;
  const updatedPolicyGroup = await modifyPolicyGroup(id, { name, description: description || undefined });
  res.status(200).json(updatedPolicyGroup);
});

export const deletePolicyGroup = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
  const validatedData = deletePolicyGroupSchema.parse({
    params: req.params
  });
  const { id } = validatedData.params;
  const deletedPolicyGroup = await removePolicyGroup(id);
  res.status(200).json(deletedPolicyGroup);
});

// PolicyName CRUD
export const createPolicyName = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
  const validatedData = createPolicyNameSchema.parse({
    params: req.params,
    body: req.body
  });
  const { id } = validatedData.params; // policyGroupId
  const { name, description } = validatedData.body;
  const policyName = await addPolicyName(id, { name, description: description || undefined });
  res.status(201).json(policyName);
});

export const getPolicyNames = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
  const validatedData = getPolicyNamesSchema.parse({
    params: req.params
  });
  const { id } = validatedData.params; // policyGroupId
  const policyNames = await fetchPolicyNamesByGroupId(id);
  res.status(200).json(policyNames);
});

export const getPolicyName = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
  const validatedData = getPolicyNameSchema.parse({
    params: req.params
  });
  const { id } = validatedData.params;
  const policyName = await fetchPolicyNameById(id);
  if (!policyName) {
    res.status(404).json({ error: 'PolicyName not found' });
    return;
  }
  res.status(200).json(policyName);
});

export const updatePolicyName = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
  const validatedData = updatePolicyNameSchema.parse({
    params: req.params,
    body: req.body
  });
  const { id } = validatedData.params;
  const { name, description, policy_group_id } = validatedData.body;
  if (!policy_group_id) {
    res.status(400).json({ error: 'policy_group_id is required' });
    return;
  }
  const updatedPolicyName = await modifyPolicyName(id, {
    name,
    description: description || undefined,
    policy_group_id
  });
  res.status(200).json(updatedPolicyName);
});

export const deletePolicyName = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
  const validatedData = deletePolicyNameSchema.parse({
    params: req.params
  });
  const { id } = validatedData.params;
  const deletedPolicyName = await removePolicyName(id);
  res.status(200).json(deletedPolicyName);
});

export const getAllPolicyNames = asyncTryCatch(async (req: Request, res: Response): Promise<void> => {
  const policyNames: PolicyNameWithPolicyGroup[] = await fetchAllPolicyNames();
  if (!policyNames) {
    res.status(404).json({ error: 'PolicyNames not found' });
    return;
  }
  res.status(200).json(policyNames);
});