import axios from 'axios';
import type { Policy } from '../types/index';

const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:3001/api/v1';

export interface PolicyTransitionData {
  policy_number: string;
  customer_name: string;
  company_id: string;
  policy_name_id: string;
  sum_insured: number;
  premium_amount: number;
  start_date: string;
  end_date: string;
  tenure_years: number;
  issued_date: string;
  [key: string]: string | number | boolean | null | undefined; // Allow additional fields
}

export interface TransitionEligibility {
  eligible: boolean;
  reasons: string[];
  requirements: string[];
}

export interface PolicyTransitionResult {
  data: Policy;
  message: string;
  documentReferences: number;
  errors: string[];
}

export interface PolicyTransitionHistory {
  parentPolicy?: Policy;
  childrenPolicies: Policy[];
  transitionHistory: Array<{
    policy: Policy;
    relationship: 'PARENT' | 'CHILD';
    transition_type: string;
  }>;
  completeHierarchy: Array<{
    policy: Policy;
    relationship: 'ANCESTOR' | 'PARENT' | 'CURRENT' | 'CHILD';
    transition_type: string | null;
    position: 'ANCESTOR' | 'PARENT' | 'CURRENT' | 'CHILD';
    generation: number; // Generation number (negative = child, 0 = current, positive = ancestor)
    claimsByYear?: Array<{ year: number; hasClaim: boolean; claimCount: number; totalPaid: number }>; // Optional claim summary
  }>;
}

export class PolicyTransitionService {
  
  // Create policy renewal
  static async createRenewal(parentPolicyId: string, newPolicyData: PolicyTransitionData): Promise<PolicyTransitionResult> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/policies/${parentPolicyId}/renew`,
        newPolicyData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(errorMessage);
    }
  }

  // Create policy migration
  static async createMigration(parentPolicyId: string, newPolicyData: PolicyTransitionData): Promise<PolicyTransitionResult> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/policies/${parentPolicyId}/migrate`,
        newPolicyData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create policy migration';
      throw new Error(errorMessage);
    }
  }

  // Create policy portability
  static async createPortability(parentPolicyId: string, newPolicyData: PolicyTransitionData): Promise<PolicyTransitionResult> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/policies/${parentPolicyId}/port`,
        newPolicyData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create policy portability';
      throw new Error(errorMessage);
    }
  }

  // Get policy transition history
  static async getTransitionHistory(policyId: string): Promise<PolicyTransitionHistory> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/policies/${policyId}/transition-history`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );
      return response.data.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get transition history';
      throw new Error(errorMessage);
    }
  }

  // Get policy documents with inheritance
  static async getPolicyDocuments(policyId: string, options?: {
    includeInherited?: boolean;
    transitionType?: string;
  }): Promise<{
    data: unknown[];
    stats: Record<string, unknown>;
    total: number;
    direct: number;
    referenced: number;
  }> {
    try {
      const params = new URLSearchParams();
      if (options?.includeInherited !== undefined) {
        params.append('includeInherited', options.includeInherited.toString());
      }
      if (options?.transitionType) {
        params.append('transitionType', options.transitionType);
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/v1/policies/${policyId}/documents?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get policy documents';
      throw new Error(errorMessage);
    }
  }

  // Validate transition eligibility
  static async validateEligibility(parentPolicyId: string, transitionType: 'RENEWAL' | 'MIGRATION' | 'PORTABILITY'): Promise<TransitionEligibility> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/policies/${parentPolicyId}/validate-eligibility?transitionType=${transitionType}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );
      return response.data.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to validate eligibility';
      throw new Error(errorMessage);
    }
  }

  // Get document access statistics
  static async getDocumentStats(policyId: string): Promise<{
    total: number;
    direct: number;
    referenced: number;
    byCategory: Record<string, number>;
  }> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/policies/${policyId}/document-stats`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );
      return response.data.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get document statistics';
      throw new Error(errorMessage);
    }
  }

  // Clear document cache
  static async clearDocumentCache(policyId: string): Promise<void> {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/v1/policies/${policyId}/document-cache`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear document cache';
      throw new Error(errorMessage);
    }
  }

  // Delete document reference
  static async deleteDocumentReference(referenceId: string): Promise<void> {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/v1/document-references/${referenceId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete document reference';
      throw new Error(errorMessage);
    }
  }

  // Get document transfer statistics for policy transition
  static async getDocumentTransferStats(
    parentPolicyId: string,
    transitionType: 'RENEWAL' | 'MIGRATION' | 'PORTABILITY'
  ): Promise<{
    totalDocuments: number;
    ancestorPolicies: Array<{
      policyId: string;
      policyNumber: string;
      documentCount: number;
      policyDocuments: number;
      proposerDocuments: number;
      memberDocuments: number;
    }>;
    documentBreakdown: {
      policyDocuments: number;
      proposerDocuments: number;
      memberDocuments: number;
    };
  }> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/policies/${parentPolicyId}/document-transfer-stats?transitionType=${transitionType}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );
      return response.data.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get document transfer statistics';
      throw new Error(errorMessage);
    }
  }
} 