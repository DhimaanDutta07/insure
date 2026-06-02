import axios from 'axios';
import type { CompanyFormField } from "../types/index";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

export const getCompanyFormFields = async (companyId: string): Promise<CompanyFormField[]> => {
  const res = await axios.get(`${API_BASE_URL}/api/v1/company-form-fields/${companyId}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const getCompanyFormFieldById = async (id: string): Promise<CompanyFormField> => {
  const res = await axios.get(`${API_BASE_URL}/api/v1/company-form-field/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const createCompanyFormField = async (data: Omit<CompanyFormField, 'id'>): Promise<CompanyFormField> => {
  const res = await axios.post(`${API_BASE_URL}/api/v1/company-form-fields`, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const updateCompanyFormField = async (id: string, data: Partial<Omit<CompanyFormField, 'id'>>): Promise<CompanyFormField> => {
  const res = await axios.patch(`${API_BASE_URL}/api/v1/company-form-field/${id}`, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data;
};

export const deleteCompanyFormField = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/api/v1/company-form-field/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
}; 