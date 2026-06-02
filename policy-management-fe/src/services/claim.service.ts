import axios from 'axios';
import type { Claim, CreateClaimData } from "../types/claim";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

export const getPolicyClaims = async (policyId: string): Promise<Claim[]> => {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/v1/policies/${policyId}/claims`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
    });
    return res.data.data;
  } catch (error) {
    console.error('Error fetching policy claims:', error);
    throw error;
  }
};

export const getClaimById = async (claimId: string): Promise<Claim> => {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/v1/claims/${claimId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
    });
    return res.data.data;
  } catch (error) {
    console.error('Error fetching claim:', error);
    throw error;
  }
};

export const createClaim = async (policyId: string, data: CreateClaimData, files?: File[]): Promise<Claim> => {
  try {
    const formData = new FormData();
    
    // Add claim data
    formData.append('policy_id', data.policy_id);
    formData.append('claimant_type', data.claimant_type);
    formData.append('claim_amount', data.claim_amount.toString());
    formData.append('claim_type', data.claim_type);
    formData.append('is_full_claim', data.is_full_claim.toString());
    
    if (data.claim_remarks) {
      formData.append('claim_remarks', data.claim_remarks);
    }
    if (data.claim_date) {
      const dateValue = typeof data.claim_date === 'string' ? data.claim_date : data.claim_date.toISOString();
      formData.append('claim_date', dateValue);
    }
    
    // Add approval workflow fields
    if (data.claim_status) {
      formData.append('claim_status', data.claim_status);
    }
    if (data.approved_by) {
      formData.append('approved_by', data.approved_by);
    }
    if (data.approved_at) {
      const approvedDateValue = typeof data.approved_at === 'string' ? data.approved_at : data.approved_at.toISOString();
      formData.append('approved_at', approvedDateValue);
    }
    if (data.rejection_reason) {
      formData.append('rejection_reason', data.rejection_reason);
    }
    
    // Add members data - always send an array, even if empty
    const membersToSend = data.members || [];
    if (membersToSend.length > 0) {
      formData.append('members', JSON.stringify(membersToSend));
    }
    
    // Add files
    if (files) {
      files.forEach((file) => {
        formData.append('documents', file);
      });
    }
    
    const res = await axios.post(`${API_BASE_URL}/api/v1/policies/${policyId}/claims`, formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      },
    });
    return res.data.data;
  } catch (error) {
    console.error('Error creating claim:', error);
    throw error;
  }
};

export const updateClaimStatus = async (claimId: string, status: string, rejectionReason?: string): Promise<Claim> => {
  try {
    const requestData: { status: string; rejection_reason?: string } = { status };
    if (rejectionReason) {
      requestData.rejection_reason = rejectionReason;
    }
    
    const res = await axios.patch(`${API_BASE_URL}/api/v1/claims/${claimId}/status`, requestData, {
      headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
    });
    return res.data.data;
  } catch (error) {
    console.error('Error updating claim status:', error);
    throw error;
  }
};

export const updateClaim = async (claimId: string, data: CreateClaimData, files?: File[]): Promise<Claim> => {
  try {
    const formData = new FormData();
    
    // Add claim data
    formData.append('policy_id', data.policy_id);
    formData.append('claimant_type', data.claimant_type);
    formData.append('claim_amount', data.claim_amount.toString());
    formData.append('claim_type', data.claim_type);
    formData.append('is_full_claim', data.is_full_claim.toString());
    
    if (data.claim_remarks) {
      formData.append('claim_remarks', data.claim_remarks);
    }
    if (data.claim_date) {
      const dateValue = typeof data.claim_date === 'string' ? data.claim_date : data.claim_date.toISOString();
      formData.append('claim_date', dateValue);
    }
    
    // Add approval workflow fields
    if (data.claim_status) {
      formData.append('claim_status', data.claim_status);
    }
    if (data.approved_by) {
      formData.append('approved_by', data.approved_by);
    }
    if (data.approved_at) {
      const approvedDateValue = typeof data.approved_at === 'string' ? data.approved_at : data.approved_at.toISOString();
      formData.append('approved_at', approvedDateValue);
    }
    if (data.rejection_reason) {
      formData.append('rejection_reason', data.rejection_reason);
    }
    
    // Add members data - always send an array, even if empty
    const membersToSend = data.members || [];
    if (membersToSend.length > 0) {
      formData.append('members', JSON.stringify(membersToSend));
    }
    
    // Add files
    if (files) {
      files.forEach((file) => {
        formData.append('documents', file);
      });
    }
    
    const res = await axios.put(`${API_BASE_URL}/api/v1/claims/${claimId}`, formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      },
    });
    return res.data.data;
  } catch (error) {
    console.error('Error updating claim:', error);
    throw error;
  }
};

export const deleteClaim = async (claimId: string): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/api/v1/claims/${claimId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
    });
  } catch (error) {
    console.error('Error deleting claim:', error);
    throw error;
  }
}; 