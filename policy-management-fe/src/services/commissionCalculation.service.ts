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

  // Calculate commission amount using simplified lookup
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

      // Simplified lookup: just get commission percent for this product
      const commissionPercent = await this.getCommissionPercent(params.policy_name_id);

      if (commissionPercent === 0) {
        return {
          calculated_commission_amount: 0,
          base_percentage: 0,
          rule_found: false,
        };
      }

      // Calculate commission
      const calculatedCommission = (params.premium_amount * commissionPercent) / 100;

      console.log('🔍 [Service Debug] Commission calculation:', {
        commissionPercent,
        premiumAmount: params.premium_amount,
        calculatedCommission,
      });

      return {
        calculated_commission_amount: calculatedCommission,
        base_percentage: commissionPercent,
        rule_found: true,
      };
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
