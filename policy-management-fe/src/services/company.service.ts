import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

export interface Company {
  id: string;
  name: string;
  category: 'HEALTH' | 'LIFE';
}

export interface CreateCompanyRequest {
  name: string;
  category: 'HEALTH' | 'LIFE';
}

export interface UpdateCompanyRequest {
  name?: string;
  category?: 'HEALTH' | 'LIFE';
}

export const getAllCompanies = async (): Promise<Company[]> => {
  const response = await axios.get(`${API_BASE_URL}/api/v1/companies`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return response.data;
};

export const getCompanyById = async (id: string): Promise<Company> => {
  const response = await axios.get(`${API_BASE_URL}/api/v1/companies/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return response.data;
};

export const createCompany = async (data: CreateCompanyRequest): Promise<Company> => {
  const response = await axios.post(`${API_BASE_URL}/api/v1/companies`, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return response.data;
};

export const updateCompany = async (id: string, data: UpdateCompanyRequest): Promise<Company> => {
  const response = await axios.patch(`${API_BASE_URL}/api/v1/companies/${id}`, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return response.data;
};

export const deleteCompany = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/api/v1/companies/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
};

export const getCompanyFormFields = async (companyId: string) => {
  const response = await axios.get(`${API_BASE_URL}/api/v1/companies/${companyId}/form-fields`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return response.data;
}; 