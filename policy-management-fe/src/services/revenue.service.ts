import axios from 'axios';
import type { Revenue } from "../types/index";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

export const getAllRevenues = async (): Promise<Revenue[]> => {
  const res = await axios.get(`${API_BASE_URL}/api/v1/revenues`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const getRevenueById = async (id: string): Promise<Revenue> => {
  const res = await axios.get(`${API_BASE_URL}/api/v1/revenues/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const createRevenue = async (data: Omit<Revenue, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>): Promise<Revenue> => {
  const res = await axios.post(`${API_BASE_URL}/api/v1/revenues`, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const updateRevenue = async (id: string, data: Partial<Omit<Revenue, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>>): Promise<Revenue> => {
  const res = await axios.patch(`${API_BASE_URL}/api/v1/revenues/${id}`, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const deleteRevenue = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/api/v1/revenues/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
};

export const getRevenuesByTimePeriod = async (timePeriod: string, siteId: string): Promise<Revenue[]> => {
  const res = await axios.get(`${API_BASE_URL}/api/v1/revenues/time-period/${timePeriod}/siteId/${siteId}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
}; 