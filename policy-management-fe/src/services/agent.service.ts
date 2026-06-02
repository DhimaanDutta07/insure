import axios from 'axios';
import type { Agent } from "../types/index";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

export const getAllAgents = async (): Promise<Agent[]> => {
  const res = await axios.get(`${API_BASE_URL}/api/v1/agents`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const getAgentById = async (id: string): Promise<Agent> => {
  const res = await axios.get(`${API_BASE_URL}/api/v1/agents/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const createAgent = async (data: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>): Promise<Agent> => {
  const res = await axios.post(`${API_BASE_URL}/api/v1/agents`, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const updateAgent = async (id: string, data: Partial<Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Agent> => {
  const res = await axios.patch(`${API_BASE_URL}/api/v1/agents/${id}`, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const deleteAgent = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/api/v1/agents/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
}; 