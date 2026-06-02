import axios from 'axios';
import type { Commission } from "../types/index";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

export const getAllCommissions = async (): Promise<Commission[]> => {
  const res = await axios.get(`${API_BASE_URL}/api/v1/commissions`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const getCommissionById = async (id: string): Promise<Commission> => {
  const res = await axios.get(`${API_BASE_URL}/api/v1/commissions/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const createCommission = async (data: Omit<Commission, 'id' | 'createdAt' | 'updatedAt'>): Promise<Commission> => {
  const res = await axios.post(`${API_BASE_URL}/api/v1/commissions`, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const updateCommission = async (id: string, data: Partial<Omit<Commission, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Commission> => {
  const res = await axios.patch(`${API_BASE_URL}/api/v1/commissions/${id}`, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const deleteCommission = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/api/v1/commissions/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
}; 