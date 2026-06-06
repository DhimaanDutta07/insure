import axios from 'axios';

export interface CommissionRule {
  id: string;
  policy_name_id: string;
  policyStatus: 'Fresh' | 'Renewal' | 'Migration' | 'Portablity';
  ageCondition: 'LESS_THAN_60' | 'GREATER_THAN_60';
  deductibleType: 'DEDUCTABLE_ALL_SI' | 'LESS_THAN_10_LAKHS' | 'GREATER_EQUAL_10_LAKHS';
  commissionPercent: number;
  is_active: boolean;
}

export interface CommissionCalculationParams {
  policy_name_id: string;
  policy_creation_status: 'Fresh' | 'Renewal' | 'Migration' | 'Portablity';
  proposer_dob: string;
  sum_insured: number;
  deductible_amount_status: boolean;
  premium_amount: number;
}

export const commissionCalculationService = {
  // Fetch simplified commission for a policy name (first active rule)
  async getCommissionPercent(policyNameId: string): Promise<number> {
    try {
      const response = await axios.get(
        `${(import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '')}/api/v1/commission-rules/product/${policyNameId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );
      return response.data.commissionPercent || 0;
    } catch (error) {
      console.error('Error fetching commission percent:', error);
      return 0;
    }
  },

  // Calculate commission amount using full classification logic (status, SI)
  async calculateCommission(params: CommissionCalculationParams): Promise<{
    calculated_commission_amount: number;
    base_percentage: number;
    rule_found: boolean;
  }> {
    try {
      // Validate required parameters
      if (!params.policy_name_id || params.premium_amount === undefined) {
        return {
          calculated_commission_amount: 0,
          base_percentage: 0,
          rule_found: false,
        };
      }

      // Use the new calculate endpoint that considers status and SI
      const response = await axios.post(
        `${(import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '')}/api/v1/commission-rules/calculate`,
        {
          policy_name_id: params.policy_name_id,
          policy_creation_status: params.policy_creation_status,
          sum_insured: params.sum_insured,
          premium_amount: params.premium_amount,
          gst_status: params.deductible_amount_status,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      console.log('🔍 [Service Debug] Commission calculation:', {
        policy_name_id: params.policy_name_id,
        policy_creation_status: params.policy_creation_status,
        sum_insured: params.sum_insured,
        premium_amount: params.premium_amount,
        result: response.data,
      });

      return response.data;
    } catch (error) {
      console.error('Error calculating commission:', error);
      return {
        calculated_commission_amount: 0,
        base_percentage: 0,
        rule_found: false,
      };
    }
  },
}; 
