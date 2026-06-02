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
  commission_add_on_percentage?: number;
}

export const commissionCalculationService = {
  // Calculate age from date of birth
  calculateAge(dob: string): number {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  },

  // Determine age condition
  getAgeCondition(age: number): 'LESS_THAN_60' | 'GREATER_THAN_60' {
    return age < 60 ? 'LESS_THAN_60' : 'GREATER_THAN_60';
  },

  // Determine deductible type
  getDeductibleType(sumInsured: number, deductibleStatus: boolean): 'DEDUCTABLE_ALL_SI' | 'LESS_THAN_10_LAKHS' | 'GREATER_EQUAL_10_LAKHS' {
    if (deductibleStatus === true) {
      return 'DEDUCTABLE_ALL_SI';
    } else if (sumInsured < 1000000) {
      return 'LESS_THAN_10_LAKHS';
    } else {
      return 'GREATER_EQUAL_10_LAKHS';
    }
  },

  // Fetch commission rules for a policy name
  async getCommissionRules(policyNameId: string): Promise<CommissionRule[]> {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/v1/commission-rules/policy/${policyNameId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching commission rules:', error);
      return [];
    }
  },

  // Calculate commission amount
  async calculateCommission(params: CommissionCalculationParams): Promise<{
    calculated_commission_amount: number;
    base_percentage: number;
    add_on_percentage: number;
    total_percentage: number;
    rule_found: boolean;
  }> {
    try {
      // Validate required parameters
      if (!params.policy_name_id || !params.proposer_dob || !params.sum_insured || params.premium_amount === undefined) {
        return {
          calculated_commission_amount: 0,
          base_percentage: 0,
          add_on_percentage: 0,
          total_percentage: 0,
          rule_found: false,
        };
      }

      // Calculate age and conditions
      const age = this.calculateAge(params.proposer_dob);
      const ageCondition = this.getAgeCondition(age);
      const deductibleType = this.getDeductibleType(params.sum_insured, params.deductible_amount_status);

      // Fetch commission rules
      const rules = await this.getCommissionRules(params.policy_name_id);
      
      // Find matching rule
      const matchingRule = rules.find(rule => 
        rule.policyStatus === params.policy_creation_status &&
        rule.ageCondition === ageCondition &&
        rule.deductibleType === deductibleType &&
        rule.is_active === true
      );

      if (!matchingRule) {
        // Fallback: when no matching CommissionRule exists, use commission_add_on_percentage as standalone percentage
        const addOnPercentage = params.commission_add_on_percentage || 0;
        if (addOnPercentage > 0) {
          const fallbackCommission = (params.premium_amount * addOnPercentage) / 100;
          console.log('No matching rule, using add-on fallback:', {
            addOnPercentage,
            premiumAmount: params.premium_amount,
            fallbackCommission,
          });
          return {
            calculated_commission_amount: fallbackCommission,
            base_percentage: 0,
            add_on_percentage: addOnPercentage,
            total_percentage: addOnPercentage,
            rule_found: true, // Treat as found since we're using the add-on
          };
        }
        return {
          calculated_commission_amount: 0,
          base_percentage: 0,
          add_on_percentage: 0,
          total_percentage: 0,
          rule_found: false,
        };
      }

      // Calculate commission
      const basePercentage = matchingRule.commissionPercent || 0;
      const addOnPercentage = params.commission_add_on_percentage || 0;
      const totalPercentage = basePercentage + addOnPercentage;
      const calculatedCommission = (params.premium_amount * totalPercentage) / 100;

      console.log('🔍 [Service Debug] Commission calculation:', {
        basePercentage,
        addOnPercentage,
        totalPercentage,
        premiumAmount: params.premium_amount,
        calculatedCommission,
        inputAddOn: params.commission_add_on_percentage
      });

      return {
        calculated_commission_amount: calculatedCommission,
        base_percentage: basePercentage,
        add_on_percentage: addOnPercentage,
        total_percentage: totalPercentage,
        rule_found: true,
      };
    } catch (error) {
      console.error('Error calculating commission:', error);
      return {
        calculated_commission_amount: 0,
        base_percentage: 0,
        add_on_percentage: 0,
        total_percentage: 0,
        rule_found: false,
      };
    }
  },
}; 

