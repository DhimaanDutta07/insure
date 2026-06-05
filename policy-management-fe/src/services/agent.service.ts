import apiClient from './apiClient';
import type { Agent } from "../types/index";

export const getAllAgents = async (): Promise<Agent[]> => {
  const res = await apiClient.get('/api/v1/agents');
  return res.data;
};

export const getAgentById = async (id: string): Promise<Agent> => {
  const res = await apiClient.get(`/api/v1/agents/${id}`);
  return res.data;
};

export const createAgent = async (data: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>): Promise<Agent> => {
  const res = await apiClient.post('/api/v1/agents', data);
  return res.data;
};

export const updateAgent = async (id: string, data: Partial<Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Agent> => {
  const res = await apiClient.patch(`/api/v1/agents/${id}`, data);
  return res.data;
};

export const deleteAgent = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/v1/agents/${id}`);
}; 