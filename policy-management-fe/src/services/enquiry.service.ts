import axios from "axios";
import { Enquiry } from "../types/enquiry";

const API_URL = `${import.meta.env.VITE_BASE_URL}/api/v1`;

export const enquiryService = {
  getAllEnquiries: async (): Promise<Enquiry[]> => {
    const response = await axios.get(`${API_URL}/enquiries`, { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } });
    return response.data;
  },

  getEnquiryById: async (id: string): Promise<Enquiry> => {
    const response = await axios.get(`${API_URL}/enquiries/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } });
    return response.data;
  },

  createEnquiry: async (enquiry: Omit<Enquiry, "id" | "createdAt" | "updatedAt">): Promise<Enquiry> => {
    const response = await axios.post(`${API_URL}/enquiries`, enquiry, { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } });
    return response.data;
  },

  updateEnquiry: async (id: string, enquiry: Partial<Enquiry>): Promise<Enquiry> => {
    const response = await axios.put(`${API_URL}/enquiries/${id}`, enquiry, { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } });
    return response.data;
  },

  deleteEnquiry: async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/enquiries/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } });
  },
}; 