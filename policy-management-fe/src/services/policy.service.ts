import axios from 'axios';
import type { Policy } from "../types/index";

const API_BASE_URL = (import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '');

export const getAllPolicies = async (params?: Record<string, unknown>): Promise<{ data: Policy[]; total: number; page: number; limit: number; pages: number }> => {
  const res = await axios.get(`${API_BASE_URL}/api/v1/policies`, { 
    params,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  // Normalize backend response shape { success, data, pagination } -> { data, total, page, limit, pages }
  const responseData = res.data;
  if (responseData && responseData.success && responseData.pagination) {
    return {
      data: responseData.data || [],
      total: responseData.pagination.total || 0,
      page: responseData.pagination.page || 1,
      limit: responseData.pagination.limit || 25,
      pages: responseData.pagination.pages || 0,
    };
  }
  return responseData;
};

export const getPolicyById = async (id: string): Promise<Policy> => {
  const res = await axios.get(`${API_BASE_URL}/api/v1/policies/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const createPolicy = async (data: FormData): Promise<Policy> => {
  const res = await axios.post(`${API_BASE_URL}/api/v1/policies`, data, {
    headers: { 
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const updatePolicy = async (id: string, data: FormData): Promise<Policy> => {
  const res = await axios.patch(`${API_BASE_URL}/api/v1/policies/${id}`, data, {
    headers: { 
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const deletePolicy = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/api/v1/policies/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
};

export const importPolicies = async (file: File): Promise<unknown> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await axios.post(`${API_BASE_URL}/api/v1/policies/import`, formData, {
    headers: { 
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const deleteDocument = async (documentId: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/api/v1/documents/${documentId}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("authToken")}`,
    },
  });
};

export const policyService = {
  getDashboardStats: async (timeRange: string = "7d") => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/policies/dashboard-stats`, {
      params: { timeRange },
      headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
    });
    return response.data;   
  }
}