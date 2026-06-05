import apiClient from './apiClient';
import { Enquiry } from "../types/enquiry";

export const enquiryService = {
  getAllEnquiries: async (): Promise<Enquiry[]> => {
    const response = await apiClient.get('/api/v1/enquiries');
    return response.data;
  },

  getEnquiryById: async (id: string): Promise<Enquiry> => {
    const response = await apiClient.get(`/api/v1/enquiries/${id}`);
    return response.data;
  },

  createEnquiry: async (enquiry: Omit<Enquiry, "id" | "createdAt" | "updatedAt">): Promise<Enquiry> => {
    const response = await apiClient.post('/api/v1/enquiries', enquiry);
    return response.data;
  },

  updateEnquiry: async (id: string, enquiry: Partial<Enquiry>): Promise<Enquiry> => {
    const response = await apiClient.put(`/api/v1/enquiries/${id}`, enquiry);
    return response.data;
  },

  deleteEnquiry: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/enquiries/${id}`);
  },
}; 