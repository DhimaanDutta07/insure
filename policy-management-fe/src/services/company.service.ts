import apiClient from './apiClient';

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
  const response = await apiClient.get('/api/v1/companies');
  return response.data;
};

export const getCompanyById = async (id: string): Promise<Company> => {
  const response = await apiClient.get(`/api/v1/companies/${id}`);
  return response.data;
};

export const createCompany = async (data: CreateCompanyRequest): Promise<Company> => {
  const response = await apiClient.post('/api/v1/companies', data);
  return response.data;
};

export const updateCompany = async (id: string, data: UpdateCompanyRequest): Promise<Company> => {
  const response = await apiClient.patch(`/api/v1/companies/${id}`, data);
  return response.data;
};

export const deleteCompany = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/v1/companies/${id}`);
};

export const getCompanyFormFields = async (companyId: string) => {
  const response = await apiClient.get(`/api/v1/companies/${companyId}/form-fields`);
  return response.data;
}; 