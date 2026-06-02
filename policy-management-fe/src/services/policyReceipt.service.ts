import axios from 'axios';
import type { PolicyReceipt } from "../types/index";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

export const getAllPolicyReceipts = async (): Promise<PolicyReceipt[]> => {
  const res = await axios.get(`${API_BASE_URL}/api/v1/policy-receipts`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const getPolicyReceiptById = async (id: string): Promise<PolicyReceipt> => {
  const res = await axios.get(`${API_BASE_URL}/api/v1/policy-receipts/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const createPolicyReceipt = async (data: FormData): Promise<PolicyReceipt> => {
  const res = await axios.post(`${API_BASE_URL}/api/v1/policy-receipts`, data, {
    headers: { 
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const updatePolicyReceipt = async (id: string, data: FormData): Promise<PolicyReceipt> => {
  const res = await axios.patch(`${API_BASE_URL}/api/v1/policy-receipts/${id}`, data, {
    headers: { 
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const deletePolicyReceipt = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/api/v1/policy-receipts/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
};

export const getPolicyReceiptsByTimePeriod = async (timePeriod: string): Promise<PolicyReceipt[]> => {
  const res = await axios.get(`${API_BASE_URL}/api/v1/policy-receipts/time-period/${timePeriod}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
}; 